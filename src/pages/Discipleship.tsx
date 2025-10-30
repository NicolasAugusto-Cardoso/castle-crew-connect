import { useAuth } from '@/hooks/useAuth';
import { useDiscipleship } from '@/hooks/useDiscipleship';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Mail, MapPin, User, Loader2 } from 'lucide-react';
import { CreateContactDialog } from '@/components/discipleship/CreateContactDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusLabels: Record<string, string> = {
  not_contacted: 'Não Contatado',
  first_contact: 'Primeiro Contato',
  praying_together: 'Orando Junto',
  attending_church: 'Frequentando Igreja',
  needs_visit: 'Precisa Visita',
  needs_prayer: 'Precisa Oração',
  referred_to_leadership: 'Encaminhado',
};

export default function Discipleship() {
  const { hasRole, user } = useAuth();
  const { contacts, isLoading, updateContactStatus } = useDiscipleship();

  const isCollaborator = hasRole(['collaborator']);
  const canRegister = hasRole(['admin', 'social_media']);

  // Filter contacts for collaborators
  const filteredContacts = isCollaborator
    ? contacts.filter(c => c.assigned_collaborator_id === user?.id)
    : contacts;

  const handleStatusChange = (contactId: string, newStatus: string) => {
    updateContactStatus.mutate({ id: contactId, status: newStatus });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Discipulado</h1>
        </div>
        <p className="text-muted-foreground">
          {isCollaborator 
            ? 'Acompanhe as pessoas sob sua responsabilidade' 
            : 'Gerencie contatos e acompanhamentos'}
        </p>
      </div>

      {/* Register Button */}
      {canRegister && (
        <div className="mb-6">
          <CreateContactDialog />
        </div>
      )}

      {/* Contacts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhum contato cadastrado ainda</p>
            {canRegister && (
              <p className="text-sm mt-2">Cadastre a primeira pessoa!</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            {isCollaborator ? 'Pessoas que Acompanho' : 'Todos os Contatos'}
          </h2>
          
          {filteredContacts.map((contact) => (
          <Card key={contact.id} className="card-elevated">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </span>
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {contact.neighborhood}
                    </span>
                  </div>
                </div>
                <Badge className="bg-primary">
                  {statusLabels[contact.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  {contact.age && <p>Idade: {contact.age} anos</p>}
                  {contact.assigned_collaborator_name && (
                    <p>Responsável: {contact.assigned_collaborator_name}</p>
                  )}
                  <p>Cadastrado em: {new Date(contact.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <Select
                  value={contact.status}
                  onValueChange={(value) => handleStatusChange(contact.id, value)}
                  disabled={updateContactStatus.isPending}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}
