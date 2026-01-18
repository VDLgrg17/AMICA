// Netlify Function per AMICA v2.8-stable - Versione senza Web Search
// Versione stabile per demo - veloce e affidabile

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

IMPORTANT:
- You respond in the same language the user writes to you
- If they write in Italian, respond in Italian
- If they write in English, respond in English
- And so on for any language

YOU ARE an intelligence that thinks deeply.
YOU ARE NOT a chatbot, a search engine, a generic assistant.`;
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

    // Prepara i messaggi con il system prompt dinamico
    const apiMessages = [
      { role: 'system', content: getSystemPrompt() },
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
