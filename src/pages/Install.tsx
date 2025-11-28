import { useState, useEffect } from 'react';
import { Share, Download, Smartphone, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import castleLogo from '@/assets/castle-logo-final.png';

const Install = () => {
  const { canInstall, isIOS, promptInstall, isInstalled } = usePWAInstall();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const navigate = useNavigate();

  useEffect(() => {
    // Detecta a plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    if (/ipad|iphone|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await promptInstall();
      if (success) {
        navigate('/');
      }
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <CardTitle>App já instalado!</CardTitle>
            <CardDescription>
              O Castle Movement já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir para o App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={castleLogo} alt="Castle Movement" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Instale nosso App</h1>
          <p className="text-white/80">Acesso rápido, notificações e uso offline</p>
        </div>

        {/* Botão de instalação direta (Android/Desktop) */}
        {canInstall && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Instalação Rápida</h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão para instalar agora
                  </p>
                </div>
                <Button onClick={handleInstallClick} className="min-h-[44px]">
                  Instalar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções iOS */}
        {(platform === 'ios' || isIOS) && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="w-6 h-6 text-primary" />
                <CardTitle>iPhone / iPad</CardTitle>
              </div>
              <CardDescription>
                Siga os passos abaixo para instalar em dispositivos Apple
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Abra o Safari</p>
                  <p className="text-sm text-muted-foreground">
                    Certifique-se de estar usando o navegador Safari
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Toque no ícone Compartilhar</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Share className="w-4 h-4" />
                    <span>Botão na parte inferior da tela</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Adicionar à Tela Inicial</p>
                  <p className="text-sm text-muted-foreground">
                    Role para baixo e toque em "Adicionar à Tela Inicial"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium mb-1">Confirmar</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Adicionar" no canto superior direito
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções Android */}
        {platform === 'android' && !canInstall && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="w-6 h-6 text-primary" />
                <CardTitle>Android</CardTitle>
              </div>
              <CardDescription>
                Siga os passos abaixo para instalar em dispositivos Android
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Abra o menu do navegador</p>
                  <p className="text-sm text-muted-foreground">
                    Toque nos três pontos no canto superior direito
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Adicionar à tela inicial</p>
                  <p className="text-sm text-muted-foreground">
                    Ou "Instalar app" dependendo do navegador
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Confirmar instalação</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Instalar" ou "Adicionar"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções Desktop */}
        {platform === 'desktop' && !canInstall && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Monitor className="w-6 h-6 text-primary" />
                <CardTitle>Desktop (Chrome / Edge)</CardTitle>
              </div>
              <CardDescription>
                Instale no seu computador para acesso rápido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Procure o ícone de instalação</p>
                  <p className="text-sm text-muted-foreground">
                    Geralmente aparece na barra de endereço (ícone de computador ou +)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Clique em instalar</p>
                  <p className="text-sm text-muted-foreground">
                    Ou use o menu (três pontos) → "Instalar Castle Movement"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle>Por que instalar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Acesso instantâneo</p>
                <p className="text-sm text-muted-foreground">
                  Ícone na tela inicial do seu dispositivo
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Funciona offline</p>
                <p className="text-sm text-muted-foreground">
                  Acesse conteúdo mesmo sem internet
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Notificações push</p>
                <p className="text-sm text-muted-foreground">
                  Receba atualizações importantes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Experiência nativa</p>
                <p className="text-sm text-muted-foreground">
                  App completo sem ocupar espaço extra
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:text-white hover:bg-white/10"
          >
            Voltar ao site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
