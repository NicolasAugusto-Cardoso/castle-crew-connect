import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Reply {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
  sender_avatar?: string;
}

export default function CollaboratorChat() {
  const { userId: collaboratorUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar perfil do colaborador
  const { data: collaborator } = useQuery({
    queryKey: ['collaborator-profile', collaboratorUserId],
    queryFn: async () => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', collaboratorUserId)
        .single();

      if (error) throw error;
      return {
        user_id: collaboratorUserId!,
        name: profileData.name,
        avatar_url: profileData.avatar_url,
      };
    },
  });

  // Buscar ou criar mensagem de contato
  const { data: contactMessage, isLoading: loadingMessage } = useQuery({
    queryKey: ['collaborator-contact-message', collaboratorUserId],
    queryFn: async () => {
      // Primeiro, tentar encontrar mensagem existente
      const { data: existing, error: searchError } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', user?.id)
        .eq('name', `Chat com ${collaborator?.name || 'Colaborador'}`)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Se não existir, criar nova mensagem
      const { data: newMessage, error: createError } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id,
          name: `Chat com ${collaborator?.name || 'Colaborador'}`,
          phone: 'N/A',
          message: `Conversa iniciada com ${collaborator?.name || 'colaborador'}`,
          status: 'in_progress',
        })
        .select()
        .single();

      if (createError) throw createError;
      return newMessage;
    },
    enabled: !!user && !!collaborator,
  });

  // Buscar respostas
  const { data: replies = [], isLoading: loadingReplies } = useQuery({
    queryKey: ['collaborator-chat-replies', contactMessage?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_replies')
        .select('*, profiles!contact_replies_sender_id_fkey(name, avatar_url)')
        .eq('message_id', contactMessage!.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        sender_id: reply.sender_id,
        created_at: reply.created_at,
        is_read: reply.is_read,
        sender_name: reply.profiles?.name,
        sender_avatar: reply.profiles?.avatar_url,
      })) as Reply[];
    },
    enabled: !!contactMessage,
  });

  // Enviar resposta
  const sendReply = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('contact_replies')
        .insert({
          message_id: contactMessage!.id,
          sender_id: user!.id,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['collaborator-chat-replies'] });
      toast.success('Mensagem enviada!');
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    },
  });

  // Editar resposta
  const editReply = useMutation({
    mutationFn: async ({ replyId, content }: { replyId: string; content: string }) => {
      const { error } = await supabase
        .from('contact_replies')
        .update({ content })
        .eq('id', replyId);

      if (error) throw error;
    },
    onSuccess: () => {
      setEditingReplyId(null);
      setEditText('');
      queryClient.invalidateQueries({ queryKey: ['collaborator-chat-replies'] });
      toast.success('Mensagem editada!');
    },
    onError: () => {
      toast.error('Erro ao editar mensagem');
    },
  });

  // Deletar resposta
  const deleteReply = useMutation({
    mutationFn: async (replyId: string) => {
      const { error } = await supabase
        .from('contact_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-chat-replies'] });
      toast.success('Mensagem excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir mensagem');
    },
  });

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  // Realtime subscription
  useEffect(() => {
    if (!contactMessage?.id) return;

    const channel = supabase
      .channel(`chat-${contactMessage.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_replies',
          filter: `message_id=eq.${contactMessage.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['collaborator-chat-replies'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactMessage?.id, queryClient]);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendReply.mutate(replyText);
  };

  const handleEditReply = (replyId: string) => {
    if (!editText.trim()) return;
    editReply.mutate({ replyId, content: editText });
  };

  const handleDeleteReply = (replyId: string) => {
    if (window.confirm('Deseja realmente excluir esta mensagem?')) {
      deleteReply.mutate(replyId);
    }
  };

  if (loadingMessage || loadingReplies) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/colaboradores/${collaboratorUserId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Chat Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={collaborator?.avatar_url || ''} />
                <AvatarFallback>
                  {collaborator?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle>Conversa com {collaborator?.name}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Mensagens */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {replies.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </div>
              ) : (
                replies.map((reply) => {
                  const isCurrentUser = reply.sender_id === user?.id;
                  const isEditing = editingReplyId === reply.id;

                  return (
                    <div
                      key={reply.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.sender_avatar || ''} />
                        <AvatarFallback>
                          {reply.sender_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`flex-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs text-muted-foreground mb-1">
                          {reply.sender_name} • {new Date(reply.created_at).toLocaleString('pt-BR')}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditReply(reply.id)}
                                disabled={editReply.isPending}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingReplyId(null);
                                  setEditText('');
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className={`inline-block px-4 py-2 rounded-lg ${
                                isCurrentUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {reply.content}
                            </div>

                            {isCurrentUser && (
                              <div className="flex gap-2 mt-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingReplyId(reply.id);
                                    setEditText(reply.content);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteReply(reply.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={sendReply.isPending || !replyText.trim()}
                  className="self-end"
                >
                  {sendReply.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
