import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useContactMessages, ContactMessage } from '@/hooks/useContactMessages';
import { useUserRepliesNotifications } from '@/hooks/useContactReplies';
import { useUnreadReplies } from '@/hooks/useUnreadReplies';
import { MessageThread } from '@/components/contact/MessageThread';
import { DeleteConversationDialog } from '@/components/contact/DeleteConversationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Loader2, MessageSquare, Users, Trash2, Search } from 'lucide-react';
import { contactFormSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Contact() {
  const navigate = useNavigate();
  const { hasRole, loading: authLoading, user } = useAuth();
  const { messages, isLoading, createMessage, updateMessageStatus, deleteMessage } = useContactMessages();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const messageIdFromUrl = searchParams.get('messageId');
  const [collaboratorProfileId, setCollaboratorProfileId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to realtime notifications for new replies
  useUserRepliesNotifications();
  
  // Initialize unread replies hook
  useUnreadReplies(user?.id);

  // Query for unread counts per conversation
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['unread-per-conversation', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const { data, error } = await supabase
        .from('contact_replies')
        .select('message_id')
        .eq('is_read', false)
        .neq('sender_id', user.id);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((reply) => {
        counts[reply.message_id] = (counts[reply.message_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: !!user?.id,
  });

  // Realtime updates para mensagens
  useEffect(() => {
    console.log('📡 Configurando realtime updates para contact_messages');
    
    const channel = supabase
      .channel('contact-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('🔥 Mudança detectada em contact_messages:', payload);
          queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_replies'
        },
        (payload) => {
          console.log('🔥 Mudança detectada em contact_replies:', payload);
          queryClient.invalidateQueries({ queryKey: ['unread-per-conversation'] });
        }
      )
      .subscribe();

    return () => {
      console.log('📡 Removendo realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-navegar para thread se houver messageId na URL
  useEffect(() => {
    if (messageIdFromUrl && messages.length > 0) {
      const messageToOpen = messages.find(m => m.id === messageIdFromUrl);
      if (messageToOpen) {
        navigate(`/contact/${messageIdFromUrl}`);
        setSearchParams({});
      }
    }
  }, [messageIdFromUrl, messages, navigate, setSearchParams]);

  // Buscar perfil de colaborador se o usuário for colaborador
  const isCollaborator = hasRole(['collaborator']);
  
  useEffect(() => {
    if (isCollaborator && user?.id) {
      supabase
        .from('collaborator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setCollaboratorProfileId(data?.id || null);
        });
    }
  }, [isCollaborator, user?.id]);

  const canManageMessages = hasRole(['admin', 'social_media']);
  
  // Filter messages based on user role
  const displayedMessages = canManageMessages 
    ? messages.filter(m => !m.collaborator_id) // Admin vê apenas mensagens para administração
    : isCollaborator && collaboratorProfileId
      ? messages.filter(m => m.collaborator_id === collaboratorProfileId)
      : messages.filter(m => m.user_id === user?.id);

  // Separate messages by type for regular users
  const adminMessage = displayedMessages.find(m => !m.collaborator_id && m.user_id === user?.id);
  const collaboratorMessages = displayedMessages.filter(m => m.collaborator_id && m.user_id === user?.id);

  const handleDeleteConversation = async () => {
    if (!messageToDelete) return;
    await deleteMessage.mutateAsync(messageToDelete.id);
    setMessageToDelete(null);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validar dados do formulário
      const validated = contactFormSchema.parse({ 
        name, 
        phone, 
        email: email || undefined, 
        message 
      });
      
      // Garantir que phone é string (após transform)
      const messageData = {
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        message: validated.message
      };
      
      await createMessage.mutateAsync(messageData);
      
      // Limpar formulário apenas após sucesso
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.errors) {
        // Erros de validação Zod
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else if (error.code === 'PGRST116' || error.message?.includes('Rate limit')) {
        // Rate limiting atingido
        toast.error('⏱️ Limite de envios atingido. Você pode enviar no máximo 3 mensagens por hora.');
      } else if (error.code === '42501') {
        // Erro RLS específico - pode ser permissão ou autenticação
        toast.error('🔐 Erro de permissão. Por favor, faça logout e login novamente.');
      } else if (error.message?.includes('Authentication required')) {
        toast.error('🔐 Sua sessão expirou. Faça login novamente.');
      } else if (error.code === '23505') {
        toast.error('Você já enviou uma mensagem recentemente. Aguarde alguns minutos.');
      } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        toast.error('🔐 Você precisa estar logado para enviar mensagens.');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao enviar mensagem. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new': return 'bg-accent text-accent-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'answered': return 'bg-green-500 text-white';
      default: return 'bg-secondary';
    }
  };

  const getStatusLabel = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new': return 'Nova';
      case 'in_progress': return 'Em andamento';
      case 'answered': return 'Respondida';
      default: return status;
    }
  };

  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const filterMessages = (msgs: ContactMessage[]) => {
    if (!searchTerm.trim()) return msgs;
    const term = searchTerm.toLowerCase();
    return msgs.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term) ||
        m.collaborator_name?.toLowerCase().includes(term)
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Padding Superior com fundo branco */}
      <div className="bg-white dark:bg-card py-4 xs:py-5 sm:py-6">
        <div className="container mx-auto px-3 xs:px-4 max-w-4xl">
          <div className="flex items-center gap-2 xs:gap-3 mb-2">
            <Mail className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-2xl xs:text-2xl sm:text-3xl font-bold gradient-text">Contato</h1>
          </div>
          <p className="text-sm xs:text-base text-muted-foreground">
            {canManageMessages ? 'Gerencie as mensagens recebidas' : 'Entre em contato conosco'}
          </p>
        </div>
      </div>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 bg-transparent py-4 xs:py-5 sm:py-6">
        <div className="container mx-auto px-3 xs:px-4 max-w-4xl">
          {!canManageMessages && !isCollaborator && !adminMessage && (
        <Card className="mb-6 card-elevated">
          <CardHeader>
            <CardTitle>Envie uma Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  rows={5}
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full h-12 btn-gradient" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {submitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageMessages && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Mensagens Recebidas</h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filterMessages(displayedMessages).length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3" />
                <p>Nenhuma mensagem recebida ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              {filterMessages(displayedMessages).map((msg, index) => (
                <div 
                  key={msg.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/contact/${msg.id}`)}
                  style={{ borderBottom: index < displayedMessages.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none' }}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                      {msg.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatCompactDate(msg.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {msg.status === 'new' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                        {unreadCounts[msg.id] > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-5 px-1.5 text-xs font-bold rounded-full"
                          >
                            {unreadCounts[msg.id]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seção para Colaboradores */}
      {isCollaborator && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Mensagens Recebidas</h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading || !collaboratorProfileId ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filterMessages(displayedMessages).length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3" />
                <p>Nenhuma mensagem recebida ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              {filterMessages(displayedMessages).map((msg, index) => (
                <div 
                  key={msg.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/contact/${msg.id}`)}
                  style={{ borderBottom: index < displayedMessages.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none' }}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                      {msg.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatCompactDate(msg.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {msg.status === 'new' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                        {unreadCounts[msg.id] > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-5 px-1.5 text-xs font-bold rounded-full"
                          >
                            {unreadCounts[msg.id]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!canManageMessages && !isCollaborator && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Minhas Mensagens</h2>
          <div className="space-y-6">
            {/* Card de Administração - Sempre Visível */}
            <Card className="card-elevated border-2 border-primary/20 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => adminMessage && navigate(`/contact/${adminMessage.id}`)}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">Mensagem para Administração</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {adminMessage ? 'Conversa ativa' : 'Use o formulário acima para enviar sua primeira mensagem'}
                    </p>
                  </div>
                  {adminMessage && (
                    <Badge className={`${getStatusColor(adminMessage.status)} whitespace-nowrap text-xs px-2 py-1`}>
                      {getStatusLabel(adminMessage.status)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {adminMessage && (
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-2 break-words">{adminMessage.message}</p>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Última atualização: {new Date(adminMessage.updated_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-2 w-full xs:w-auto">
                      <Button
                        className="btn-gradient flex-1 xs:flex-initial"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contact/${adminMessage.id}`);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Abrir conversa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageToDelete(adminMessage);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={deleteMessage.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Lista de mensagens com colaboradores */}
            {collaboratorMessages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  Conversas com Colaboradores
                </h3>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou mensagem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="bg-background rounded-lg border border-border overflow-hidden">
                  {filterMessages(collaboratorMessages).map((msg, index) => (
                    <div 
                      key={msg.id}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/contact/${msg.id}`)}
                      style={{ borderBottom: index < collaboratorMessages.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none' }}
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={msg.collaborator_avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                          {msg.collaborator_name?.charAt(0)?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">
                            {msg.collaborator_name || 'Colaborador'}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatCompactDate(msg.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground truncate">
                            {msg.message}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {msg.status === 'new' && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                            )}
                            {unreadCounts[msg.id] > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="h-5 min-w-5 px-1.5 text-xs font-bold rounded-full"
                              >
                                {unreadCounts[msg.id]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>

    {/* Dialog de Confirmação de Exclusão */}
      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConversation}
        conversationWith={
          messageToDelete?.collaborator_id
            ? messageToDelete.collaborator_name || 'Colaborador'
            : 'Administração'
        }
      />

    </div>
  );
}
