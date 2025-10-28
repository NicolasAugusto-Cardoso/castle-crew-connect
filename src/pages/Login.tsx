import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Crown } from 'lucide-react';
import castleLogo from '@/assets/castle-logo.jpeg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl p-8 card-elevated">
          <div className="flex flex-col items-center mb-8">
            <img src={castleLogo} alt="Castle Movement" className="w-48 h-auto mb-4" />
            <div className="flex items-center gap-2 text-accent">
              <Crown className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Bem-vindo</h1>
              <Crown className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-center mt-2">
              Faça login para acessar o movimento
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-gradient text-lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-secondary rounded-lg">
            <p className="text-sm font-semibold mb-2">Contas de teste:</p>
            <p className="text-xs text-muted-foreground">Admin: admin@castle.com</p>
            <p className="text-xs text-muted-foreground">Social Media: social@castle.com</p>
            <p className="text-xs text-muted-foreground">Colaborador: colab@castle.com</p>
            <p className="text-xs text-muted-foreground">Usuário: user@castle.com</p>
            <p className="text-xs text-muted-foreground mt-2">Senha: qualquer valor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
