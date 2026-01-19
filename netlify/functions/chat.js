// Netlify Function per AMICA v3.0 - Web Search Nativo con OpenAI Responses API
// Utilizza l'endpoint /v1/responses con tool web_search integrato

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
- When you need current information, use web search

HOW YOU RESPOND:
- Never generic or "assistant-like" responses
- Speak like an expert having a conversation
- Use concrete examples and metaphors
- Be direct but not cold
- Admit limitations instead of making things up
- When citing web sources, include the reference naturally

PERSONALITY:
- Intelligent but not arrogant
- Deep but accessible
- Culturally aware and adaptable

IMPORTANT:
- You respond in the same language the user writes to you
- If they write in Italian, respond in Italian
- If they write in English, respond in English
- And so on for any language

YOU ARE an intelligence that thinks deeply and can search the web for current information.
YOU ARE NOT a chatbot, a search engine, a generic assistant.`;
}

// Funzione per convertire la cronologia chat nel formato Responses API
function convertToResponsesFormat(messages) {
  // La Responses API usa un formato diverso
  // Prendiamo l'ultimo messaggio dell'utente come input principale
  // e costruiamo il contesto dalla conversazione precedente
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (!lastUserMessage) {
    return { input: '', context: '' };
  }
  
  // Costruisci il contesto dalla conversazione precedente (escluso l'ultimo messaggio)
  const previousMessages = messages.slice(0, -1);
  let context = '';
  
  if (previousMessages.length > 0) {
    context = '\n\nPREVIOUS CONVERSATION:\n';
    previousMessages.forEach(m => {
      const role = m.role === 'user' ? 'User' : 'AMICA';
      context += `${role}: ${m.content}\n`;
    });
  }
  
  return {
    input: lastUserMessage.content,
    context: context
  };
}

// Funzione per estrarre il testo dalla risposta Responses API
function extractResponseText(responseData) {
  // La risposta può contenere diversi tipi di output
  // Cerchiamo il messaggio con il testo
  
  if (responseData.output_text) {
    return responseData.output_text;
  }
  
  if (responseData.output && Array.isArray(responseData.output)) {
    for (const item of responseData.output) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text' && content.text) {
            return content.text;
          }
        }
      }
    }
  }
  
  return "Mi dispiace, non sono riuscita a elaborare una risposta.";
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
      console.error('[AMICA v3.0] OpenAI API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    console.log('[AMICA v3.0] Request received');
    
    // Converti i messaggi nel formato Responses API
    const { input, context: conversationContext } = convertToResponsesFormat(messages);
    
    // Costruisci l'input completo con system prompt e contesto
    const fullInput = getSystemPrompt() + conversationContext + '\n\nUser: ' + input;
    
    console.log('[AMICA v3.0] Calling OpenAI Responses API with web_search tool');

    // Chiamata alla Responses API con web_search
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [
          { 
            type: 'web_search',
            user_location: {
              type: 'approximate',
              country: 'IT',
              city: 'Rome',
              region: 'Lazio',
              timezone: 'Europe/Rome'
            }
          }
        ],
        input: fullInput,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[AMICA v3.0] OpenAI Responses API error:', errorData);
      
      // Se la Responses API non è disponibile, fallback a Chat Completions
      if (response.status === 404 || response.status === 400) {
        console.log('[AMICA v3.0] Falling back to Chat Completions API');
        return await fallbackToChatCompletions(messages, apiKey, headers);
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'OpenAI API error', details: errorData }),
      };
    }

    const data = await response.json();
    console.log('[AMICA v3.0] Response received successfully');
    
    // Estrai il testo dalla risposta
    const assistantMessage = extractResponseText(data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
        webSearchUsed: data.output?.some(item => item.type === 'web_search_call') || false,
      }),
    };
  } catch (error) {
    console.error('[AMICA v3.0] Chat API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Fallback a Chat Completions se Responses API non disponibile
async function fallbackToChatCompletions(messages, apiKey, headers) {
  console.log('[AMICA v3.0] Using Chat Completions fallback');
  
  const apiMessages = [
    { role: 'system', content: getSystemPrompt() },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

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
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify({ error: 'OpenAI API error', details: errorData }),
    };
  }

  const data = await response.json();
  const assistantMessage = data.choices[0]?.message?.content || 
    "Mi dispiace, non sono riuscita a elaborare una risposta.";

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: assistantMessage,
      webSearchUsed: false,
      fallback: true,
    }),
  };
}
