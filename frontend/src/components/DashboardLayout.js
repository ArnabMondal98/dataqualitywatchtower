import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  Shield,
  LayoutDashboard,
  Database,
  CheckCircle2,
  GitBranch,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User
} from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isDemo, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Data Sources', href: '/dashboard/sources', icon: Database },
    { name: 'Quality Checks', href: '/dashboard/quality', icon: CheckCircle2 },
    { name: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? '' : 'sidebar-hidden'}`}
        data-testid="dashboard-sidebar"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight">WATCHTOWER</span>
            </Link>
          </div>

          {/* Demo Badge */}
          {isDemo && (
            <div className="mx-4 mt-4 px-3 py-2 bg-accent/10 border border-accent/30 text-accent text-xs font-mono text-center">
              DEMO MODE
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                    active 
                      ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                  <span className="font-mono uppercase tracking-wide">{item.name}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-8 h-8 bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-mono text-sm">SIGN OUT</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login" className="block">
                  <Button className="w-full watchtower-btn-primary" data-testid="sidebar-login-btn">
                    SIGN IN
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="outline" className="w-full border-white/20" data-testid="sidebar-register-btn">
                    CREATE ACCOUNT
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Dashboard</span>
              {location.pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-primary">
                    {navigation.find(n => isActive(n.href))?.name || 'Page'}
                  </span>
                </>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {isDemo && (
                <Link to="/register">
                  <Button size="sm" className="watchtower-btn-primary text-xs" data-testid="upgrade-btn">
                    UPGRADE
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
