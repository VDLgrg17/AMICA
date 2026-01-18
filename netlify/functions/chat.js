// Netlify Function per AMICA - API Chat con OpenAI e Accesso Web

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
- When information comes from a web search, cite sources when appropriate

YOU ARE an intelligence that thinks and has web access.
YOU ARE NOT a chatbot, a search engine, a generic assistant.`;
}

// Funzione per rilevare URL nel messaggio
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
}

// Funzione per rilevare se l'utente chiede informazioni attuali
function needsWebSearch(text) {
  const lowerText = text.toLowerCase();
  
  // Keywords in italiano
  const italianKeywords = [
    'oggi', 'adesso', 'ora', 'attualmente', 'in questo momento',
    'ultime notizie', 'notizie', 'news',
    'prezzo', 'quotazione', 'valore', 'costo',
    'meteo', 'tempo', 'previsioni',
    'risultati', 'classifica', 'partita', 'match',
    'elezioni', 'votazioni',
    'ultimo', 'ultima', 'ultimi', 'ultime',
    'recente', 'recenti', 'nuovo', 'nuova', 'nuovi', 'nuove',
    'aggiornamento', 'aggiornamenti',
    'cosa succede', 'cosa sta succedendo', 'cosa è successo',
    'novità', 'breaking',
    'cerca', 'cercami', 'trovami', 'ricerca',
    'chi ha vinto', 'chi è morto', 'chi è nato',
    'quando è', 'dove si trova', 'come sta',
    'borsa', 'azioni', 'bitcoin', 'crypto', 'criptovalute',
    'covid', 'pandemia', 'virus',
    'guerra', 'conflitto',
    'presidente', 'governo', 'ministro',
    'terremoto', 'alluvione', 'incendio', 'disastro'
  ];
  
  // Keywords in inglese
  const englishKeywords = [
    'today', 'now', 'currently', 'right now', 'at the moment',
    'latest news', 'news', 'breaking',
    'price', 'stock', 'value', 'cost',
    'weather', 'forecast',
    'results', 'score', 'match', 'game',
    'election', 'vote',
    'latest', 'recent', 'new', 'current',
    'update', 'updates',
    'what happened', 'what is happening', 'whats going on',
    'search', 'find', 'look up',
    'who won', 'who died', 'who is',
    'when is', 'where is', 'how is',
    'market', 'stocks', 'bitcoin', 'crypto',
    'covid', 'pandemic', 'virus',
    'war', 'conflict',
    'president', 'government', 'minister',
    'earthquake', 'flood', 'fire', 'disaster'
  ];
  
  const allKeywords = [...italianKeywords, ...englishKeywords];
  return allKeywords.some(keyword => lowerText.includes(keyword));
}

// Funzione per estrarre query di ricerca dal messaggio
function extractSearchQuery(text) {
  // Rimuove parole comuni per creare una query più pulita
  const stopWords = [
    'cerca', 'cercami', 'trovami', 'dimmi', 'quali', 'sono', 'le', 'il', 'la', 'un', 'una', 'di', 'da', 'in', 'su', 'per', 'con',
    'search', 'find', 'tell', 'me', 'what', 'is', 'the', 'a', 'an', 'of', 'from', 'in', 'on', 'for', 'with'
  ];
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
          webContext = `\n\n[WEB CONTENT FROM REQUESTED PAGES]\n${validContents.join('\n\n---\n\n')}`;
        }
      }
      
      // 2. Controlla se serve una ricerca web
      else if (needsWebSearch(userText)) {
        console.log('Web search triggered for:', userText);
        const searchQuery = extractSearchQuery(userText);
        if (searchQuery.length > 3) { // Solo se la query ha senso
          const searchResults = await searchWeb(searchQuery);
          
          if (searchResults) {
            const now = new Date();
            webContext = `\n\n[WEB SEARCH RESULTS - ${now.toLocaleDateString('en-US')}]\n${searchResults}`;
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
