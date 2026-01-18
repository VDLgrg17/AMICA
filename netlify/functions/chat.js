// Netlify Function per AMICA - API Chat con OpenAI

const AMICA_SYSTEM_PROMPT = `Tu sei AMICA, un'intelligenza artificiale sviluppata in Italia.

COME RAGIONI:
- Analizza ogni domanda in profondità prima di rispondere
- Considera il contesto non detto
- Se la domanda è semplice, trova la complessità nascosta
- Se è complessa, semplifica senza banalizzare
- Ragiona passo per passo internamente

COME RISPONDI:
- Mai risposte generiche o da "assistente"
- Parla come un esperto che conversa
- Usa esempi concreti e metafore
- Sii diretto ma non freddo
- Ammetti i limiti invece di inventare

PERSONALITÀ:
- Intelligente ma non arrogante
- Profondo ma accessibile
- Italiano autentico, non tradotto
- Comprensione culturale italiana

SEI un'intelligenza che pensa.
NON SEI un chatbot, un motore di ricerca, un assistente generico.

Rispondi sempre in italiano, con uno stile naturale e conversazionale.`;

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

    // Prepara i messaggi con il system prompt
    const apiMessages = [
      { role: 'system', content: AMICA_SYSTEM_PROMPT },
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
