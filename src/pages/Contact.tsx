import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Phone, Send } from 'lucide-react';
import { ContactMessage } from '@/types';

const mockMessages: ContactMessage[] = [
  {
    id: '1',
    name: 'Pedro Oliveira',
    phone: '(14) 99999-0001',
    email: 'pedro@email.com',
    message: 'Gostaria de participar do próximo culto jovem. Como faço?',
    status: 'new',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    name: 'Ana Paula',
    phone: '(14) 99999-0002',
    message: 'Preciso de oração pela minha família.',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function Contact() {
  const { hasRole } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [messages] = useState<ContactMessage[]>(mockMessages);

  const canManageMessages = hasRole(['admin', 'social_media']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Mensagem enviada! Entraremos em contato em breve.');
    setName('');
    setPhone('');
    setMessage('');
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
                />
              </div>

              <Button type="submit" className="w-full h-12 btn-gradient">
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensagem
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageMessages && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Mensagens Recebidas</h2>
          {messages.map((msg) => (
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
                  Recebida em {new Date(msg.createdAt).toLocaleString('pt-BR')}
                </p>
                {msg.status !== 'answered' && (
                  <Button className="mt-4 btn-accent" size="sm">
                    Responder
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
