import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Phone, Mail, MapPin, User } from 'lucide-react';
import { DiscipleshipContact, CollaboratorProfile } from '@/types';

const mockCollaborator: CollaboratorProfile = {
  id: '1',
  userId: '3',
  name: 'João Silva',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
  church: 'Igreja Batista Central',
  position: 'Líder de Célula',
  bio: 'Apaixonado por evangelismo e discipulado. Atuando na zona sul de Marília há 3 anos.',
  region: 'Zona Sul',
  city: 'Marília',
  neighborhood: 'Jardim Estoril',
};

const mockContacts: DiscipleshipContact[] = [
  {
    id: '1',
    name: 'Lucas Fernando',
    phone: '(14) 99999-1111',
    email: 'lucas@email.com',
    age: 22,
    city: 'Marília',
    neighborhood: 'Jardim Estoril',
    assignedCollaboratorId: '1',
    assignedCollaboratorName: 'João Silva',
    status: 'first_contact',
    registeredBy: 'Social Media',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Amanda Costa',
    phone: '(14) 99999-2222',
    age: 19,
    city: 'Marília',
    neighborhood: 'Vila Haro',
    assignedCollaboratorId: '1',
    assignedCollaboratorName: 'João Silva',
    status: 'praying_together',
    registeredBy: 'Social Media',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

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
  const [contacts] = useState<DiscipleshipContact[]>(mockContacts);
  const [profile] = useState<CollaboratorProfile>(mockCollaborator);

  const isCollaborator = hasRole(['collaborator']);
  const canRegister = hasRole(['admin', 'social_media']);
  const isAdmin = hasRole(['admin']);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl md:ml-64">
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

      {/* Collaborator Profile */}
      {isCollaborator && (
        <Card className="mb-6 card-elevated">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-full ring-4 ring-primary"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.position} • {profile.church}</p>
                <Badge className="mt-2 bg-primary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {profile.region} - {profile.neighborhood}
                </Badge>
                <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Register Button */}
      {canRegister && (
        <Button className="w-full mb-6 h-14 btn-accent text-base">
          <Plus className="w-5 h-5 mr-2" />
          Cadastrar Nova Pessoa
        </Button>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User className="w-5 h-5" />
          {isCollaborator ? 'Pessoas que Acompanho' : 'Todos os Contatos'}
        </h2>
        
        {contacts.map((contact) => (
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
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Idade: {contact.age} anos</p>
                  {isAdmin && <p>Responsável: {contact.assignedCollaboratorName}</p>}
                  <p>Cadastrado em: {new Date(contact.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <Button className="btn-accent" size="sm">
                  Atualizar Status
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
