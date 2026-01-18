import { useState, useEffect } from 'react';
import { UserPlus, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  onInstalled?: () => void;
}

export function InstallPrompt({ onInstalled }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  useEffect(() => {
    // Verifica se già installata
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandalone || isIOSStandalone;
    };

    // Verifica se l'utente ha già rifiutato
    const checkDismissed = () => {
      const dismissedTime = localStorage.getItem('amica-install-dismissed');
      if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        return daysSinceDismissed < 7; // Non riproporre per 7 giorni
      }
      return false;
    };

    setIsInstalled(checkInstalled());
    setDismissed(checkDismissed());

    // Listener per l'evento beforeinstallprompt (Chrome, Edge, Samsung)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostra il prompt dopo 3 secondi
      if (!checkInstalled() && !checkDismissed()) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // Listener per quando l'app viene installata
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      if (onInstalled) {
        onInstalled();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Mostra il prompt dopo 3 secondi
    if (!checkInstalled() && !checkDismissed()) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Su Android/Chrome con supporto nativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        if (onInstalled) {
          onInstalled();
        }
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Mostra le istruzioni manuali
      setShowInstallInstructions(true);
    }
  };

  const handleSaveContact = () => {
    // Scarica il file vCard
    const link = document.createElement('a');
    link.href = '/amica.vcf';
    link.download = 'AMICA.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Chiudi il prompt dopo il download
    setTimeout(() => {
      setShowPrompt(false);
      setDismissed(true);
      localStorage.setItem('amica-install-dismissed', Date.now().toString());
    }, 500);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowInstallInstructions(false);
    setDismissed(true);
    localStorage.setItem('amica-install-dismissed', Date.now().toString());
  };

  const handleCloseInstructions = () => {
    setShowInstallInstructions(false);
  };

  // Non mostrare se già installata, già rifiutata, o non deve essere mostrato
  if (isInstalled || dismissed || !showPrompt) {
    return null;
  }

  // Modale con istruzioni di installazione
  if (showInstallInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay scuro */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleCloseInstructions}
        />
        
        {/* Card delle istruzioni */}
        <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#d4af37]">Installa l'App</h2>
              <button 
                onClick={handleCloseInstructions}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Contenuto */}
            <div className="px-6 py-4 space-y-6">
              {/* Istruzioni iPhone/iPad */}
              <div>
                <h3 className="text-lg font-semibold text-[#d4af37] mb-1">Per iPhone/iPad (Safari):</h3>
                <div className="w-full h-0.5 bg-[#d4af37] mb-3"></div>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">1.</span>
                    <span>Tocca il quadrato con la freccia che vedi al centro, sotto sulla base del tuo iPhone</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">2.</span>
                    <span>Scorri e tocca "Aggiungi a Home"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">3.</span>
                    <span>Tocca "Aggiungi" in alto a destra</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">4.</span>
                    <span>L'app apparirà nella schermata Home!</span>
                  </li>
                </ol>
              </div>

              {/* Istruzioni Android */}
              <div>
                <h3 className="text-lg font-semibold text-[#d4af37] mb-1">Per Android (Chrome):</h3>
                <div className="w-full h-0.5 bg-[#d4af37] mb-3"></div>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">1.</span>
                    <span>Tocca i tre puntini in alto a destra</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">2.</span>
                    <span>Tocca "Aggiungi a schermata Home" oppure "Installa app"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">3.</span>
                    <span>Conferma toccando "Aggiungi"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-gray-900">4.</span>
                    <span>L'app apparirà nella schermata Home!</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleCloseInstructions}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prompt principale
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Overlay scuro */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Card del prompt */}
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="rounded-2xl bg-gradient-to-b from-[#0f1a2e] to-[#0a1628] border border-[#1e3a5f] shadow-2xl overflow-hidden">
          {/* Header con icona */}
          <div className="flex flex-col items-center pt-6 pb-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center mb-4 shadow-lg">
              <span className="text-2xl font-bold text-[#0a1628]">A</span>
            </div>
            <h3 className="text-xl font-semibold text-white text-center">
              Ciao! Sono AMICA
            </h3>
            <p className="text-[#8ba3c7] text-center mt-2 text-sm">
              Scegli come vuoi salvarmi per ritrovarmi facilmente.
            </p>
          </div>

          {/* Pulsanti */}
          <div className="px-6 pb-6 space-y-3">
            {/* Pulsante Salva in Rubrica WhatsApp */}
            <button
              onClick={handleSaveContact}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold text-base hover:from-[#2be077] hover:to-[#159d8d] transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              Vuoi salvarmi nella rubrica di WhatsApp?
            </button>

            {/* Pulsante Installa App */}
            <button
              onClick={handleInstall}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#0a1628] font-semibold text-base hover:from-[#e5c04a] hover:to-[#c9a73f] transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <Smartphone size={20} />
              Vuoi installare l'App?
            </button>

            {/* Pulsante Più tardi */}
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-xl bg-[#1a2942] text-[#8ba3c7] font-medium text-base hover:bg-[#243650] transition-all duration-200"
            >
              Più tardi
            </button>
          </div>

          {/* Nota esplicativa */}
          <div className="px-6 pb-4">
            <p className="text-xs text-[#5a7a9a] text-center">
              Salvandomi in rubrica, mi troverai cercando "AMICA". Tocca il sito web nel contatto per parlare con me.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
