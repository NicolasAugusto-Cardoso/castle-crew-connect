import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';

export const InstallPWABanner = () => {
  const { canInstall, isIOS, promptInstall, dismissBanner, showBanner } = usePWAInstall();
  const navigate = useNavigate();

  if (!showBanner) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      navigate('/install');
    }
  };

  return (
    <div className="fixed top-[60px] left-0 right-0 z-40 bg-gradient-to-r from-primary-light to-primary shadow-md md:left-64">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {isIOS ? <Share className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">
              {isIOS ? 'Adicione à sua tela inicial' : 'Instale nosso app'}
            </p>
            <p className="text-white/80 text-xs truncate">
              {isIOS ? 'Acesso rápido e offline' : 'Experiência completa offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-white text-primary hover:bg-white/90 font-medium min-h-[36px]"
          >
            {isIOS ? 'Como?' : 'Instalar'}
          </Button>
          <button
            onClick={dismissBanner}
            className="text-white/80 hover:text-white transition-colors p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Dispensar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
