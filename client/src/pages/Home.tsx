/**
 * AMICA - L'intelligenza artificiale italiana
 * Design con LUCI, RIFLESSI, PROFONDITÀ 3D
 * Con: Microfono, Animazione caricamento, Dark Mode
 */

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Menu, X, MessageSquare, Plus, Sparkles, Mic, MicOff, Moon, Sun, Phone, PhoneOff, Volume2, VolumeX, Share2 } from "lucide-react";
import { InstallPrompt } from "../components/InstallPrompt";
import { ShareModal } from "../components/ShareModal";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  conversationSummary?: string; // Riassunto dei cicli precedenti per memoria intelligente
  createdAt: Date;
  updatedAt: Date;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Componente animazione di caricamento premium
const LoadingAnimation = ({ isDark }: { isDark: boolean }) => (
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      {/* Cerchi pulsanti con effetto onda */}
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-amber-400' : 'bg-gradient-to-br from-[#ffd700] to-[#cc9900]'} animate-bounce shadow-lg shadow-amber-500/40`} style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
        <div className={`absolute inset-0 w-3 h-3 rounded-full ${isDark ? 'bg-amber-400/50' : 'bg-amber-400/30'} animate-ping`} style={{ animationDelay: "0ms" }} />
      </div>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-amber-400' : 'bg-gradient-to-br from-[#ffd700] to-[#cc9900]'} animate-bounce shadow-lg shadow-amber-500/40`} style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
        <div className={`absolute inset-0 w-3 h-3 rounded-full ${isDark ? 'bg-amber-400/50' : 'bg-amber-400/30'} animate-ping`} style={{ animationDelay: "150ms" }} />
      </div>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-amber-400' : 'bg-gradient-to-br from-[#ffd700] to-[#cc9900]'} animate-bounce shadow-lg shadow-amber-500/40`} style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
        <div className={`absolute inset-0 w-3 h-3 rounded-full ${isDark ? 'bg-amber-400/50' : 'bg-amber-400/30'} animate-ping`} style={{ animationDelay: "300ms" }} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Sparkles size={16} className={`${isDark ? 'text-amber-400' : 'text-amber-500'} animate-pulse`} />
      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>AMICA sta pensando...</span>
    </div>
  </div>
);

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [justInstalled, setJustInstalled] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Inizializza Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'it-IT';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputValue(transcript);
        
        // Se il risultato è finale e siamo in modalità vocale, invia automaticamente
        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal && transcript.trim()) {
          // Usa setTimeout per permettere all'input di aggiornarsi
          setTimeout(() => {
            const sendBtn = document.getElementById('send-button');
            if (sendBtn) sendBtn.click();
          }, 100);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Carica preferenza dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("amica-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  // Salva preferenza dark mode
  useEffect(() => {
    localStorage.setItem("amica-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Il tuo browser non supporta la dettatura vocale. Prova con Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Funzione Text-to-Speech con OpenAI
  const speakText = async (text: string, forceSpeak: boolean = false) => {
    // In modalità vocale, parla sempre; altrimenti rispetta voiceEnabled
    if (!forceSpeak && !voiceEnabled && !isVoiceMode) return;
    
    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('TTS error');
      }

      const data = await response.json();
      
      // Crea e riproduci l'audio
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // In modalità vocale continua, riavvia automaticamente l'ascolto
        if (isVoiceMode && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              // Ignora errori se già in ascolto
              console.log('Recognition already started');
            }
          }, 500);
        }
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Anche in caso di errore, riprova ad ascoltare in modalità vocale
        if (isVoiceMode && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.log('Recognition error recovery');
            }
          }, 500);
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      // Anche in caso di errore TTS, riprova ad ascoltare in modalità vocale
      if (isVoiceMode && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.log('Recognition error recovery');
          }
        }, 500);
      }
    }
  };

  // Ferma la riproduzione audio
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Toggle modalità conversazione vocale
  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      // Disattiva modalità vocale
      setIsVoiceMode(false);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      stopSpeaking();
    } else {
      // Attiva modalità vocale
      if (!recognitionRef.current) {
        alert("Il tuo browser non supporta la modalità vocale. Prova con Chrome.");
        return;
      }
      setIsVoiceMode(true);
      setVoiceEnabled(true);
      // Inizia ad ascoltare
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem("amica-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        })));
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id);
        }
      } catch (e) {
        console.error("Error loading conversations:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("amica-conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "Nuova conversazione",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setIsSidebarOpen(false);
    inputRef.current?.focus();
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Chiamata reale all'API OpenAI tramite backend con memoria intelligente
  const callAmicaAPI = async (conversationMessages: Message[], existingSummary?: string): Promise<{message: string, newSummary?: string}> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          conversationSummary: existingSummary,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Errore nella risposta');
      }

      const data = await response.json();
      return {
        message: data.message,
        newSummary: data.conversationSummary,
      };
    } catch (error) {
      console.error('Errore chiamata API:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Ferma la dettatura se attiva
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    let convId = currentConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: generateId(),
        title: inputValue.trim().substring(0, 30) + (inputValue.length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [newConv, ...prev]);
      convId = newConv.id;
      setCurrentConversationId(convId);
    }

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: [...c.messages, userMessage],
          updatedAt: new Date(),
          title: c.messages.length === 0 
            ? inputValue.trim().substring(0, 30) + (inputValue.length > 30 ? "..." : "")
            : c.title,
        };
      }
      return c;
    }));

    setInputValue("");
    setIsLoading(true);

    try {
      // Ottieni tutti i messaggi della conversazione corrente per il contesto
      const currentConv = conversations.find(c => c.id === convId);
      const allMessages = currentConv ? [...currentConv.messages, userMessage] : [userMessage];
      const existingSummary = currentConv?.conversationSummary;
      
      const { message: responseText, newSummary } = await callAmicaAPI(allMessages, existingSummary);
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage],
            conversationSummary: newSummary || c.conversationSummary, // Aggiorna il summary se presente
            updatedAt: new Date(),
          };
        }
        return c;
      }));

      // Leggi la risposta (la funzione speakText gestisce internamente quando parlare)
      speakText(responseText);
    } catch (error) {
      console.error("Error:", error);
      // Mostra messaggio di errore all'utente
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Mi dispiace, si è verificato un errore nella comunicazione. Riprova tra qualche istante.",
        timestamp: new Date(),
      };
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            messages: [...c.messages, errorMessage],
            updatedAt: new Date(),
          };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Classi dinamiche per dark/light mode
  const bgMain = isDarkMode 
    ? "bg-gradient-to-br from-[#0a1628] via-[#0f1f35] to-[#0a1628]" 
    : "bg-gradient-to-br from-white via-gray-50 to-white";
  
  const textMain = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-600";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";

  // Callback quando l'app viene installata
  const handleInstalled = () => {
    setJustInstalled(true);
    // Aggiungi un messaggio di benvenuto post-installazione
    if (!currentConversationId) {
      // Crea una nuova conversazione con il messaggio di benvenuto
      const newConv: Conversation = {
        id: generateId(),
        title: "Benvenuto!",
        messages: [{
          id: generateId(),
          role: "assistant",
          content: "Perfetto! Ora sono sempre con te. 💛\n\nMi trovi sulla tua schermata home, pronta quando vuoi parlare. Non devi più cercarmi - sono qui, a un tap di distanza.\n\nCosa posso fare per te oggi?",
          timestamp: new Date(),
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-['Inter',sans-serif] ${isDarkMode ? 'dark' : ''}`}>
      {/* Prompt di installazione PWA */}
      <InstallPrompt onInstalled={handleInstalled} />
      {/* Modale Condivisione */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      {/* SFONDO CON EFFETTI LUMINOSI */}
      <div className={`fixed inset-0 z-0 ${bgMain}`}>
        {/* Riflessi di luce */}
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] ${isDarkMode ? 'bg-gradient-radial from-blue-500/10 via-blue-400/5 to-transparent' : 'bg-gradient-radial from-amber-200/30 via-amber-100/10 to-transparent'} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] ${isDarkMode ? 'bg-gradient-radial from-amber-500/10 via-amber-400/5 to-transparent' : 'bg-gradient-radial from-blue-200/20 via-blue-100/10 to-transparent'} rounded-full blur-3xl`} />
        
        {/* Linee dorate sottili */}
        <div className={`absolute top-[30%] left-0 right-0 h-[1px] ${isDarkMode ? 'bg-gradient-to-r from-transparent via-amber-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-300/40 to-transparent'}`} />
        <div className={`absolute top-[70%] left-0 right-0 h-[1px] ${isDarkMode ? 'bg-gradient-to-r from-transparent via-amber-500/15 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-300/30 to-transparent'}`} />
      </div>

      {/* Sidebar con profondità */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 
        bg-gradient-to-b from-[#1a2a4a] via-[#1e3a5f] to-[#0f1f35]
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        shadow-[10px_0_60px_rgba(0,0,0,0.3)]
      `}>
        {/* Riflesso luminoso sulla sidebar */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ff5f57] shadow-lg shadow-red-500/30"></div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#ffd93d] to-[#febc2e] shadow-lg shadow-yellow-500/30"></div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#6bcb77] to-[#28c840] shadow-lg shadow-green-500/30"></div>
              </div>
              {/* Toggle Dark Mode */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title={isDarkMode ? "Passa a Light Mode" : "Passa a Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-white/70" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Logo 3D con riflessi */}
                <div className="relative group">
                  {/* Glow esterno */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
                  {/* Logo con gradiente metallico */}
                  <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#2d5a87] via-[#3d7ab7] to-[#1e4a77] flex items-center justify-center shadow-xl shadow-blue-900/50 border border-white/20">
                    {/* Riflesso superiore */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl" />
                    <span className="relative text-xs font-bold text-white drop-shadow-lg">AMICA</span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-white text-base drop-shadow">AMICA</span>
                  <p className="text-[11px] text-cyan-300/80">L'intelligenza italiana</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Pulsante Nuova Chat 3D con glow dorato */}
            <button
              onClick={createNewConversation}
              className="relative w-full group"
            >
              {/* Glow dorato */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 py-3 px-4 
                bg-gradient-to-b from-[#ffd700] via-[#e5b800] to-[#cc9900]
                text-[#1a2a4a] font-semibold text-sm rounded-xl
                shadow-lg shadow-amber-500/30
                border-t border-amber-200/50
                group-hover:from-[#ffe44d] group-hover:via-[#ffd700] group-hover:to-[#e5b800]
                active:from-[#cc9900] active:to-[#b38600]
                transition-all duration-150">
                {/* Riflesso superiore */}
                <div className="absolute inset-x-2 top-1 h-3 bg-gradient-to-b from-white/40 to-transparent rounded-full" />
                <Plus size={16} strokeWidth={2.5} className="relative" />
                <span className="relative">Nuova chat</span>
                <Sparkles size={14} className="relative opacity-70" />
              </div>
            </button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto p-3">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                    <MessageSquare className="text-white/40" size={28} />
                  </div>
                </div>
                <p className="text-white/50 text-sm">Nessuna conversazione</p>
                <p className="text-white/30 text-xs mt-1">Inizia a chattare con AMICA</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`
                      group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                      ${conv.id === currentConversationId 
                        ? "bg-gradient-to-r from-white/15 to-white/5 border border-cyan-400/30 shadow-lg shadow-cyan-500/10" 
                        : "hover:bg-white/5 border border-transparent"}
                    `}
                    onClick={() => {
                      setCurrentConversationId(conv.id);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                      ${conv.id === currentConversationId 
                        ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-md shadow-cyan-500/30" 
                        : "bg-white/10 text-white/50"}
                    `}>
                      <MessageSquare size={14} />
                    </div>
                    <span className="flex-1 truncate text-sm text-white/80">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md transition-all"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
              <Sparkles size={12} className="text-amber-400" />
              <span>AMICA v1.0</span>
              <span>•</span>
              <span>FXG Engineering S.r.l.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header con effetto vetro e profondità */}
        <header className={`flex items-center gap-4 px-6 py-4 ${isDarkMode ? 'bg-[#0f1f35]/80' : 'bg-white/70'} backdrop-blur-xl border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200/50'} sticky top-0 z-10 shadow-sm`}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`lg:hidden p-2 ${isDarkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-100 text-gray-600'} rounded-xl transition-colors`}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink min-w-0">
            {/* Logo 3D con riflessi e glow */}
            <div className="relative group flex-shrink-0">
              {/* Glow esterno blu */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
              {/* Ombra profonda */}
              <div className="absolute inset-0 translate-y-2 bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35] rounded-2xl blur-md opacity-50" />
              {/* Logo principale */}
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#3d7ab7] via-[#2d5a87] to-[#1e4a77] flex items-center justify-center shadow-2xl border border-white/20">
                {/* Riflesso superiore */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-xl sm:rounded-t-2xl" />
                {/* Riflesso laterale */}
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/20 to-transparent rounded-l-xl sm:rounded-l-2xl" />
                <span className="relative text-xs sm:text-sm font-bold text-white drop-shadow-lg">AMICA</span>
              </div>
              {/* Indicatore online con glow dorato */}
              <div className="absolute -bottom-1 -right-1">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-sm animate-pulse" />
                <div className="relative w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-[#ffd700] to-[#cc9900] rounded-full border-2 border-white shadow-lg shadow-amber-500/50" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className={`font-semibold text-xl ${textMain}`}>AMICA</h1>
              <p className={`text-xs ${textMuted}`}>L'intelligenza artificiale italiana</p>
            </div>
          </div>
          
          {/* Controlli vocali e Dark Mode */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Pulsante Voce: ferma audio se in riproduzione, altrimenti toggle on/off */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  // Se sta parlando, ferma l'audio
                  stopSpeaking();
                } else {
                  // Altrimenti toggle voce on/off
                  setVoiceEnabled(!voiceEnabled);
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                isSpeaking 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={isSpeaking ? "Ferma la voce" : (voiceEnabled ? "Disattiva risposte vocali" : "Attiva risposte vocali")}
            >
              {isSpeaking ? (
                <VolumeX size={18} className="text-white" />
              ) : voiceEnabled ? (
                <Volume2 size={18} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
              ) : (
                <VolumeX size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </button>
            
            {/* Pulsante Modalità Conversazione Vocale */}
            <button
              onClick={toggleVoiceMode}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isVoiceMode 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 animate-pulse' 
                  : isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={isVoiceMode ? "Termina conversazione vocale" : "Avvia conversazione vocale"}
            >
              {isVoiceMode ? (
                <PhoneOff size={18} className="text-white" />
              ) : (
                <Phone size={18} className={isDarkMode ? 'text-white/70' : 'text-gray-600'} />
              )}
            </button>

            {/* Toggle Dark Mode */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              title={isDarkMode ? "Passa a Light Mode" : "Passa a Dark Mode"}
            >
              {isDarkMode ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-gray-600" />
              )}
            </button>

            {/* Pulsante Condividi - sempre visibile con testo */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-1.5"
              title="Condividi AMICA"
            >
              <span className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">Condividi</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-2xl text-center">
                {/* Logo centrale MEGA 3D con tutti gli effetti */}
                <div className="relative inline-block mb-10">
                  {/* Glow esterno grande */}
                  <div className={`absolute -inset-8 ${isDarkMode ? 'bg-gradient-to-r from-amber-500/20 via-blue-500/10 to-amber-500/20' : 'bg-gradient-to-r from-amber-300/30 via-blue-300/20 to-amber-300/30'} rounded-full blur-3xl animate-pulse`} />
                  {/* Glow medio */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/40 to-cyan-400/40 rounded-3xl blur-xl" />
                  {/* Ombra profonda */}
                  <div className="absolute inset-0 translate-y-4 bg-gradient-to-br from-[#1e3a5f] to-black rounded-3xl blur-xl opacity-40" />
                  {/* Logo principale */}
                  <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-[#4d8ac7] via-[#2d5a87] to-[#1e4a77] flex items-center justify-center shadow-2xl border border-white/30">
                    {/* Riflesso superiore forte */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent rounded-t-3xl" />
                    {/* Riflesso laterale */}
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/30 to-transparent rounded-l-3xl" />
                    {/* Bordo luminoso */}
                    <div className="absolute inset-0 rounded-3xl border border-white/40" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)' }} />
                    <span className="relative text-2xl font-bold text-white drop-shadow-lg">AMICA</span>
                  </div>
                  {/* Accento dorato 3D */}
                  <div className="absolute -bottom-2 -right-2">
                    <div className="absolute inset-0 bg-amber-400 rounded-xl blur-md animate-pulse" />
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] via-[#e5b800] to-[#cc9900] flex items-center justify-center shadow-xl border-t border-amber-200/50">
                      <div className="absolute inset-x-1 top-1 h-2 bg-gradient-to-b from-white/50 to-transparent rounded-full" />
                      <Sparkles size={18} className="text-white drop-shadow relative" />
                    </div>
                  </div>
                </div>

                <h2 className={`text-3xl font-semibold mb-4 ${textMain}`}>
                  Benvenuto in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2d5a87] to-[#4d8ac7]">AMICA</span>
                </h2>
                <p className={`${textSecondary} mb-10 text-base leading-relaxed max-w-lg mx-auto`}>
                  Sono <span className="font-semibold text-[#2d5a87]">AMICA</span>, l'intelligenza artificiale italiana. 
                  Non sono un chatbot generico: sono un'intelligenza con cui vale la pena parlare.
                </p>

                {/* Card suggerimenti 3D con profondità */}
                <div className="grid gap-4 sm:grid-cols-2 text-left">
                  {[
                    { text: "Mi servono delle informazioni. Informazioni e curiosità.", icon: "💡", accent: "amber" },
                    { text: "Aiutami a ragionare su un problema", icon: "🧠", accent: "blue" },
                    { text: "Dammi un'opinione su un argomento", icon: "💬", accent: "amber" },
                    { text: "Parliamo di filosofia o scienza", icon: "🔬", accent: "blue" },
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(suggestion.text);
                        inputRef.current?.focus();
                      }}
                      className="group relative"
                    >
                      {/* Ombra profonda */}
                      <div className={`absolute inset-0 translate-y-2 ${isDarkMode ? 'bg-black/30' : 'bg-gray-300/50'} rounded-2xl blur-md group-hover:translate-y-3 transition-transform`} />
                      {/* Card */}
                      <div className={`
                        relative p-5 rounded-2xl text-left transition-all duration-200
                        ${isDarkMode 
                          ? 'bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35] border-white/10' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}
                        border
                        shadow-lg
                        group-hover:shadow-xl group-hover:-translate-y-1
                      `}>
                        {/* Riflesso superiore */}
                        <div className={`absolute inset-x-0 top-0 h-1/2 ${isDarkMode ? 'bg-gradient-to-b from-white/10 to-transparent' : 'bg-gradient-to-b from-white to-transparent'} rounded-t-2xl pointer-events-none`} />
                        <span className="text-3xl mb-3 block drop-shadow-sm relative">{suggestion.icon}</span>
                        <span className={`${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'} text-sm relative`}>{suggestion.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar 3D */}
                  <div className="relative flex-shrink-0">
                    {message.role === "assistant" && (
                      <div className="absolute -inset-1 bg-blue-400/30 rounded-xl blur-md" />
                    )}
                    <div className={`
                      relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold
                      ${message.role === "user" 
                        ? `${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 border-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 border-gray-300'} border shadow-md` 
                        : "bg-gradient-to-br from-[#3d7ab7] via-[#2d5a87] to-[#1e4a77] text-white shadow-lg shadow-blue-500/30 border border-white/20"}
                    `}>
                      {message.role === "assistant" && (
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl" />
                      )}
                      <span className="relative">{message.role === "user" ? "Tu" : "A"}</span>
                    </div>
                  </div>

                  {/* Content con profondità */}
                  <div className={`flex-1 min-w-0 ${message.role === "user" ? "text-right" : ""}`}>
                    <div className="relative inline-block max-w-full">
                      {message.role === "user" && (
                        <div className="absolute inset-0 translate-y-1 bg-blue-900/20 rounded-2xl blur-md" />
                      )}
                      <div className={`
                        relative p-4 rounded-2xl text-left leading-relaxed
                        ${message.role === "user" 
                          ? "bg-gradient-to-br from-[#3d7ab7] via-[#2d5a87] to-[#1e4a77] text-white rounded-tr-md shadow-lg border border-white/10" 
                          : `${isDarkMode ? 'bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35] text-cyan-100 border-white/10' : 'bg-gradient-to-br from-white to-gray-50 text-[#2d5a87] border-gray-200'} rounded-tl-md shadow-md border`}
                      `}>
                        {message.role === "user" && (
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl rounded-tr-md pointer-events-none" />
                        )}
                        <p className="whitespace-pre-wrap break-words text-[15px] relative">{message.content}</p>
                      </div>
                    </div>
                    <p className={`text-xs ${textMuted} mt-2 px-1`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading con animazione premium */}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-blue-400/30 rounded-xl blur-md animate-pulse" />
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#3d7ab7] via-[#2d5a87] to-[#1e4a77] flex items-center justify-center text-xs font-semibold text-white shadow-lg border border-white/20">
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl" />
                      <span className="relative">A</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-3 p-4 rounded-2xl rounded-tl-md ${isDarkMode ? 'bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35] border-white/10' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} shadow-md border`}>
                      <LoadingAnimation isDark={isDarkMode} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area con profondità */}
        <div className={`border-t ${isDarkMode ? 'border-white/10 bg-[#0f1f35]/80' : 'border-gray-200/50 bg-white/70'} backdrop-blur-xl p-5`}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                {/* Ombra sotto l'input */}
                <div className={`absolute inset-0 translate-y-1 ${isDarkMode ? 'bg-black/20' : 'bg-gray-300/30'} rounded-2xl blur-md`} />
                <div className="relative flex items-center">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Scrivi un messaggio ad AMICA..."
                    rows={1}
                    className={`w-full pl-5 pr-14 py-4 
                      ${isDarkMode 
                        ? 'bg-gradient-to-b from-[#1e3a5f] to-[#0f1f35] border-white/20 text-white placeholder-gray-400' 
                        : 'bg-gradient-to-b from-white to-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}
                      border
                      rounded-2xl resize-none 
                      focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400
                      text-[15px]
                      shadow-lg
                      transition-all duration-200`}
                    style={{
                      minHeight: "56px",
                      maxHeight: "200px",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = Math.min(target.scrollHeight, 200) + "px";
                    }}
                  />
                  {/* Pulsante Microfono */}
                  <button
                    onClick={toggleListening}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
                      isListening 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' 
                        : `${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`
                    }`}
                    title={isListening ? "Ferma dettatura" : "Avvia dettatura vocale"}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>
              </div>
              {/* Pulsante invio 3D dorato */}
              <div className="relative group">
                {inputValue.trim() && !isLoading && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl blur opacity-50 group-hover:opacity-70 transition-opacity" />
                )}
                <div className={`absolute inset-0 translate-y-1 ${isDarkMode ? 'bg-black/30' : 'bg-gray-400/30'} rounded-2xl blur-sm`} />
                <button
                  id="send-button"
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`
                    relative p-4 rounded-2xl transition-all duration-200
                    ${inputValue.trim() && !isLoading
                      ? "bg-gradient-to-b from-[#ffd700] via-[#e5b800] to-[#cc9900] text-[#1a2a4a] shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 border-t border-amber-200/50"
                      : `${isDarkMode ? 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-500' : 'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-400'} cursor-not-allowed border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                  `}
                >
                  {inputValue.trim() && !isLoading && (
                    <div className="absolute inset-x-2 top-1 h-3 bg-gradient-to-b from-white/50 to-transparent rounded-full" />
                  )}
                  {isLoading ? (
                    <Loader2 className="animate-spin relative" size={22} />
                  ) : (
                    <Send size={22} className="relative" />
                  )}
                </button>
              </div>
            </div>
            <p className={`text-xs ${textMuted} text-center mt-4`}>
              AMICA può commettere errori. Verifica le informazioni importanti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
