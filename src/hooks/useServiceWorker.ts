import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const useServiceWorker = () => {
  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Quando há uma nova versão, recarrega automaticamente
        console.log('Nova versão disponível, atualizando...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('App pronto para uso offline');
      },
      onRegisteredSW(swUrl, registration) {
        console.log('Service Worker registrado:', swUrl);
        // Verifica atualizações a cada 1 hora
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.error('Erro ao registrar Service Worker:', error);
      },
    });
  }, []);
};
