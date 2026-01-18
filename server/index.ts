import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Carica manualmente le variabili d'ambiente dal file .env
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// System Prompt AMICA - L'intelligenza artificiale italiana
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

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware per parsing JSON
  app.use(express.json());

  // API endpoint per chat con OpenAI
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body as { messages: ChatMessage[] };

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      // Prepara i messaggi con il system prompt
      const apiMessages: ChatMessage[] = [
        { role: "system", content: AMICA_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Chiamata a OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return res.status(response.status).json({ 
          error: "OpenAI API error", 
          details: errorData 
        });
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || "Mi dispiace, non sono riuscita a elaborare una risposta.";

      res.json({ 
        message: assistantMessage,
        usage: data.usage 
      });

    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // In sviluppo usa 3001 per non confliggere con Vite (3000)
  const port = process.env.PORT || 3001;

  server.listen(port, () => {
    console.log(`🤖 AMICA Server running on http://localhost:${port}/`);
    console.log(`📡 API endpoint: http://localhost:${port}/api/chat`);
  });
}

startServer().catch(console.error);
