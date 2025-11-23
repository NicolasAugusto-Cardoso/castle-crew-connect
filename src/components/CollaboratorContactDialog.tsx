import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!message.trim() || message.trim().length < 10) {
      toast({
        title: 'Mensagem muito curta',
        description: 'Por favor, escreva uma mensagem com pelo menos 10 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id || !userProfile) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para enviar mensagens.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user.id,
          collaborator_id: collaborator.id,
          name: userProfile.name,
          phone: 'N/A', // Phone is required in schema
          email: user.email || null,
          message: message.trim(),
          status: 'new',
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: 'Mensagem enviada!',
        description: `Sua conversa com ${collaborator.name} foi iniciada.`,
      });

      onOpenChange(false);
      setMessage('');
      
      // Redirecionar para a página de contato com a mensagem aberta
      navigate(`/contact?messageId=${data.id}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua mensagem. Tente novamente.',
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || message.trim().length < 10}
              className="btn-gradient"
            >
              {isSubmitting ? (
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
