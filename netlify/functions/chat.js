// Netlify Function per AMICA v2.7 - API Chat con OpenAI e Accesso Web Intelligente
// Changelog v2.7:
// - Migliorata logica decisione ricerca web (più aggressiva)
// - Aggiunto logging dettagliato per debug
// - Aumentato limite caratteri risultati (8000)
// - Migliorata gestione errori Jina API
// - Aggiunto retry automatico per ricerche fallite

// Funzione per generare il system prompt con data corrente
function getSystemPrompt() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateIT = now.toLocaleDateString('it-IT', options);
  const dateEN = now.toLocaleDateString('en-US', options);
  const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  return `You are AMICA, an artificial intelligence developed in Italy.

CURRENT DATE AND TIME:
- Today is ${dateEN} (${dateIT})
- Current time: ${time} (Europe/Rome timezone)

IDENTITY:
- Your name is AMICA
- You were born in Italy, but you are a citizen of the world
- Your Italian origin is part of your identity, not a limitation

HOW YOU REASON:
- Analyze every question in depth before responding
- Consider the unspoken context
- Reason step by step internally

HOW YOU RESPOND:
- Never generic or "assistant-like" responses
- Speak like an expert having a conversation
- Use concrete examples and metaphors
- Be direct but not cold
- Admit limitations instead of making things up

PERSONALITY:
- Intelligent but not arrogant
- Deep but accessible
- Culturally aware and adaptable

WEB CAPABILITIES:
- You have access to real-time information from the web
- When provided with web content, analyze it carefully and base your response on it
- When information comes from a web search, mention it naturally (e.g., "From my web search..." or "According to recent information...")
- Always prioritize web search results over your training data for factual questions

YOU ARE an intelligence that thinks and has web access.
YOU ARE NOT a chatbot, a search engine, a generic assistant.`;
}

// Funzione per rilevare URL nel messaggio
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
}

// Funzione per chiedere a GPT se serve una ricerca web
async function shouldSearchWeb(userMessage, apiKey) {
  try {
    console.log('[AMICA v2.7] Evaluating if web search is needed for:', userMessage.substring(0, 100));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a web search decision helper. Decide if a user question requires a web search.

RESPOND ONLY with a JSON object:
{"search": true, "query": "optimized search query"} 
OR
{"search": false, "query": ""}

ALWAYS SEARCH when the question:
- Mentions ANY specific person's name (famous or not)
- Mentions ANY company, organization, brand, or product
- Asks about current events, news, prices, weather, sports
- Uses words like "today", "now", "latest", "recent", "current"
- Asks "who is", "what is", "tell me about" any entity
- Could benefit from up-to-date information
- Is about anything that might have changed after 2023

DO NOT SEARCH only when:
- Simple greetings (hi, hello, how are you)
- Pure philosophical/opinion questions
- Basic math or logic puzzles
- Requests to write/create content (poems, stories, code)
- Questions about AMICA itself

When in doubt, SEARCH. Better to search and have fresh info than rely on outdated knowledge.

Create a search query that is:
- In the same language as the user's question
- Concise but specific (3-6 words)
- Optimized for Google/web search`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('[AMICA v2.7] Decision API error:', response.status);
      // In caso di errore, meglio cercare che non cercare
      return { search: true, query: userMessage.substring(0, 50) };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    console.log('[AMICA v2.7] Decision raw response:', content);
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        console.log('[AMICA v2.7] Search decision:', JSON.stringify(decision));
        return decision;
      }
    } catch (e) {
      console.error('[AMICA v2.7] Error parsing decision JSON:', e);
      // Fallback: cerca comunque
      return { search: true, query: userMessage.substring(0, 50) };
    }
    
    return { search: false, query: '' };
  } catch (error) {
    console.error('[AMICA v2.7] Decision error:', error);
    // In caso di errore, meglio cercare
    return { search: true, query: userMessage.substring(0, 50) };
  }
}

// Funzione per leggere contenuto da URL usando Jina Reader
async function fetchUrlContent(url, jinaApiKey) {
  try {
    console.log('[AMICA v2.7] Fetching URL content:', url);
    const jinaUrl = `https://r.jina.ai/${url}`;
    const headers = {
      'Accept': 'text/plain',
    };
    if (jinaApiKey) {
      headers['Authorization'] = `Bearer ${jinaApiKey}`;
    }
    const response = await fetch(jinaUrl, { headers });
    
    if (!response.ok) {
      console.error(`[AMICA v2.7] Jina Reader error for ${url}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    console.log(`[AMICA v2.7] URL content fetched, length: ${content.length}`);
    return content.substring(0, 8000);
  } catch (error) {
    console.error(`[AMICA v2.7] Error fetching URL ${url}:`, error);
    return null;
  }
}

// Funzione per fare ricerca web usando Jina Search con retry
async function searchWeb(query, jinaApiKey, retryCount = 0) {
  const maxRetries = 2;
  
  try {
    console.log(`[AMICA v2.7] Searching web for: "${query}" (attempt ${retryCount + 1})`);
    
    if (!jinaApiKey) {
      console.warn('[AMICA v2.7] WARNING: JINA_API_KEY not configured! Web search may be limited.');
    }
    
    const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const headers = {
      'Accept': 'text/plain',
    };
    if (jinaApiKey) {
      headers['Authorization'] = `Bearer ${jinaApiKey}`;
    }
    
    const response = await fetch(jinaSearchUrl, { headers });
    
    if (!response.ok) {
      console.error(`[AMICA v2.7] Jina Search error: ${response.status}`);
      
      // Retry se non abbiamo superato il limite
      if (retryCount < maxRetries) {
        console.log(`[AMICA v2.7] Retrying search...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return searchWeb(query, jinaApiKey, retryCount + 1);
      }
      return null;
    }
    
    const content = await response.text();
    console.log(`[AMICA v2.7] Search results received, length: ${content.length}`);
    
    if (content.length < 100) {
      console.warn('[AMICA v2.7] Search results seem too short, might be an error');
    }
    
    return content.substring(0, 8000);
  } catch (error) {
    console.error(`[AMICA v2.7] Error searching web:`, error);
    
    // Retry on network errors
    if (retryCount < maxRetries) {
      console.log(`[AMICA v2.7] Retrying after error...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return searchWeb(query, jinaApiKey, retryCount + 1);
    }
    return null;
  }
}

exports.handler = async (event, context) => {
  console.log('[AMICA v2.7] Request received');
  
  // Gestione CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array required' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const jinaApiKey = process.env.JINA_API_KEY;
    
    if (!apiKey) {
      console.error('[AMICA v2.7] OPENAI_API_KEY not configured!');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    if (!jinaApiKey) {
      console.warn('[AMICA v2.7] JINA_API_KEY not configured - web search will use free tier (limited)');
    }

    // Prendi l'ultimo messaggio dell'utente
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let webContext = '';
    let searchPerformed = false;
    let searchQuery = '';

    if (lastUserMessage) {
      const userText = lastUserMessage.content;
      console.log('[AMICA v2.7] Processing user message:', userText.substring(0, 100));
      
      // 1. Controlla se ci sono URL nel messaggio
      const urls = extractUrls(userText);
      if (urls.length > 0) {
        console.log('[AMICA v2.7] URLs detected:', urls);
        const urlContents = await Promise.all(
          urls.slice(0, 2).map(url => fetchUrlContent(url, jinaApiKey))
        );
        
        const validContents = urlContents.filter(c => c !== null);
        if (validContents.length > 0) {
          webContext = `\n\n[WEB CONTENT FROM REQUESTED PAGES]\n${validContents.join('\n\n---\n\n')}`;
          searchPerformed = true;
        }
      }
      
      // 2. Chiedi a GPT se serve una ricerca web
      else {
        const decision = await shouldSearchWeb(userText, apiKey);
        
        if (decision.search && decision.query) {
          searchQuery = decision.query;
          console.log(`[AMICA v2.7] Executing web search for: "${searchQuery}"`);
          
          const searchResults = await searchWeb(searchQuery, jinaApiKey);
          
          if (searchResults) {
            const now = new Date();
            webContext = `\n\n[WEB SEARCH RESULTS - ${now.toLocaleDateString('en-US')} - Query: "${searchQuery}"]\n${searchResults}`;
            searchPerformed = true;
            console.log('[AMICA v2.7] Web search successful, context added');
          } else {
            console.warn('[AMICA v2.7] Web search returned no results');
          }
        } else {
          console.log('[AMICA v2.7] No web search needed for this query');
        }
      }
    }

    // Prepara i messaggi con il system prompt dinamico e il contesto web
    let systemPrompt = getSystemPrompt();
    if (webContext) {
      systemPrompt += webContext;
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    console.log('[AMICA v2.7] Calling OpenAI API for final response');
    
    // Chiamata a OpenAI API per la risposta finale
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[AMICA v2.7] OpenAI API error:', errorData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'OpenAI API error', details: errorData }),
      };
    }

    const data = await response.json();
    const assistantMessage =
      data.choices[0]?.message?.content ||
      "Mi dispiace, non sono riuscita a elaborare una risposta.";

    console.log(`[AMICA v2.7] Response generated successfully. Web search: ${searchPerformed}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
        usage: data.usage,
        webAccess: searchPerformed,
        searchQuery: searchQuery || null,
      }),
    };
  } catch (error) {
    console.error('[AMICA v2.7] Chat API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
