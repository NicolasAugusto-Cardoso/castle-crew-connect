import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useContactMessages } from '@/hooks/useContactMessages';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CollaboratorContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: {
    id: string;
    user_id: string;
    name: string;
    avatar_url?: string | null;
    church?: string | null;
  };
}

export const CollaboratorContactDialog = ({
  open,
  onOpenChange,
  collaborator,
}: CollaboratorContactDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createMessage } = useContactMessages();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log quando o diálogo abre (apenas quando 'open' muda)
  useEffect(() => {
    if (open) {
      console.log('🔵 CollaboratorContactDialog ABRIU:', {
        collaborator,
        user: user?.id,
      });
    }
  }, [open, collaborator, user?.id]);

  // Buscar perfil do usuário atual
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('🔍 Buscando perfil do usuário:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return null;
      }
      
      console.log('✅ Perfil carregado:', data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    retry: false, // Não retry em caso de erro
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('🚀 HANDLESUBMIT INICIADO!');
      console.log('📝 Mensagem:', message);
      console.log('👤 Usuário:', user?.id);
      console.log('👥 Colaborador ID:', collaborator.id);
      console.log('👤 Perfil carregado?', !!userProfile);
      console.log('⏳ Loading perfil?', profileLoading);
      
      // Validação de mensagem
      if (!message.trim() || message.trim().length < 10) {
        toast({
          title: 'Mensagem muito curta',
          description: 'Por favor, escreva uma mensagem com pelo menos 10 caracteres.',
          variant: 'destructive',
        });
        return;
      }

      // Validação de autenticação
      if (!user?.id) {
        console.error('❌ Usuário não autenticado');
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para enviar mensagens.',
          variant: 'destructive',
        });
        return;
      }

      // Aguardar perfil carregar (com fallback) - sempre temos pelo menos o email
      const senderName = userProfile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
      
      console.log('✅ Nome do remetente:', senderName);

      console.log('📤 Criando mensagem com nome:', senderName);
      
      const messageData = {
        name: senderName,
        phone: 'N/A', // Campo obrigatório no schema
        email: user.email || undefined,
        message: message.trim(),
        collaborator_id: collaborator.id,
      };
      
      console.log('📦 Dados da mensagem:', messageData);

      // Usar o hook para criar a mensagem (que já invalida o cache)
      createMessage.mutate(messageData, {
        onSuccess: (data) => {
          console.log('✅ Mensagem criada com sucesso:', data);

          onOpenChange(false);
          setMessage('');
          
          // Redirecionar para a página de contato com a mensagem aberta
          if (data?.id) {
            console.log('🔀 Redirecionando para /contact?messageId=' + data.id);
            navigate(`/contact?messageId=${data.id}`);
          } else {
            console.log('🔀 Redirecionando para /contact');
            navigate('/contact');
          }
        },
        onError: (error: any) => {
          console.error('❌ Erro ao criar mensagem:', error);
          // O hook já mostra toasts de erro
        }
      });
    } catch (error) {
      console.error('💥 ERRO NÃO CAPTURADO:', error);
      toast({
        title: 'Erro inesperado',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = collaborator.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Iniciar conversa com {collaborator.name}
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem direta para este colaborador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading do perfil */}
          {profileLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando suas informações...
            </div>
          )}

          {/* Informações do Colaborador */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={collaborator.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{collaborator.name}</p>
              {collaborator.church && (
                <p className="text-sm text-muted-foreground truncate">
                  {collaborator.church}
                </p>
              )}
            </div>
          </div>

          {/* Campo de Mensagem */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui... (mínimo 10 caracteres)"
              className="min-h-[120px] resize-none"
              disabled={createMessage.isPending || isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {message.length} / mínimo 10 caracteres
            </p>
            
            {/* Feedback de validação */}
            {message.trim().length > 0 && message.trim().length < 10 && (
              <div className="flex items-center gap-2 text-sm text-orange-500 font-medium">
                <span>⚠️</span>
                <span>Digite pelo menos {10 - message.trim().length} caracteres para enviar</span>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setMessage('');
              }}
              disabled={createMessage.isPending || isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                console.log('🎯 CLIQUE DETECTADO NO BOTÃO!');
                console.log('Mensagem:', message);
                console.log('Tamanho:', message.trim().length);
                console.log('isPending:', createMessage.isPending);
                console.log('isSubmitting:', isSubmitting);
                console.log('Disabled?:', createMessage.isPending || isSubmitting || message.trim().length < 10);
                handleSubmit();
              }}
              disabled={
                createMessage.isPending || 
                isSubmitting ||
                message.trim().length < 10
              }
              className="btn-gradient"
            >
              {(createMessage.isPending || isSubmitting) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar mensagem
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
