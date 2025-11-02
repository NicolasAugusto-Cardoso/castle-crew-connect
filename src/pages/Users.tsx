import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, UserWithRoles } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCircle, Mail, Shield, Loader2 } from 'lucide-react';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';

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
  const { hasRole, loading: authLoading } = useAuth();
  const { users, isLoading, createUser, updateUserRoles, isCreating, isUpdating } = useUsers();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  const isAdmin = hasRole(['admin']);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <UserCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores podem visualizar esta seção.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateUser = (data: {
    email: string;
    password: string;
    name: string;
    roles: string[];
  }) => {
    createUser(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  const handleEditUser = (data: { userId: string; roles: string[] }) => {
    updateUserRoles(data, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedUser(null);
      },
    });
  };

  const openEditDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Gerenciar Usuários</h1>
        </div>
        <p className="text-muted-foreground">
          Crie e gerencie usuários do sistema
        </p>
      </div>

      <Button
        className="w-full mb-6 h-14 btn-gradient text-base"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="w-5 h-5 mr-2" />
        Novo Usuário
      </Button>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="card-elevated">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {user.roles.map((role) => (
                      <Badge key={role} className={roleColors[role]}>
                        {roleLabels[role]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                    <p>Permissões: {user.roles.length}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateUser}
        isLoading={isCreating}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSubmit={handleEditUser}
        isLoading={isUpdating}
      />
    </div>
  );
}
