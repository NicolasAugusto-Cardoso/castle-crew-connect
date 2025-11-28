import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detecta iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Detecta se está em modo standalone (já instalado)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;

  useEffect(() => {
    // Verifica se já foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Detecta se app já está instalado
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Captura o evento beforeinstallprompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detecta quando app é instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Aguarda resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };

  const dismissBanner = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return {
    canInstall: canInstall && !isInstalled && !isDismissed,
    isInstalled,
    isIOS: isIOS && !isStandalone,
    promptInstall,
    dismissBanner,
    showBanner: (canInstall || (isIOS && !isStandalone)) && !isInstalled && !isDismissed
  };
};
