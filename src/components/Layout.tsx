import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, FolderOpen, BookOpen, LogOut, UserCircle, Settings, UserCog, UserPlus, Trash2, Calendar, Heart, Book } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadReplies } from '@/hooks/useUnreadReplies';
import { useUnreadDiscipleship } from '@/hooks/useUnreadDiscipleship';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useShowCollaboratorsTab } from '@/hooks/useCollaborators';
import { useDonationsEnabled } from '@/hooks/useAppSettings';
import castleLogo from '@/assets/castle-logo-header-v2.png';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { COLOR_THEMES, getRouteTheme, THEME_VAR } from '@/lib/colorThemes';
import { cn } from '@/lib/utils';


export const Layout = () => {
  const { user, signOut, hasRole, userRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadReplies(user?.id, userRoles);
  const { unreadDiscipleshipCount } = useUnreadDiscipleship(user?.id, userRoles);
  const { data: showCollaboratorsTab } = useShowCollaboratorsTab();
  const { isDonationsEnabled } = useDonationsEnabled();
  
  // Registrar push notifications
  usePushNotifications(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['admin', 'social_media', 'collaborator', 'user', 'volunteer'] },
    { icon: BookOpen, label: 'Testemunhos', path: '/testimonials', roles: ['admin', 'social_media', 'collaborator', 'user', 'volunteer'] },
    { icon: Book, label: 'Bíblia', path: '/bible', roles: ['admin', 'social_media', 'collaborator', 'user', 'volunteer'] },
    { icon: Calendar, label: 'Agenda', path: '/events', roles: ['admin', 'social_media', 'volunteer'] },
    { icon: Heart, label: 'Doações', path: '/donations', roles: ['admin', 'user'], showWhen: isDonationsEnabled },
    { icon: MessageSquare, label: 'Contato', path: '/contact', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: FolderOpen, label: 'Galeria', path: '/gallery', roles: ['admin', 'social_media', 'user', 'volunteer'] },
    { icon: Users, label: 'Colaboradores', path: '/colaboradores', roles: ['user', 'admin', 'volunteer'], showWhen: showCollaboratorsTab },
    { icon: UserPlus, label: 'Discipulado', path: '/discipleship', roles: ['admin', 'collaborator', 'volunteer'] },
    { icon: UserCircle, label: 'Meu Perfil', path: '/collaborator/profile', roles: ['collaborator'] },
  ];

  const visibleNavItems = navItems.filter(item => {
    // Primeiro verifica se o usuário tem a role necessária
    const hasRequiredRole = hasRole(item.roles as any);
    if (!hasRequiredRole) return false;
    
    // Se tem condição showWhen, verifica ela também
    if ('showWhen' in item) {
      // Admin, user e volunteer sempre veem Colaboradores, independente do showWhen
      if (item.path === '/colaboradores' && hasRole(['admin', 'user', 'volunteer'])) {
        return true;
      }
      return item.showWhen === true;
    }
    
    return true;
  });

  // Get user name from metadata or email
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  const pageTheme = getRouteTheme(location.pathname);
  const pageVar = THEME_VAR[pageTheme];

  return (
    <div
      className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden"
      style={{ ['--page-primary' as any]: `var(${pageVar})` }}
    >
      
      {/* Header — REFACTOR Dark: fundo preto + borda prata sutil em vez de sombra branca */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/[0.08] backdrop-blur-sm pt-safe">
        <div className="w-full h-[60px] px-2 xs:px-3 sm:px-4 flex items-center justify-between md:px-8 relative">
          {/* Logo centralizada com position absolute */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img src={castleLogo} alt="UniCristo" className="h-10 xs:h-11 sm:h-12 md:h-14 w-auto" />
          </div>
          
          {/* Espaçador esquerdo */}
          <div className="w-8 xs:w-16 sm:w-24 md:w-32"></div>
          
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 w-auto justify-end">
            {/* Events Button - Only for user and collaborator roles - sempre renderizado para evitar atraso */}
            <button
              onClick={() => navigate('/events')}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                !hasRole(['user', 'collaborator']) ? 'invisible' : ''
              } ${
                location.pathname.startsWith('/events')
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:text-primary hover:bg-primary/5'
              }`}
              title="Agenda"
            >
              <Calendar className="w-5 h-5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-foreground hover:text-primary transition-colors p-1.5 xs:p-2">
                  <UserCircle className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline font-medium text-xs sm:text-sm md:text-base truncate max-w-[80px] md:max-w-none">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {hasRole(['admin']) && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/users')}>
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Gerenciar Usuários</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={() => navigate('/delete-account')} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir conta e dados</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:block fixed left-0 top-[calc(60px+var(--safe-top,0px))] bottom-0 w-64 bg-card border-r border-border z-30">
        <nav className="p-4 space-y-2">
            {visibleNavItems.map((item, index) => {
            const isActive = location.pathname === item.path;
              const t = COLOR_THEMES[getRouteTheme(item.path)];
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border',
                    isActive
                      ? ['bg-[hsl(var(--neon-card))]', t.accent, t.border, t.hoverShadow]
                      : ['text-slate-400 border-transparent hover:bg-white/[0.04]', t.hoverBorder, t.accent],
                  )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.path === '/contact' && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                  {item.path === '/discipleship' && unreadDiscipleshipCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadDiscipleshipCount}
                    </Badge>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 md:pb-4 md:ml-64 overflow-x-hidden overflow-y-auto relative z-0"
        style={{
          paddingTop: 'calc(60px + var(--safe-top, 0px))',
          paddingBottom: 'calc(72px + var(--safe-bottom, 0px))'
        }}
      >
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) — REFACTOR Dark: card escuro + borda prata em vez de gradiente azul */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-white/[0.08] md:hidden z-40 pb-safe-nav backdrop-blur-sm">
        <div className="flex justify-around items-center py-2">
          {visibleNavItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const t = COLOR_THEMES[getRouteTheme(item.path)];
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center justify-center px-3 py-2.5 transition-all duration-300 relative min-w-[44px] min-h-[44px]',
                  isActive ? t.accent : 'text-slate-400',
                )}
              >
                <div className="relative">
                  <item.icon className={cn('w-6 h-6', isActive && 'drop-shadow-[0_0_4px_currentColor]')} />
                  {item.path === '/contact' && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center p-0 text-[9px]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                  {item.path === '/discipleship' && unreadDiscipleshipCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center p-0 text-[9px]"
                    >
                      {unreadDiscipleshipCount > 9 ? '9+' : unreadDiscipleshipCount}
                    </Badge>
                  )}
                </div>
                {isActive && <div className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full shadow-[0_0_4px_currentColor]', t.accent, 'bg-current')} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
