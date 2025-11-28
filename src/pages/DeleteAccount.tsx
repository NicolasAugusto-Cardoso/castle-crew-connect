import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { toast } from 'sonner';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated } = useAuth();
  const { deleteAccount, isDeleting } = useDeleteAccount();
  
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!confirmed) {
      toast.error('Você precisa confirmar que entende a ação');
      return;
    }

    if (confirmText.toUpperCase() !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar');
      return;
    }

    try {
      await deleteAccount();
      toast.success('Conta excluída com sucesso');
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Login necessário</h2>
          <p className="text-muted-foreground mb-4">
            Para excluir sua conta, você precisa estar logado no aplicativo.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-lg font-semibold">Excluir Conta</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 pb-24 px-4">
        <Card className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Excluir Conta e Dados</h2>
            <p className="text-muted-foreground">
              Esta ação é permanente e não pode ser desfeita
            </p>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              O que será excluído:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li>• Seu perfil e informações pessoais</li>
              <li>• Todas as mensagens enviadas</li>
              <li>• Testemunhos publicados (serão anonimizados)</li>
              <li>• Registros de contato e discipulado vinculados</li>
              <li>• Posts, comentários e reações</li>
              <li>• Tokens de notificação push</li>
              <li>• Sua conta de autenticação</li>
            </ul>
          </div>

          {/* Confirmation */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <Label htmlFor="confirm" className="text-sm leading-relaxed cursor-pointer">
                Entendo que esta ação é permanente e não pode ser desfeita. Todos os meus dados serão removidos do Castle Movement.
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmText" className="text-sm">
                Digite <span className="font-bold">EXCLUIR</span> para confirmar:
              </Label>
              <Input
                id="confirmText"
                type="text"
                placeholder="Digite EXCLUIR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={!confirmed || isDeleting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={!confirmed || confirmText.toUpperCase() !== 'EXCLUIR' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Conta Definitivamente
                </>
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
