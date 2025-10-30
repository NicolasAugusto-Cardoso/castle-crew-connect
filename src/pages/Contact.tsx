import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContactMessages, ContactMessage } from '@/hooks/useContactMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { contactFormSchema } from '@/lib/validations';
import { toast } from 'sonner';

export default function Contact() {
  const { hasRole, loading: authLoading } = useAuth();
  const { messages, isLoading, createMessage, updateMessageStatus } = useContactMessages();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManageMessages = hasRole(['admin', 'social_media']);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
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
      
      await createMessage.mutateAsync(validated);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      toast.success('Mensagem enviada com sucesso!');
    } catch (error: any) {
      if (error.errors) {
        // Erros de validação Zod
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else {
        toast.error('Erro ao enviar mensagem');
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Contato</h1>
        </div>
        <p className="text-muted-foreground">
          {canManageMessages ? 'Gerencie as mensagens recebidas' : 'Entre em contato conosco'}
        </p>
      </div>

      {!canManageMessages && (
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
                {submitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageMessages && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Mensagens Recebidas</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3" />
                <p>Nenhuma mensagem recebida ainda</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg) => (
            <Card key={msg.id} className="card-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{msg.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {msg.phone}
                      </span>
                      {msg.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {msg.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(msg.status)}>
                    {getStatusLabel(msg.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed mb-4">{msg.message}</p>
                <p className="text-xs text-muted-foreground">
                  Recebida em {new Date(msg.created_at).toLocaleString('pt-BR')}
                </p>
                <div className="flex gap-2 mt-4">
                  {msg.status !== 'answered' && (
                    <Button
                      className="btn-accent"
                      size="sm"
                      onClick={() => updateMessageStatus.mutate({ id: msg.id, status: 'answered' })}
                      disabled={updateMessageStatus.isPending}
                    >
                      Responder
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )))}
        </div>
      )}
    </div>
  );
}
