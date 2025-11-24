import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useContactMessages } from '@/hooks/useContactMessages';
import { useContactReplies } from '@/hooks/useContactReplies';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ChatThread() {
  const { messageId } = useParams<{ messageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages } = useContactMessages();
  const message = messages.find(m => m.id === messageId);
  const { replies, isLoading, createReply, updateReply, deleteReply } = useContactReplies(messageId || '');
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Buscar avatar do usuário que enviou a mensagem inicial
  const { data: senderProfile } = useQuery({
    queryKey: ['sender-profile', message?.user_id],
    queryFn: async () => {
      if (!message?.user_id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', message.user_id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar perfil do remetente:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!message?.user_id,
  });

  // Marcar mensagens como lidas quando abrir a thread
  useEffect(() => {
    if (!user?.id || !messageId) return;

    const markRepliesAsRead = async () => {
      const unreadReplies = replies.filter(
        r => r.sender_id !== user.id && !r.is_read
      );

      if (unreadReplies.length === 0) return;

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
  }, [messageId, replies, user?.id, queryClient]);

  // Redirect if message not found
  useEffect(() => {
    if (!isLoading && !message && messageId) {
      toast.error('Conversa não encontrada');
      navigate('/contact');
    }
  }, [message, isLoading, messageId, navigate]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !messageId) return;

    try {
      await createReply.mutateAsync({
        messageId,
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
    if (!window.confirm('Tem certeza que deseja apagar esta mensagem?')) return;

    try {
      await deleteReply.mutateAsync({
        replyId,
        messageId: messageId || '',
      });
    } catch (error) {
      console.error('Erro ao apagar mensagem:', error);
    }
  };

  if (!message || !user) {
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

  // Preparar mensagens para o chat (mensagem original + respostas)
  const allMessages = [
    {
      id: message.id,
      content: message.message,
      sender_id: message.user_id || 'system', // user_id é o REMETENTE da mensagem inicial
      sender_name: message.name,
      sender_avatar: senderProfile?.avatar_url || null, // Avatar do usuário que enviou
      created_at: message.created_at,
      updated_at: message.created_at,
    },
    ...replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      sender_id: reply.sender_id,
      sender_name: reply.sender?.name || 'Usuário',
      sender_avatar: reply.sender?.avatar_url || null,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
    })),
  ];

  const chatSubtitle = message.collaborator_id
    ? 'Colaborador'
    : 'Equipe de Administração';

  return (
    <ChatContainer
      headerName={chatName}
      headerAvatar={chatAvatar}
      headerSubtitle={chatSubtitle}
      messages={allMessages}
      currentUserId={user.id}
      isLoading={isLoading}
      replyText={replyText}
      onReplyTextChange={setReplyText}
      onSendReply={handleSendReply}
      onKeyPress={handleKeyPress}
      editingId={editingId}
      editText={editText}
      onEditStart={handleEditReply}
      onEditSave={handleSaveEdit}
      onEditCancel={handleCancelEdit}
      onEditTextChange={setEditText}
      onDeleteReply={handleDeleteReply}
      isUpdating={updateReply.isPending}
      isDeleting={deleteReply.isPending}
      isSending={createReply.isPending}
    />
  );
}
