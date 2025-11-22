import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import castleLogo from '@/assets/castle-logo-main.png';
import { loginSchema, signupSchema } from '@/lib/validations';

export default function Login() {
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      
      console.log('[LOGIN] Tentando fazer login:', validated.email);
      
      const { data, error } = await signIn(validated.email, validated.password);
      
      console.log('[LOGIN] Resposta:', { 
        hasData: !!data, 
        hasError: !!error,
        hasSession: !!data?.session,
        errorMessage: error?.message 
      });
      
      if (error) {
        console.error('[LOGIN] Erro:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.');
        } else {
          toast.error('Erro ao fazer login: ' + error.message);
        }
      } else if (data?.session) {
        console.log('[LOGIN] Login realizado com sucesso!');
        toast.success('Login realizado com sucesso!');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        console.error('[LOGIN] Estado inesperado - sem erro mas sem sessão');
        toast.error('Erro inesperado ao processar login. Tente novamente.');
      }
    } catch (error: any) {
      console.error('[LOGIN] Exceção:', error);
      if (error.errors) {
        // Erros de validação Zod
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Erro ao validar dados de login. Verifique os campos.');
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
      
      console.log('[SIGNUP] Iniciando criação de conta:', validated.email);
      
      const { data, error } = await signUp(validated.email, validated.password, validated.name);
      
      console.log('[SIGNUP] Resposta:', { 
        hasData: !!data, 
        hasError: !!error,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        identitiesLength: data?.user?.identities?.length,
        errorMessage: error?.message 
      });
      
      if (error) {
        console.error('[SIGNUP] Erro explícito:', error);
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está cadastrado');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('A senha deve ter no mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial');
        } else if (error.message.includes('Password')) {
          toast.error('Senha inválida. Use no mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais');
        } else {
          toast.error('Erro ao criar conta: ' + error.message);
        }
      } else if (data?.user?.identities?.length === 0) {
        // E-mail duplicado (erro silencioso do Supabase)
        console.warn('[SIGNUP] E-mail duplicado detectado (identities vazio)');
        toast.error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
      } else if (data?.session) {
        // Confirmação automática habilitada - usuário já está logado
        console.log('[SIGNUP] Sucesso! Sessão criada, redirecionando...');
        toast.success('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else if (data?.user && !data?.session) {
        // Confirmação de e-mail necessária
        console.log('[SIGNUP] Usuário criado, aguardando confirmação de e-mail');
        toast.info('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      } else {
        // Caso inesperado
        console.error('[SIGNUP] Estado inesperado:', { data, error });
        toast.error('Erro ao processar criação de conta. Tente novamente.');
      }
    } catch (error: any) {
      console.error('[SIGNUP] Exceção:', error);
      if (error.errors && Array.isArray(error.errors)) {
        // Erros de validação Zod - mostrar TODOS os erros
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao validar dados. Verifique se a senha tem maiúscula, minúscula, número e caractere especial.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 xs:p-4 sm:p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md card-elevated">
        <CardHeader className="text-center space-y-3 xs:space-y-4 px-4 xs:px-6 pt-6 xs:pt-8">
          <div className="flex justify-center">
            <img 
              src={castleLogo} 
              alt="Castle Movement Logo" 
              className="w-20 h-20 xs:w-24 xs:h-24 rounded-full ring-4 ring-primary shadow-lg"
            />
          </div>
          <div>
            <CardTitle className="text-2xl xs:text-3xl gradient-text mb-1.5 xs:mb-2">Castle Movement</CardTitle>
            <CardDescription className="text-xs xs:text-sm">Faça login ou crie sua conta</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 xs:px-6 pb-6 xs:pb-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5 xs:mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3.5 xs:space-y-4">
                <div className="space-y-1.5 xs:space-y-2">
                  <Label htmlFor="login-email" className="text-xs xs:text-sm">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-10 xs:h-11 text-sm xs:text-base"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5 xs:space-y-2">
                  <Label htmlFor="login-password" className="text-xs xs:text-sm">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••"
                      className="h-10 xs:h-11 text-sm xs:text-base pr-10"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      disabled={isLoading}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 xs:h-11 sm:h-12 btn-gradient text-sm xs:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3.5 xs:space-y-4">
                <div className="space-y-1.5 xs:space-y-2">
                  <Label htmlFor="signup-name" className="text-xs xs:text-sm">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="h-10 xs:h-11 text-sm xs:text-base"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5 xs:space-y-2">
                  <Label htmlFor="signup-email" className="text-xs xs:text-sm">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-10 xs:h-11 text-sm xs:text-base"
                    required
                    disabled={isLoading}
                  />
                </div>

                 <div className="space-y-1.5 xs:space-y-2">
                  <Label htmlFor="signup-password" className="text-xs xs:text-sm">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="Mín. 8 caracteres"
                      className="h-10 xs:h-11 text-sm xs:text-base pr-10"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={isLoading}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] xs:text-xs text-muted-foreground leading-tight">
                    Sua senha deve ter no mínimo 8 caracteres e conter: letra maiúscula, minúscula, número e caractere especial
                  </p>
                </div>

                <div className="space-y-1.5 xs:space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-xs xs:text-sm">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      placeholder="••••••"
                      className="h-10 xs:h-11 text-sm xs:text-base pr-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 xs:h-11 sm:h-12 btn-accent text-sm xs:text-base"
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
