import { useState } from 'react';
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

  // Log quando o diálogo abre
  console.log('🔵 CollaboratorContactDialog aberto:', {
    open,
    collaborator,
    user: user?.id,
  });

  // Buscar perfil do usuário atual
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSubmit = async () => {
    console.log('🚀 Iniciando envio de mensagem...');
    console.log('📝 Mensagem:', message);
    console.log('👤 Usuário:', user?.id);
    console.log('👥 Colaborador ID:', collaborator.id);
    console.log('🔑 User ID do colaborador:', collaborator.user_id);
    
    if (!message.trim() || message.trim().length < 10) {
      toast({
        title: 'Mensagem muito curta',
        description: 'Por favor, escreva uma mensagem com pelo menos 10 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      console.error('❌ Usuário não autenticado');
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para enviar mensagens.',
        variant: 'destructive',
      });
      return;
    }

    if (!userProfile) {
      console.error('❌ Perfil do usuário não encontrado');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu perfil. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    console.log('📤 Tentando criar mensagem via hook...');
    
    const messageData = {
      name: userProfile.name,
      phone: 'N/A', // Campo obrigatório no schema
      email: user.email || undefined,
      message: message.trim(),
      collaborator_id: collaborator.id, // Importante: define que é uma mensagem para colaborador
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
              disabled={createMessage.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {message.length} / mínimo 10 caracteres
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setMessage('');
              }}
              disabled={createMessage.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMessage.isPending || message.trim().length < 10}
              className="btn-gradient"
            >
              {createMessage.isPending ? (
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
