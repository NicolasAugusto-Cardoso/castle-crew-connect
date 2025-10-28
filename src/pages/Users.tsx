import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCircle, Mail, Shield } from 'lucide-react';
import { User } from '@/types';

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@castle.com',
    name: 'Admin Castle',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'social@castle.com',
    name: 'Mídia Castle',
    role: 'social_media',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'colab@castle.com',
    name: 'João Silva',
    role: 'collaborator',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  social_media: 'Social Media',
  collaborator: 'Colaborador',
  user: 'Usuário',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  social_media: 'bg-accent text-accent-foreground',
  collaborator: 'bg-primary text-primary-foreground',
  user: 'bg-secondary text-secondary-foreground',
};

export default function Users() {
  const { hasRole } = useAuth();
  const [users] = useState<User[]>(mockUsers);

  useEffect(() => {
    if (!hasRole(['admin'])) {
      window.location.href = '/';
    }
  }, [hasRole]);

  if (!hasRole(['admin'])) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Gerenciar Usuários</h1>
        </div>
        <p className="text-muted-foreground">
          Crie e gerencie usuários do sistema
        </p>
      </div>

      <Button className="w-full mb-6 h-14 btn-gradient text-base">
        <Plus className="w-5 h-5 mr-2" />
        Novo Usuário
      </Button>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="card-elevated">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </p>
                  </div>
                </div>
                <Badge className={roleColors[user.role]}>
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p>Status: {user.isActive ? 'Ativo' : 'Inativo'}</p>
                </div>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
