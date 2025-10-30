import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, FolderOpen, BookOpen, LogOut, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import castleLogo from '@/assets/castle-logo.png';

export const Layout = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: BookOpen, label: 'Testemunhos', path: '/testimonials', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: MessageSquare, label: 'Contato', path: '/contact', roles: ['admin', 'social_media', 'collaborator', 'user'] },
    { icon: FolderOpen, label: 'Galeria', path: '/gallery', roles: ['admin', 'social_media'] },
    { icon: Users, label: 'Discipulado', path: '/discipleship', roles: ['admin', 'social_media', 'collaborator'] },
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
        <div className="w-full pl-2 pr-4 py-3 flex items-center justify-between md:pl-4">
          <div className="flex items-center gap-3">
            <img src={castleLogo} alt="Castle Movement" className="h-10 w-auto" />
          </div>
          
          <div className="flex items-center gap-4 md:mr-4">
            <div className="flex items-center gap-2 text-white">
              <UserCircle className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white hover:text-accent transition-colors p-2"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
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
                <item.icon className="w-5 h-5" />
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
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-30">
        <div className="flex justify-around items-center py-2">
          {visibleNavItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
