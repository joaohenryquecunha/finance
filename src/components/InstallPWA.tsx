import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export const InstallPWA: React.FC = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone
        || document.referrer.includes('android-app://');
      
      setIsStandalone(isStandalone);
      console.log('Is running in standalone mode:', isStandalone);
    };

    checkStandalone();

    const handler = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event triggered');
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Verifica se já existe um prompt salvo
    if (window.deferredPrompt) {
      console.log('Existing install prompt found');
      setShowInstall(true);
    }

    // Monitora mudanças no modo de exibição
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mediaQuery.removeListener(checkStandalone);
    };
  }, []);

  const handleInstall = async () => {
    const deferredPrompt = window.deferredPrompt;
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    try {
      console.log('Showing install prompt');
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      window.deferredPrompt = null;
      setShowInstall(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  // Não mostra o banner se já estiver instalado
  if (isStandalone || !showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-dark-secondary rounded-lg shadow-gold-lg p-4 flex items-center gap-4 animate-slide-up">
        <div className="bg-gold-primary/10 p-2 rounded-lg">
          <Download className="w-6 h-6 text-gold-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gold-primary">Instalar App</h3>
          <p className="text-xs text-gray-400">Adicione à tela inicial</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-gold-primary text-dark-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-hover transition-colors"
        >
          Instalar
        </button>
      </div>
    </div>
  );
};