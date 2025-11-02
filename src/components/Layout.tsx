import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, FolderOpen, BookOpen, LogOut, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadReplies } from '@/hooks/useUnreadReplies';
import castleLogo from '@/assets/castle-logo-final.png';
import { Badge } from '@/components/ui/badge';

export const Layout = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadReplies(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: BookOpen, label: 'Testemunhos', path: '/testimonials', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: MessageSquare, label: 'Contato', path: '/contact', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: FolderOpen, label: 'Galeria', path: '/gallery', roles: ['admin', 'social_media', 'user'] },
    { icon: Users, label: 'Discipulado', path: '/discipleship', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: Settings, label: 'Usuários', path: '/users', roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => 
    hasRole(item.roles as any)
  );

  // Get user name from metadata or email
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-light to-primary-dark shadow-lg">
        <div className="w-full px-2 xs:px-3 sm:px-4 py-1 sm:py-0.5 flex items-center justify-between md:px-8">
          <div className="w-8 xs:w-16 sm:w-24 md:w-32"></div>
          
          <div className="flex items-center justify-center flex-1">
            <img src={castleLogo} alt="Castle Movement" className="h-10 xs:h-11 sm:h-12 md:h-14 w-auto" />
          </div>
          
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-4 w-8 xs:w-16 sm:w-24 md:w-32 justify-end">
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-white">
              <UserCircle className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline font-medium text-xs sm:text-sm md:text-base truncate max-w-[80px] md:max-w-none">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white hover:text-accent transition-colors p-1.5 xs:p-2"
              title="Sair"
            >
              <LogOut className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border overflow-y-auto z-30">
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
      <main className="flex-1 pb-20 md:pb-4 md:ml-64">
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-30 safe-area-bottom">
        <div className="flex justify-around items-center py-1.5 xs:py-2">
          {visibleNavItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 sm:px-3 py-1.5 xs:py-2 transition-colors relative ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4.5 xs:w-5 sm:w-5.5 h-4.5 xs:h-5 sm:h-5.5" />
                  {item.path === '/contact' && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-3.5 w-3.5 xs:h-4 xs:w-4 flex items-center justify-center p-0 text-[9px] xs:text-[10px]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] xs:text-xs leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
