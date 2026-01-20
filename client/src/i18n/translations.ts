// Sistema di internazionalizzazione per AMICA
// NOTA: "AMICA" non viene mai tradotto - è il brand

export type Language = 'it' | 'en' | 'fr' | 'es' | 'de' | 'pt';

export interface Translations {
  // Header
  subtitle: string;
  
  // Hero
  welcome: string;
  heroDescription: string;
  voiceInviteTitle: string;
  voiceInviteSubtitle: string;
  
  // Quick actions
  quickAction1: string;
  quickAction2: string;
  quickAction3: string;
  quickAction4: string;
  
  // Input
  inputPlaceholder: string;
  
  // Buttons
  share: string;
  newChat: string;
  
  // Voice
  startVoice: string;
  stopVoice: string;
  enableVoice: string;
  disableVoice: string;
  stopAudio: string;
  startDictation: string;
  
  // Theme
  darkMode: string;
  lightMode: string;
  
  // Sidebar
  noConversations: string;
  startChatting: string;
  deleteChat: string;
  
  // Footer
  disclaimer: string;
  
  // Share modal
  shareTitle: string;
  shareDescription: string;
  copyLink: string;
  linkCopied: string;
  shareWhatsApp: string;
  shareTelegram: string;
  shareEmail: string;
  
  // Install prompt
  installTitle: string;
  installDescription: string;
  saveToContacts: string;
  installApp: string;
  later: string;
  contactNote: string;
}

export const translations: Record<Language, Translations> = {
  it: {
    // Header
    subtitle: "L'intelligenza artificiale italiana",
    
    // Hero
    welcome: "Benvenuto in",
    heroDescription: "Sono AMICA, l'intelligenza artificiale italiana. Non sono un chatbot generico: sono un'intelligenza con cui vale la pena parlare.",
    voiceInviteTitle: "PUOI PARLARE DIRETTAMENTE",
    voiceInviteSubtitle: "Senza scrivere, come una telefonata",
    
    // Quick actions
    quickAction1: "Mi servono delle informazioni. Informazioni e curiosità.",
    quickAction2: "Aiutami a ragionare su un problema",
    quickAction3: "Dammi un'opinione su un argomento",
    quickAction4: "Parliamo di filosofia o scienza",
    
    // Input
    inputPlaceholder: "Scrivi un messaggio ad AMICA...",
    
    // Buttons
    share: "Condividi",
    newChat: "Nuova chat",
    
    // Voice
    startVoice: "Avvia conversazione vocale",
    stopVoice: "Termina conversazione vocale",
    enableVoice: "Attiva risposte vocali",
    disableVoice: "Disattiva risposte vocali",
    stopAudio: "Ferma la voce",
    startDictation: "Avvia dettatura vocale",
    
    // Theme
    darkMode: "Passa a Dark Mode",
    lightMode: "Passa a Light Mode",
    
    // Sidebar
    noConversations: "Nessuna conversazione",
    startChatting: "Inizia a chattare con AMICA",
    deleteChat: "Elimina chat",
    
    // Footer
    disclaimer: "AMICA può commettere errori. Verifica le informazioni importanti.",
    
    // Share modal
    shareTitle: "Condividi AMICA",
    shareDescription: "Fai conoscere AMICA ai tuoi amici",
    copyLink: "Copia link",
    linkCopied: "Link copiato!",
    shareWhatsApp: "Condividi su WhatsApp",
    shareTelegram: "Condividi su Telegram",
    shareEmail: "Invia via Email",
    
    // Install prompt
    installTitle: "Ciao! Sono AMICA",
    installDescription: "Scegli come vuoi salvarmi per ritrovarmi facilmente.",
    saveToContacts: "Vuoi salvarmi nella rubrica di WhatsApp?",
    installApp: "Vuoi installare l'App?",
    later: "Più tardi",
    contactNote: "Salvandomi in rubrica, mi troverai cercando \"AMICA\". Tocca il sito web nel contatto per parlare con me.",
  },
  
  en: {
    // Header
    subtitle: "The Italian artificial intelligence",
    
    // Hero
    welcome: "Welcome to",
    heroDescription: "I'm AMICA, the Italian artificial intelligence. I'm not a generic chatbot: I'm an intelligence worth talking to.",
    voiceInviteTitle: "YOU CAN SPEAK DIRECTLY",
    voiceInviteSubtitle: "Without typing, like a phone call",
    
    // Quick actions
    quickAction1: "I need some information. Facts and curiosities.",
    quickAction2: "Help me think through a problem",
    quickAction3: "Give me an opinion on a topic",
    quickAction4: "Let's talk about philosophy or science",
    
    // Input
    inputPlaceholder: "Write a message to AMICA...",
    
    // Buttons
    share: "Share",
    newChat: "New chat",
    
    // Voice
    startVoice: "Start voice conversation",
    stopVoice: "End voice conversation",
    enableVoice: "Enable voice responses",
    disableVoice: "Disable voice responses",
    stopAudio: "Stop voice",
    startDictation: "Start voice dictation",
    
    // Theme
    darkMode: "Switch to Dark Mode",
    lightMode: "Switch to Light Mode",
    
    // Sidebar
    noConversations: "No conversations",
    startChatting: "Start chatting with AMICA",
    deleteChat: "Delete chat",
    
    // Footer
    disclaimer: "AMICA can make mistakes. Verify important information.",
    
    // Share modal
    shareTitle: "Share AMICA",
    shareDescription: "Introduce AMICA to your friends",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    shareWhatsApp: "Share on WhatsApp",
    shareTelegram: "Share on Telegram",
    shareEmail: "Send via Email",
    
    // Install prompt
    installTitle: "Hi! I'm AMICA",
    installDescription: "Choose how you want to save me for easy access.",
    saveToContacts: "Save me to your WhatsApp contacts?",
    installApp: "Install the App?",
    later: "Later",
    contactNote: "By saving me to contacts, you'll find me by searching \"AMICA\". Tap the website in the contact to talk to me.",
  },
  
  fr: {
    // Header
    subtitle: "L'intelligence artificielle italienne",
    
    // Hero
    welcome: "Bienvenue sur",
    heroDescription: "Je suis AMICA, l'intelligence artificielle italienne. Je ne suis pas un chatbot générique : je suis une intelligence qui mérite qu'on lui parle.",
    voiceInviteTitle: "VOUS POUVEZ PARLER DIRECTEMENT",
    voiceInviteSubtitle: "Sans écrire, comme un appel téléphonique",
    
    // Quick actions
    quickAction1: "J'ai besoin d'informations. Faits et curiosités.",
    quickAction2: "Aide-moi à réfléchir à un problème",
    quickAction3: "Donne-moi ton avis sur un sujet",
    quickAction4: "Parlons de philosophie ou de science",
    
    // Input
    inputPlaceholder: "Écrivez un message à AMICA...",
    
    // Buttons
    share: "Partager",
    newChat: "Nouvelle conversation",
    
    // Voice
    startVoice: "Démarrer la conversation vocale",
    stopVoice: "Terminer la conversation vocale",
    enableVoice: "Activer les réponses vocales",
    disableVoice: "Désactiver les réponses vocales",
    stopAudio: "Arrêter la voix",
    startDictation: "Démarrer la dictée vocale",
    
    // Theme
    darkMode: "Passer en mode sombre",
    lightMode: "Passer en mode clair",
    
    // Sidebar
    noConversations: "Aucune conversation",
    startChatting: "Commencez à discuter avec AMICA",
    deleteChat: "Supprimer la conversation",
    
    // Footer
    disclaimer: "AMICA peut faire des erreurs. Vérifiez les informations importantes.",
    
    // Share modal
    shareTitle: "Partager AMICA",
    shareDescription: "Faites découvrir AMICA à vos amis",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié !",
    shareWhatsApp: "Partager sur WhatsApp",
    shareTelegram: "Partager sur Telegram",
    shareEmail: "Envoyer par email",
    
    // Install prompt
    installTitle: "Salut ! Je suis AMICA",
    installDescription: "Choisissez comment vous voulez me sauvegarder pour me retrouver facilement.",
    saveToContacts: "Me sauvegarder dans vos contacts WhatsApp ?",
    installApp: "Installer l'application ?",
    later: "Plus tard",
    contactNote: "En me sauvegardant dans vos contacts, vous me trouverez en cherchant \"AMICA\". Touchez le site web dans le contact pour me parler.",
  },
  
  es: {
    // Header
    subtitle: "La inteligencia artificial italiana",
    
    // Hero
    welcome: "Bienvenido a",
    heroDescription: "Soy AMICA, la inteligencia artificial italiana. No soy un chatbot genérico: soy una inteligencia con la que vale la pena hablar.",
    voiceInviteTitle: "PUEDES HABLAR DIRECTAMENTE",
    voiceInviteSubtitle: "Sin escribir, como una llamada telefónica",
    
    // Quick actions
    quickAction1: "Necesito información. Datos y curiosidades.",
    quickAction2: "Ayúdame a pensar en un problema",
    quickAction3: "Dame tu opinión sobre un tema",
    quickAction4: "Hablemos de filosofía o ciencia",
    
    // Input
    inputPlaceholder: "Escribe un mensaje a AMICA...",
    
    // Buttons
    share: "Compartir",
    newChat: "Nueva conversación",
    
    // Voice
    startVoice: "Iniciar conversación de voz",
    stopVoice: "Terminar conversación de voz",
    enableVoice: "Activar respuestas de voz",
    disableVoice: "Desactivar respuestas de voz",
    stopAudio: "Detener voz",
    startDictation: "Iniciar dictado de voz",
    
    // Theme
    darkMode: "Cambiar a modo oscuro",
    lightMode: "Cambiar a modo claro",
    
    // Sidebar
    noConversations: "Sin conversaciones",
    startChatting: "Empieza a chatear con AMICA",
    deleteChat: "Eliminar conversación",
    
    // Footer
    disclaimer: "AMICA puede cometer errores. Verifica la información importante.",
    
    // Share modal
    shareTitle: "Compartir AMICA",
    shareDescription: "Presenta AMICA a tus amigos",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado!",
    shareWhatsApp: "Compartir en WhatsApp",
    shareTelegram: "Compartir en Telegram",
    shareEmail: "Enviar por email",
    
    // Install prompt
    installTitle: "¡Hola! Soy AMICA",
    installDescription: "Elige cómo quieres guardarme para encontrarme fácilmente.",
    saveToContacts: "¿Guardarme en tus contactos de WhatsApp?",
    installApp: "¿Instalar la aplicación?",
    later: "Más tarde",
    contactNote: "Al guardarme en contactos, me encontrarás buscando \"AMICA\". Toca el sitio web en el contacto para hablar conmigo.",
  },
  
  de: {
    // Header
    subtitle: "Die italienische künstliche Intelligenz",
    
    // Hero
    welcome: "Willkommen bei",
    heroDescription: "Ich bin AMICA, die italienische künstliche Intelligenz. Ich bin kein generischer Chatbot: Ich bin eine Intelligenz, mit der es sich lohnt zu sprechen.",
    voiceInviteTitle: "SIE KÖNNEN DIREKT SPRECHEN",
    voiceInviteSubtitle: "Ohne zu tippen, wie ein Telefonat",
    
    // Quick actions
    quickAction1: "Ich brauche Informationen. Fakten und Kuriositäten.",
    quickAction2: "Hilf mir, über ein Problem nachzudenken",
    quickAction3: "Gib mir deine Meinung zu einem Thema",
    quickAction4: "Lass uns über Philosophie oder Wissenschaft sprechen",
    
    // Input
    inputPlaceholder: "Schreiben Sie eine Nachricht an AMICA...",
    
    // Buttons
    share: "Teilen",
    newChat: "Neuer Chat",
    
    // Voice
    startVoice: "Sprachgespräch starten",
    stopVoice: "Sprachgespräch beenden",
    enableVoice: "Sprachantworten aktivieren",
    disableVoice: "Sprachantworten deaktivieren",
    stopAudio: "Stimme stoppen",
    startDictation: "Sprachdiktat starten",
    
    // Theme
    darkMode: "Zum dunklen Modus wechseln",
    lightMode: "Zum hellen Modus wechseln",
    
    // Sidebar
    noConversations: "Keine Gespräche",
    startChatting: "Beginnen Sie mit AMICA zu chatten",
    deleteChat: "Chat löschen",
    
    // Footer
    disclaimer: "AMICA kann Fehler machen. Überprüfen Sie wichtige Informationen.",
    
    // Share modal
    shareTitle: "AMICA teilen",
    shareDescription: "Stellen Sie AMICA Ihren Freunden vor",
    copyLink: "Link kopieren",
    linkCopied: "Link kopiert!",
    shareWhatsApp: "Auf WhatsApp teilen",
    shareTelegram: "Auf Telegram teilen",
    shareEmail: "Per E-Mail senden",
    
    // Install prompt
    installTitle: "Hallo! Ich bin AMICA",
    installDescription: "Wählen Sie, wie Sie mich speichern möchten, um mich leicht zu finden.",
    saveToContacts: "Mich in Ihren WhatsApp-Kontakten speichern?",
    installApp: "Die App installieren?",
    later: "Später",
    contactNote: "Wenn Sie mich in Kontakten speichern, finden Sie mich durch Suchen nach \"AMICA\". Tippen Sie auf die Website im Kontakt, um mit mir zu sprechen.",
  },
  
  pt: {
    // Header
    subtitle: "A inteligência artificial italiana",
    
    // Hero
    welcome: "Bem-vindo ao",
    heroDescription: "Sou AMICA, a inteligência artificial italiana. Não sou um chatbot genérico: sou uma inteligência com quem vale a pena conversar.",
    voiceInviteTitle: "VOCÊ PODE FALAR DIRETAMENTE",
    voiceInviteSubtitle: "Sem digitar, como uma ligação telefônica",
    
    // Quick actions
    quickAction1: "Preciso de informações. Fatos e curiosidades.",
    quickAction2: "Me ajude a pensar em um problema",
    quickAction3: "Me dê sua opinião sobre um assunto",
    quickAction4: "Vamos falar sobre filosofia ou ciência",
    
    // Input
    inputPlaceholder: "Escreva uma mensagem para AMICA...",
    
    // Buttons
    share: "Compartilhar",
    newChat: "Nova conversa",
    
    // Voice
    startVoice: "Iniciar conversa por voz",
    stopVoice: "Encerrar conversa por voz",
    enableVoice: "Ativar respostas por voz",
    disableVoice: "Desativar respostas por voz",
    stopAudio: "Parar voz",
    startDictation: "Iniciar ditado por voz",
    
    // Theme
    darkMode: "Mudar para modo escuro",
    lightMode: "Mudar para modo claro",
    
    // Sidebar
    noConversations: "Sem conversas",
    startChatting: "Comece a conversar com AMICA",
    deleteChat: "Excluir conversa",
    
    // Footer
    disclaimer: "AMICA pode cometer erros. Verifique informações importantes.",
    
    // Share modal
    shareTitle: "Compartilhar AMICA",
    shareDescription: "Apresente AMICA aos seus amigos",
    copyLink: "Copiar link",
    linkCopied: "Link copiado!",
    shareWhatsApp: "Compartilhar no WhatsApp",
    shareTelegram: "Compartilhar no Telegram",
    shareEmail: "Enviar por email",
    
    // Install prompt
    installTitle: "Olá! Sou AMICA",
    installDescription: "Escolha como você quer me salvar para me encontrar facilmente.",
    saveToContacts: "Me salvar nos seus contatos do WhatsApp?",
    installApp: "Instalar o aplicativo?",
    later: "Mais tarde",
    contactNote: "Ao me salvar nos contatos, você me encontrará pesquisando \"AMICA\". Toque no site no contato para falar comigo.",
  },
};

// Funzione per rilevare la lingua del browser
export const detectLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase().split('-')[0];
  const supportedLanguages: Language[] = ['it', 'en', 'fr', 'es', 'de', 'pt'];
  
  if (supportedLanguages.includes(browserLang as Language)) {
    return browserLang as Language;
  }
  
  // Default: italiano
  return 'it';
};

// Hook per ottenere le traduzioni
export const getTranslations = (lang: Language): Translations => {
  return translations[lang];
};
