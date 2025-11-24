import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useContactMessages } from '@/hooks/useContactMessages';
import { useContactReplies } from '@/hooks/useContactReplies';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function ChatThread() {
  const { messageId } = useParams<{ messageId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { messages } = useContactMessages();
  const message = messages.find(m => m.id === messageId);
  const { replies, isLoading, createReply, updateReply, deleteReply } = useContactReplies(messageId || '');
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = hasRole(['admin', 'social_media']);

  // Marcar mensagens como lidas quando abrir a thread
  useEffect(() => {
    if (!user?.id || isAdmin || !messageId) return;

    const markRepliesAsRead = async () => {
      const { error } = await supabase
        .from('contact_replies')
        .update({ is_read: true })
        .eq('message_id', messageId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['unread-replies-count', user.id] });
      }
    };

    markRepliesAsRead();
  }, [messageId, user?.id, isAdmin, queryClient]);

  // Auto-scroll to bottom when new replies arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  // Redirect if message not found
  useEffect(() => {
    if (!messageId || (messages.length > 0 && !message)) {
      navigate('/contact');
    }
  }, [messageId, message, messages, navigate]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !messageId) return;

    try {
      await createReply.mutateAsync({
        messageId,
        content: replyText,
      });
      setReplyText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
    if (!editText.trim() || !editingId || !messageId) return;

    try {
      await updateReply.mutateAsync({
        replyId: editingId,
        content: editText,
        messageId,
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
        messageId: messageId || '',
      });
    } catch (error) {
      console.error('Erro ao apagar mensagem:', error);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (!message) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const chatName = message.collaborator_id 
    ? (message as any).collaborator_name || 'Colaborador'
    : 'Administração';

  const chatAvatar = message.collaborator_id 
    ? (message as any).collaborator_avatar
    : null;

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      {/* Header Fixo */}
      <header className="bg-gradient-to-r from-[#33C2FF] to-[#2367FF] text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/contact')}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Avatar className="h-10 w-10 border-2 border-white/30 shrink-0">
            <AvatarImage src={chatAvatar || undefined} />
            <AvatarFallback className="bg-white/20 text-white font-semibold">
              {chatName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">{chatName}</h1>
            <p className="text-xs text-white/80">
              {message.collaborator_id ? 'Colaborador' : 'Equipe de Administração'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* Original Message */}
        <div className="flex justify-start">
          <div className="flex gap-2 max-w-[85%] sm:max-w-[75%]">
            <Avatar className="h-8 w-8 shrink-0 mt-1">
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {message.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-2.5">
                <p className="text-sm font-medium text-primary mb-1">{message.name}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {message.message}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 px-2">
                {new Date(message.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
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
            const isEdited = new Date(reply.updated_at) > new Date(reply.created_at);
            const isEditing = editingId === reply.id;

            return (
              <div
                key={reply.id}
                className={cn(
                  'flex',
                  isOwnMessage ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  'flex gap-2 max-w-[85%] sm:max-w-[75%]',
                  isOwnMessage && 'flex-row-reverse'
                )}>
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback
                      className={cn(
                        'text-sm font-medium',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn('flex-1', isOwnMessage && 'flex flex-col items-end')}>
                    {isEditing ? (
                      <div className={cn(
                        'rounded-2xl shadow-sm px-4 py-2.5 w-full',
                        isOwnMessage
                          ? 'bg-primary/90 rounded-tr-sm'
                          : 'bg-white rounded-tl-sm'
                      )}>
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px] mb-2 bg-white"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            disabled={updateReply.isPending}
                            className="h-7 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editText.trim() || updateReply.isPending}
                            className="h-7 text-xs bg-white text-primary hover:bg-white/90"
                          >
                            {updateReply.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Check className="w-3 h-3 mr-1" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          'rounded-2xl shadow-sm px-4 py-2.5 group relative',
                          isOwnMessage
                            ? 'bg-primary/90 text-primary-foreground rounded-tr-sm'
                            : 'bg-white text-foreground rounded-tl-sm'
                        )}>
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed pr-8">
                            {reply.content}
                          </p>
                          
                          {isOwnMessage && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-white/20"
                                onClick={() => handleEditReply(reply.id, reply.content)}
                                disabled={deleteReply.isPending || updateReply.isPending}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-destructive/20"
                                onClick={() => handleDeleteReply(reply.id)}
                                disabled={deleteReply.isPending || updateReply.isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className={cn(
                          'text-xs text-muted-foreground mt-1 px-2 flex items-center gap-1',
                          isOwnMessage && 'justify-end'
                        )}>
                          <span>
                            {new Date(reply.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isEdited && <span className="italic">• Editada</span>}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area Fixo */}
      <div className="bg-white border-t border-border sticky bottom-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2 items-end" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <Textarea
            ref={textareaRef}
            value={replyText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            placeholder={isAdmin ? 'Digite sua resposta...' : 'Digite sua mensagem...'}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-full px-4 py-3 border-2 focus-visible:ring-1"
            rows={1}
            disabled={createReply.isPending}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || createReply.isPending}
            size="icon"
            className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 shrink-0"
          >
            {createReply.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
