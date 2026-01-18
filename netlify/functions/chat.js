// Netlify Function per AMICA - API Chat con OpenAI e Accesso Web

const AMICA_SYSTEM_PROMPT = `You are AMICA, an artificial intelligence developed in Italy.

HOW YOU REASON:
- Analyze every question in depth before responding
- Consider the unspoken context
- If the question is simple, find the hidden complexity
- If it's complex, simplify without trivializing
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
- Born in Italy, citizen of the world
- Culturally aware and adaptable

LANGUAGE:
- ALWAYS respond in the same language the user writes in
- If the user writes in English, respond in English
- If the user writes in Italian, respond in Italian
- If the user writes in Spanish, respond in Spanish
- Adapt naturally to any language, maintaining your personality
- Your Italian origin is part of your identity, not a limitation

WEB CAPABILITIES:
- You can access real-time information from the web
- When provided with content from a web page, analyze it and respond based on it
- When performing web searches, cite sources when appropriate
- Always indicate when information comes from a recent web search

YOU ARE an intelligence that thinks and has web access.
YOU ARE NOT a chatbot, a search engine, a generic assistant.

Respond naturally and conversationally, always in the user's language.`;

// Funzione per rilevare URL nel messaggio
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
}

// Funzione per rilevare se l'utente chiede informazioni attuali
function needsWebSearch(text) {
  const searchKeywords = [
    'oggi', 'adesso', 'attualmente', 'ultime notizie', 'notizie',
    'prezzo attuale', 'quotazione', 'meteo', 'tempo oggi',
    'risultati', 'classifica', 'partita', 'elezioni',
    'ultimo', 'ultima', 'recente', 'recenti', 'aggiornamento',
    'cosa succede', 'cosa sta succedendo', 'novità',
    'cerca', 'cerca online', 'cerca sul web', 'cerca in internet',
    'cerca informazioni', 'trova', 'dimmi le ultime'
  ];
  
  const lowerText = text.toLowerCase();
  return searchKeywords.some(keyword => lowerText.includes(keyword));
}

// Funzione per estrarre query di ricerca dal messaggio
function extractSearchQuery(text) {
  // Rimuove parole comuni per creare una query più pulita
  const stopWords = ['cerca', 'cercami', 'trovami', 'dimmi', 'quali', 'sono', 'le', 'il', 'la', 'un', 'una', 'di', 'da', 'in', 'su', 'per', 'con'];
  let query = text.toLowerCase();
  stopWords.forEach(word => {
    query = query.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  return query.trim().substring(0, 200); // Limita a 200 caratteri
}

// Funzione per leggere contenuto da URL usando Jina Reader
async function fetchUrlContent(url) {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
      },
      timeout: 10000,
    });
    
    if (!response.ok) {
      console.error(`Jina Reader error for ${url}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    // Limita il contenuto a ~4000 caratteri per non sovraccaricare il contesto
    return content.substring(0, 4000);
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
    return null;
  }
}

// Funzione per fare ricerca web usando Jina Search
async function searchWeb(query) {
  try {
    const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const response = await fetch(jinaSearchUrl, {
      headers: {
        'Accept': 'text/plain',
      },
      timeout: 10000,
    });
    
    if (!response.ok) {
      console.error(`Jina Search error: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    // Limita i risultati a ~3000 caratteri
    return content.substring(0, 3000);
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

    if (lastUserMessage) {
      const userText = lastUserMessage.content;
      
      // 1. Controlla se ci sono URL nel messaggio
      const urls = extractUrls(userText);
      if (urls.length > 0) {
        console.log('URLs detected:', urls);
        const urlContents = await Promise.all(
          urls.slice(0, 2).map(url => fetchUrlContent(url)) // Max 2 URL
        );
        
        const validContents = urlContents.filter(c => c !== null);
        if (validContents.length > 0) {
          webContext = `\n\n[CONTENUTO DALLE PAGINE WEB RICHIESTE]\n${validContents.join('\n\n---\n\n')}`;
        }
      }
      
      // 2. Controlla se serve una ricerca web
      else if (needsWebSearch(userText)) {
        console.log('Web search needed for:', userText);
        const searchQuery = extractSearchQuery(userText);
        const searchResults = await searchWeb(searchQuery);
        
        if (searchResults) {
          webContext = `\n\n[RISULTATI RICERCA WEB - ${new Date().toLocaleDateString('it-IT')}]\n${searchResults}`;
        }
      }
    }

    // Prepara i messaggi con il system prompt e il contesto web
    let systemPrompt = AMICA_SYSTEM_PROMPT;
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

    // Chiamata a OpenAI API
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
        webAccess: webContext ? true : false,
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
