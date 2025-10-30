import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import castleLogo from '@/assets/castle-logo.png';
import { loginSchema, signupSchema } from '@/lib/validations';

export default function Login() {
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar dados de login
      const validated = loginSchema.parse(loginData);
      
      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-mail ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Confirme seu e-mail antes de fazer login');
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast.success('Login realizado com sucesso!');
        window.location.href = '/';
      }
    } catch (error: any) {
      if (error.errors) {
        // Erros de validação Zod
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else {
        toast.error('Erro ao fazer login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar dados de cadastro
      const validated = signupSchema.parse(signupData);
      
      const { data, error } = await signUp(validated.email, validated.password, validated.name);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está cadastrado');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('A senha deve ter no mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial');
        } else {
          toast.error('Erro ao criar conta: ' + error.message);
        }
      } else {
        // Verificar se a sessão foi criada automaticamente
        if (data?.session) {
          // Confirmação automática habilitada - usuário já está logado
          toast.success('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else if (data?.user && !data?.session) {
          // Confirmação de e-mail necessária
          toast.info('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        }
      }
    } catch (error: any) {
      if (error.errors) {
        // Erros de validação Zod
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else {
        toast.error('Erro ao criar conta');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md card-elevated">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={castleLogo} 
              alt="Castle Movement Logo" 
              className="w-24 h-24 rounded-full ring-4 ring-primary shadow-lg"
            />
          </div>
          <div>
            <CardTitle className="text-3xl gradient-text mb-2">Castle Movement</CardTitle>
            <CardDescription>Faça login ou crie sua conta</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 btn-gradient text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="Seu nome"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Mín. 8 caracteres, maiúscula, minúscula, número e especial"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sua senha deve ter no mínimo 8 caracteres e conter: letra maiúscula, minúscula, número e caractere especial
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    placeholder="••••••"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 btn-accent text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
