import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, FolderOpen, BookOpen, LogOut, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadReplies } from '@/hooks/useUnreadReplies';
import { useShowCollaboratorsTab } from '@/hooks/useCollaborators';
import castleLogo from '@/assets/castle-logo-final.png';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const Layout = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadReplies(user?.id);
  const { data: showCollaboratorsTab } = useShowCollaboratorsTab();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: BookOpen, label: 'Testemunhos', path: '/testimonials', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: MessageSquare, label: 'Contato', path: '/contact', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: FolderOpen, label: 'Galeria', path: '/gallery', roles: ['admin', 'social_media', 'user'] },
    { icon: Users, label: 'Colaboradores', path: '/colaboradores', roles: ['user', 'admin'], showWhen: showCollaboratorsTab },
    { icon: Users, label: 'Discipulado', path: '/discipleship', roles: ['admin', 'social_media', 'collaborator'] },
    { icon: UserCircle, label: 'Meu Perfil', path: '/collaborator/profile', roles: ['collaborator'] },
  ];

  const visibleNavItems = navItems.filter(item => {
    // Primeiro verifica se o usuário tem a role necessária
    const hasRequiredRole = hasRole(item.roles as any);
    if (!hasRequiredRole) return false;
    
    // Se tem condição showWhen, verifica ela também
    if ('showWhen' in item) {
      return item.showWhen === true;
    }
    
    return true;
  });

  // Get user name from metadata or email
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] h-[60px]">
        <div className="w-full h-full px-2 xs:px-3 sm:px-4 flex items-center justify-between md:px-8">
          <div className="w-8 xs:w-16 sm:w-24 md:w-32"></div>
          
          <div className="flex items-center justify-center flex-1">
            <img src={castleLogo} alt="Castle Movement" className="h-10 xs:h-11 sm:h-12 md:h-14 w-auto" />
          </div>
          
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-4 w-8 xs:w-16 sm:w-24 md:w-32 justify-end">
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
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Gerenciar Usuários</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:block fixed left-0 top-[60px] bottom-0 w-64 bg-card border-r border-border z-30">
        <nav className="p-4 space-y-2">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'hover:bg-secondary text-foreground'
                }`}
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
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-[60px] pb-20 md:pb-4 md:ml-64 overflow-x-hidden">
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#33C2FF] to-[#2367FF] md:hidden z-40" style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center py-2.5">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-center px-3 py-2.5 transition-all relative min-w-[44px] min-h-[44px] ${
                  isActive 
                    ? 'text-white' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <div className="relative">
                  <item.icon className={`w-7 h-7 ${isActive ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : ''}`} />
                  {item.path === '/contact' && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center p-0 text-[9px]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-white/40 rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
