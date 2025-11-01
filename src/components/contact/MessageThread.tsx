import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContactReplies } from '@/hooks/useContactReplies';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { ContactMessage } from '@/hooks/useContactMessages';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  message: ContactMessage;
  onClose: () => void;
}

export const MessageThread = ({ message, onClose }: MessageThreadProps) => {
  const { user, hasRole } = useAuth();
  const { replies, isLoading, createReply } = useContactReplies(message.id);
  const [replyText, setReplyText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = hasRole(['admin', 'social_media']);

  // Auto-scroll to bottom when new replies arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      await createReply.mutateAsync(replyText);
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

  return (
    <Card className="card-elevated">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Conversa com {message.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕ Fechar
          </Button>
        </div>

        {/* Messages Container */}
        <div
          ref={scrollRef}
          className="space-y-4 mb-4 max-h-96 overflow-y-auto scroll-smooth"
        >
          {/* Original Message */}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {message.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-medium text-sm">{message.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <p className="text-sm">{message.message}</p>
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
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {reply.sender?.name?.charAt(0).toUpperCase() || '?'}
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
                        {reply.sender?.name || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <Card
                      className={cn(
                        isOwnMessage
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Input */}
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isAdmin
                ? 'Digite sua resposta... (Enter para enviar)'
                : 'Digite sua mensagem... (Enter para enviar)'
            }
            className="min-h-[80px] resize-none"
            disabled={createReply.isPending}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || createReply.isPending}
            className="btn-gradient shrink-0"
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
