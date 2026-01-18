// Netlify Function per AMICA - API Chat con OpenAI e Accesso Web Intelligente

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
- When provided with web content, analyze it and respond based on it
- When information comes from a web search, mention it naturally in your response

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Uso il modello più veloce ed economico per questa decisione
        messages: [
          {
            role: 'system',
            content: `You are a decision helper. Your only job is to decide if a user question requires a web search to be answered properly.

Answer ONLY with a JSON object in this exact format:
{"search": true, "query": "search query here"} 
OR
{"search": false, "query": ""}

Search is needed when:
- The question is about current events, news, or recent happenings
- The question is about specific people, companies, or organizations that may have recent updates
- The question asks for prices, stock values, weather, sports results
- The question is about something that happened after your knowledge cutoff
- The question asks "who is", "what is", "tell me about" a specific person or entity
- The question requires up-to-date factual information

Search is NOT needed when:
- The question is about general knowledge, concepts, or definitions
- The question is philosophical or opinion-based
- The question is about how to do something (tutorials, instructions)
- The question is a simple greeting or casual conversation
- The question is about historical events (before 2023)

If search is needed, create a concise search query (max 5-6 words) that would find the most relevant information.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('Decision API error:', response.status);
      return { search: false, query: '' };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    try {
      // Estrai il JSON dalla risposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        console.log('Search decision:', decision);
        return decision;
      }
    } catch (e) {
      console.error('Error parsing decision:', e);
    }
    
    return { search: false, query: '' };
  } catch (error) {
    console.error('Decision error:', error);
    return { search: false, query: '' };
  }
}

// Funzione per leggere contenuto da URL usando Jina Reader
async function fetchUrlContent(url) {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
      },
    });
    
    if (!response.ok) {
      console.error(`Jina Reader error for ${url}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    return content.substring(0, 4000);
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
    return null;
  }
}

// Funzione per fare ricerca web usando Jina Search
async function searchWeb(query) {
  try {
    console.log('Searching web for:', query);
    const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const response = await fetch(jinaSearchUrl, {
      headers: {
        'Accept': 'text/plain',
      },
    });
    
    if (!response.ok) {
      console.error(`Jina Search error: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    console.log('Search results length:', content.length);
    return content.substring(0, 4000);
  } catch (error) {
    console.error(`Error searching web:`, error);
    return null;
  }
}

exports.handler = async (event, context) => {
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
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    // Prendi l'ultimo messaggio dell'utente
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let webContext = '';
    let searchPerformed = false;

    if (lastUserMessage) {
      const userText = lastUserMessage.content;
      
      // 1. Controlla se ci sono URL nel messaggio
      const urls = extractUrls(userText);
      if (urls.length > 0) {
        console.log('URLs detected:', urls);
        const urlContents = await Promise.all(
          urls.slice(0, 2).map(url => fetchUrlContent(url))
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
          const searchResults = await searchWeb(decision.query);
          
          if (searchResults) {
            const now = new Date();
            webContext = `\n\n[WEB SEARCH RESULTS - ${now.toLocaleDateString('en-US')} - Query: "${decision.query}"]\n${searchResults}`;
            searchPerformed = true;
          }
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
      console.error('OpenAI API error:', errorData);
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
        usage: data.usage,
        webAccess: searchPerformed,
      }),
    };
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
