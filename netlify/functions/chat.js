// Netlify Function per AMICA v3.1 - Memoria intelligente con riassunto
// - Web Search Nativo con OpenAI Responses API
// - Limite 20 cicli + riassunto automatico

const MAX_CYCLES = 20; // Numero massimo di cicli prima del riassunto

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

// Funzione per generare un riassunto della conversazione
async function generateSummary(messages, apiKey) {
  console.log('[AMICA v3.1] Generating conversation summary...');
  
  // Costruisci il testo della conversazione da riassumere
  let conversationText = '';
  messages.forEach(m => {
    const role = m.role === 'user' ? 'User' : 'AMICA';
    conversationText += `${role}: ${m.content}\n\n`;
  });

  const summaryPrompt = `Riassumi questa conversazione in modo conciso ma completo. 
Cattura:
- Chi è l'utente (nome, se menzionato)
- Gli argomenti principali discussi
- Le informazioni chiave emerse
- Le preferenze o richieste specifiche dell'utente
- Eventuali decisioni prese o conclusioni raggiunte

Scrivi il riassunto in terza persona, in modo che possa essere usato come contesto per continuare la conversazione.
Massimo 300 parole.

CONVERSAZIONE DA RIASSUMERE:
${conversationText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Usiamo il modello più economico per i riassunti
        messages: [
          { role: 'system', content: 'Sei un assistente che crea riassunti concisi e informativi di conversazioni.' },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('[AMICA v3.1] Summary generation failed');
      return null;
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content;
    console.log('[AMICA v3.1] Summary generated successfully');
    return summary;
  } catch (error) {
    console.error('[AMICA v3.1] Summary generation error:', error);
    return null;
  }
}

// Funzione per convertire la cronologia chat nel formato Responses API
// con gestione della memoria intelligente
function convertToResponsesFormat(messages, existingSummary = null) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (!lastUserMessage) {
    return { input: '', context: '' };
  }
  
  // Calcola il numero di cicli (ogni ciclo = 1 domanda + 1 risposta)
  const userMessages = messages.filter(m => m.role === 'user');
  const cycleCount = userMessages.length;
  
  let context = '';
  
  // Aggiungi il riassunto se presente
  if (existingSummary) {
    context += `\n\nCONVERSATION SUMMARY (previous cycles):\n${existingSummary}\n`;
  }
  
  // Prendi solo gli ultimi MAX_CYCLES cicli per la conversazione recente
  // Un ciclo = 2 messaggi (user + assistant)
  const maxMessages = MAX_CYCLES * 2;
  const recentMessages = messages.slice(-maxMessages, -1); // Escludi l'ultimo messaggio (lo aggiungiamo dopo)
  
  if (recentMessages.length > 0) {
    context += '\n\nRECENT CONVERSATION:\n';
    recentMessages.forEach(m => {
      const role = m.role === 'user' ? 'User' : 'AMICA';
      context += `${role}: ${m.content}\n`;
    });
  }
  
  return {
    input: lastUserMessage.content,
    context: context,
    cycleCount: cycleCount
  };
}

// Funzione per estrarre il testo dalla risposta Responses API
function extractResponseText(responseData) {
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
    const { messages, conversationSummary } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array required' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('[AMICA v3.1] OpenAI API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    console.log('[AMICA v3.1] Request received');
    
    // Converti i messaggi nel formato Responses API
    const { input, context: conversationContext, cycleCount } = convertToResponsesFormat(messages, conversationSummary);
    
    console.log(`[AMICA v3.1] Cycle count: ${cycleCount}, Max cycles: ${MAX_CYCLES}`);
    
    // Verifica se dobbiamo generare un nuovo riassunto
    let newSummary = conversationSummary;
    let summaryGenerated = false;
    
    // Genera riassunto quando raggiungiamo il limite di cicli
    // e non abbiamo già un riassunto per questi cicli
    if (cycleCount > 0 && cycleCount % MAX_CYCLES === 0 && messages.length > 2) {
      // Prendi i messaggi da riassumere (quelli più vecchi)
      const messagesToSummarize = messages.slice(0, -2); // Escludi gli ultimi 2 (ultimo ciclo)
      
      if (messagesToSummarize.length > 0) {
        const generatedSummary = await generateSummary(messagesToSummarize, apiKey);
        if (generatedSummary) {
          // Combina con il riassunto esistente se presente
          if (conversationSummary) {
            newSummary = `${conversationSummary}\n\nAdditional context:\n${generatedSummary}`;
          } else {
            newSummary = generatedSummary;
          }
          summaryGenerated = true;
          console.log('[AMICA v3.1] New summary generated and combined');
        }
      }
    }
    
    // Costruisci l'input completo con system prompt e contesto
    const fullInput = getSystemPrompt() + conversationContext + '\n\nUser: ' + input;
    
    console.log('[AMICA v3.1] Calling OpenAI Responses API with web_search tool');

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
      console.error('[AMICA v3.1] OpenAI Responses API error:', errorData);
      
      // Se la Responses API non è disponibile, fallback a Chat Completions
      if (response.status === 404 || response.status === 400) {
        console.log('[AMICA v3.1] Falling back to Chat Completions API');
        return await fallbackToChatCompletions(messages, apiKey, headers, newSummary, summaryGenerated);
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'OpenAI API error', details: errorData }),
      };
    }

    const data = await response.json();
    console.log('[AMICA v3.1] Response received successfully');
    
    // Estrai il testo dalla risposta
    const assistantMessage = extractResponseText(data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
        webSearchUsed: data.output?.some(item => item.type === 'web_search_call') || false,
        conversationSummary: newSummary,
        summaryGenerated: summaryGenerated,
        cycleCount: cycleCount,
      }),
    };
  } catch (error) {
    console.error('[AMICA v3.1] Chat API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Fallback a Chat Completions se Responses API non disponibile
async function fallbackToChatCompletions(messages, apiKey, headers, summary, summaryGenerated) {
  console.log('[AMICA v3.1] Using Chat Completions fallback');
  
  // Costruisci i messaggi con il riassunto se presente
  let systemContent = getSystemPrompt();
  if (summary) {
    systemContent += `\n\nCONVERSATION SUMMARY (previous cycles):\n${summary}`;
  }
  
  // Limita i messaggi agli ultimi MAX_CYCLES cicli
  const maxMessages = MAX_CYCLES * 2;
  const recentMessages = messages.slice(-maxMessages);
  
  const apiMessages = [
    { role: 'system', content: systemContent },
    ...recentMessages.map((m) => ({
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
      conversationSummary: summary,
      summaryGenerated: summaryGenerated,
    }),
  };
}
