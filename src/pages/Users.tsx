import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, UserWithRoles } from '@/hooks/useUsers';
import { useDonationsEnabled, useUpdateAppSetting } from '@/hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, UserCircle, Mail, Shield, Loader2, Trash2, Search, Settings, Heart } from 'lucide-react';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  social_media: 'Social Media',
  collaborator: 'Colaborador',
  volunteer: 'Voluntário',
  user: 'Usuário',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  social_media: 'bg-accent text-accent-foreground',
  collaborator: 'bg-primary text-primary-foreground',
  volunteer: 'bg-orange-500 text-white',
  user: 'bg-secondary text-secondary-foreground',
};

export default function Users() {
  const { hasRole, loading: authLoading, user: currentUser } = useAuth();
  const { users, isLoading, createUser, updateUserRoles, deleteUser, isCreating, isUpdating, isDeleting } = useUsers();
  const { isDonationsEnabled, isLoading: isLoadingSettings } = useDonationsEnabled();
  const updateSetting = useUpdateAppSetting();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const handleToggleDonations = () => {
    updateSetting.mutate({ key: 'donations_enabled', value: !isDonationsEnabled });
  };

  const isAdmin = hasRole(['admin']);

  // Filtrar usuários baseado em busca e role
  const filteredUsers = users.filter(userItem => {
    const matchesSearch = 
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || userItem.roles.includes(roleFilter);
    
    return matchesSearch && matchesRole;
  });

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

  const openDeleteDialog = (user: UserWithRoles) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      },
    });
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

      {/* Configurações do App */}
      <Card className="card-elevated mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Configurações do App</CardTitle>
          </div>
          <CardDescription>
            Gerencie as funcionalidades disponíveis no aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="donations-toggle" className="font-medium cursor-pointer">
                  Aba Doações
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quando ligada, aparece para admins e usuários
                </p>
              </div>
            </div>
            <Switch
              id="donations-toggle"
              checked={isDonationsEnabled}
              onCheckedChange={handleToggleDonations}
              disabled={isLoadingSettings || updateSetting.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full mb-6 h-14 btn-gradient text-base"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="w-5 h-5 mr-2" />
        Novo Usuário
      </Button>

      {/* Filtros de busca e role */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="collaborator">Colaborador</SelectItem>
            <SelectItem value="volunteer">Voluntário</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCircle className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhum usuário encontrado</p>
            <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((userItem) => (
            <Card key={userItem.id} className="card-elevated">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{userItem.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="w-4 h-4" />
                        {userItem.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {userItem.roles.map((role) => (
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
                    <p>Criado em: {new Date(userItem.created_at).toLocaleDateString('pt-BR')}</p>
                    <p>Permissões: {userItem.roles.length}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(userItem)}>
                      Editar
                    </Button>
                    {userItem.id !== currentUser?.id && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => openDeleteDialog(userItem)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
