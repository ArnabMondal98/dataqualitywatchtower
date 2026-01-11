import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield,
  Database,
  Bell,
  Key,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isDemo, isAuthenticated } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="watchtower-card bg-accent/10 border-accent/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-accent">Demo Mode Active</h3>
              <p className="text-sm text-muted-foreground">
                You're using Watchtower in demo mode. Create an account to save your data and access all features.
              </p>
            </div>
            <Button className="watchtower-btn-primary" data-testid="create-account-btn">
              Create Account
            </Button>
          </div>
        </div>
      )}

      {/* Profile Section */}
      {isAuthenticated && (
        <div className="watchtower-card" data-testid="profile-section">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
              <p className="text-lg font-medium mt-1">{user?.name}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
              <p className="text-lg font-medium mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Member Since</label>
              <p className="text-lg font-medium mt-1">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Account Type</label>
              <p className="text-lg font-medium mt-1">Standard</p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Keys */}
        <div className="watchtower-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">API Configuration</h3>
              <p className="text-sm text-muted-foreground">External service integrations</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Slack Webhook</p>
                <p className="text-xs text-muted-foreground">For alert notifications</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/alerts">Configure</a>
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">SendGrid API</p>
                <p className="text-xs text-muted-foreground">For email alerts</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/alerts">Configure</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Data Settings */}
        <div className="watchtower-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">Data Settings</h3>
              <p className="text-sm text-muted-foreground">Storage and retention</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Data Retention</p>
                <p className="text-xs text-muted-foreground">Keep data for 90 days</p>
              </div>
              <span className="text-xs text-muted-foreground">Default</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Auto-run Checks</p>
                <p className="text-xs text-muted-foreground">Run on data upload</p>
              </div>
              <span className="text-xs text-green-400">Enabled</span>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="watchtower-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Alert preferences</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Failed Checks</p>
                <p className="text-xs text-muted-foreground">Alert on quality failures</p>
              </div>
              <span className="text-xs text-green-400">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Pipeline Complete</p>
                <p className="text-xs text-muted-foreground">Notify on completion</p>
              </div>
              <span className="text-xs text-muted-foreground">Disabled</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="watchtower-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">About Watchtower</h3>
              <p className="text-sm text-muted-foreground">System information</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Version</p>
              </div>
              <span className="text-xs font-mono text-primary">1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Architecture</p>
              </div>
              <span className="text-xs font-mono">Medallion (Bronze/Silver/Gold)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
              <div>
                <p className="text-sm font-medium">Documentation</p>
              </div>
              <a href="#" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isAuthenticated && (
        <div className="watchtower-card border-red-500/30" data-testid="danger-zone">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h2>
          <div className="flex items-center justify-between p-4 border border-red-500/20 bg-red-500/5">
            <div>
              <p className="font-medium">Delete All Data</p>
              <p className="text-sm text-muted-foreground">
                Permanently remove all data sources and quality check history.
              </p>
            </div>
            <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              Delete Data
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
