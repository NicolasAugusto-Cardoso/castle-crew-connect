import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContactReplies } from '@/hooks/useContactReplies';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, Pencil, Trash2, Check, X } from 'lucide-react';
import { ContactMessage } from '@/hooks/useContactMessages';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MessageThreadProps {
  message: ContactMessage;
  onClose: () => void;
}

export const MessageThread = ({ message, onClose }: MessageThreadProps) => {
  const { user, hasRole } = useAuth();
  const { replies, isLoading, createReply, updateReply, deleteReply } = useContactReplies(message.id);
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = hasRole(['admin', 'social_media']);

  // Marcar mensagens como lidas quando abrir a thread
  useEffect(() => {
    if (!user?.id || isAdmin) return;

    const markRepliesAsRead = async () => {
      const { error } = await supabase
        .from('contact_replies')
        .update({ is_read: true })
        .eq('message_id', message.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      } else {
        // Atualizar contadores imediatamente
        await queryClient.invalidateQueries({ queryKey: ['unread-replies-count', user.id] });
        await queryClient.refetchQueries({ queryKey: ['unread-replies-count', user.id] });
      }
    };

    markRepliesAsRead();
  }, [message.id, user?.id, isAdmin, queryClient]);

  // Auto-scroll to bottom when new replies arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      await createReply.mutateAsync({
        messageId: message.id,
        content: replyText,
      });
      setReplyText('');
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleEditReply = (replyId: string, content: string) => {
    setEditingId(replyId);
    setEditText(content);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingId) return;

    try {
      await updateReply.mutateAsync({
        replyId: editingId,
        content: editText,
        messageId: message.id,
      });
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Tem certeza que deseja apagar esta mensagem?')) return;

    try {
      await deleteReply.mutateAsync({
        replyId,
        messageId: message.id,
      });
    } catch (error) {
      console.error('Erro ao apagar mensagem:', error);
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Card className="card-elevated">
      <CardContent className="p-3 xs:p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base xs:text-lg font-semibold break-words flex-1">Conversa com {message.name}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-destructive hover:text-destructive-foreground flex-shrink-0 text-xs xs:text-sm"
          >
            ✕ Fechar
          </Button>
        </div>

        {/* Messages Container */}
        <div
          ref={scrollRef}
          className="space-y-3 xs:space-y-4 mb-4 max-h-[60vh] xs:max-h-96 overflow-y-auto scroll-smooth"
        >
          {/* Original Message */}
          <div className="flex gap-2 xs:gap-3">
            <Avatar className="h-8 w-8 xs:h-10 xs:w-10 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm xs:text-base">
                {message.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col xs:flex-row xs:items-baseline gap-0.5 xs:gap-2 mb-1">
                <span className="font-medium text-xs xs:text-sm break-words">{message.name}</span>
                <span className="text-[10px] xs:text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <Card className="bg-muted">
                <CardContent className="p-2 xs:p-3">
                  <p className="text-xs xs:text-sm break-words">{message.message}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Replies */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            replies.map((reply) => {
              const isOwnMessage = reply.sender_id === user?.id;
              const isSenderUser = reply.sender_id === message.user_id;
              const senderName = isSenderUser ? message.name : 'Administrador';
              const senderInitial = senderName.charAt(0).toUpperCase();
              const isEdited = new Date(reply.updated_at) > new Date(reply.created_at);
              const isEditing = editingId === reply.id;
              
              return (
                <div
                  key={reply.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      className={cn(
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {senderInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn('flex-1', isOwnMessage && 'text-right')}>
                    <div
                      className={cn(
                        'flex items-baseline gap-2 mb-1',
                        isOwnMessage && 'flex-row-reverse'
                      )}
                    >
                      <span className="font-medium text-sm">
                        {senderName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleString('pt-BR')}
                      </span>
                      {isEdited && !isEditing && (
                        <span className="text-xs text-muted-foreground italic">
                          Editada
                        </span>
                      )}
                    </div>
                    <Card
                      className={cn(
                        isOwnMessage
                          ? 'bg-primary/10'
                          : 'bg-muted'
                      )}
                    >
                      <CardContent className="p-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={handleEditKeyPress}
                              className="min-h-[60px] resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={updateReply.isPending}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={!editText.trim() || updateReply.isPending}
                              >
                                {updateReply.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                  <Check className="w-4 h-4 mr-1" />
                                )}
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="text-sm whitespace-pre-wrap flex-1">{reply.content}</p>
                            {isOwnMessage && (
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleEditReply(reply.id, reply.content)}
                                  disabled={deleteReply.isPending || updateReply.isPending}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 hover:text-destructive"
                                  onClick={() => handleDeleteReply(reply.id)}
                                  disabled={deleteReply.isPending || updateReply.isPending}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Input */}
        <div className="flex flex-col xs:flex-row gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isAdmin
                ? 'Digite sua resposta...'
                : 'Digite sua mensagem...'
            }
            className="min-h-[60px] xs:min-h-[80px] resize-none text-sm xs:text-base"
            disabled={createReply.isPending}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || createReply.isPending}
            className="btn-gradient shrink-0 w-full xs:w-auto"
            size="icon"
          >
            {createReply.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
