import { useState, useEffect } from 'react';
import { alertsApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Bell, 
  Plus, 
  RefreshCw,
  Trash2,
  TestTube,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AlertsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [newAlert, setNewAlert] = useState({
    alert_type: 'slack',
    config: {},
    enabled: true
  });

  const fetchConfigs = async () => {
    try {
      const response = await alertsApi.getConfigs();
      setConfigs(response.data);
    } catch (error) {
      console.error('Failed to fetch alert configs:', error);
      toast.error('Failed to load alert configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (newAlert.alert_type === 'slack' && !newAlert.config.webhook_url) {
      toast.error('Please enter a Slack webhook URL');
      return;
    }
    if (newAlert.alert_type === 'email' && !newAlert.config.email) {
      toast.error('Please enter an email address');
      return;
    }

    setCreating(true);
    try {
      await alertsApi.createConfig(newAlert);
      toast.success('Alert configuration created');
      setDialogOpen(false);
      setNewAlert({ alert_type: 'slack', config: {}, enabled: true });
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to create alert configuration');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (config) => {
    try {
      await alertsApi.updateConfig(config.id, {
        ...config,
        enabled: !config.enabled
      });
      toast.success(`Alert ${!config.enabled ? 'enabled' : 'disabled'}`);
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      await alertsApi.deleteConfig(configId);
      toast.success('Alert configuration deleted');
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const handleTest = async (configId) => {
    setTesting(configId);
    try {
      const response = await alertsApi.testAlert(configId);
      if (response.data.success) {
        toast.success('Test alert sent successfully!');
      } else {
        toast.error('Test alert failed. Check your configuration.');
      }
    } catch (error) {
      toast.error('Failed to send test alert');
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="alerts-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alert Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Set up Slack and email notifications for data quality issues
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="watchtower-btn-primary gap-2" data-testid="add-alert-btn">
              <Plus className="w-4 h-4" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Add Alert Configuration</DialogTitle>
              <DialogDescription>
                Configure Slack or email notifications for data quality alerts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select
                  value={newAlert.alert_type}
                  onValueChange={(value) => setNewAlert({ ...newAlert, alert_type: value, config: {} })}
                >
                  <SelectTrigger className="watchtower-input" data-testid="alert-type-select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Slack
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAlert.alert_type === 'slack' && (
                <div className="space-y-2">
                  <Label htmlFor="webhook">Slack Webhook URL</Label>
                  <Input
                    id="webhook"
                    value={newAlert.config.webhook_url || ''}
                    onChange={(e) => setNewAlert({ 
                      ...newAlert, 
                      config: { webhook_url: e.target.value } 
                    })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="watchtower-input"
                    data-testid="slack-webhook-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your webhook URL from Slack App settings
                  </p>
                </div>
              )}

              {newAlert.alert_type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAlert.config.email || ''}
                    onChange={(e) => setNewAlert({ 
                      ...newAlert, 
                      config: { email: e.target.value } 
                    })}
                    placeholder="alerts@company.com"
                    className="watchtower-input"
                    data-testid="email-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Requires SendGrid API key in backend configuration
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Enable Alert</Label>
                <Switch
                  checked={newAlert.enabled}
                  onCheckedChange={(checked) => setNewAlert({ ...newAlert, enabled: checked })}
                  data-testid="enable-switch"
                />
              </div>

              <Button 
                type="submit" 
                disabled={creating} 
                className="w-full watchtower-btn-primary"
                data-testid="create-alert-btn"
              >
                {creating ? 'Creating...' : 'Create Alert'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Banner */}
      <div className="watchtower-card bg-primary/5 border-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Proactive Alerting</h3>
            <p className="text-sm text-muted-foreground">
              Alerts are triggered automatically when data quality checks fail. Configure Slack 
              webhooks or email notifications to be notified before stakeholders see broken reports.
            </p>
          </div>
        </div>
      </div>

      {/* Configs List */}
      {configs.length === 0 ? (
        <div className="watchtower-card text-center py-16">
          <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Alerts Configured</h2>
          <p className="text-muted-foreground mb-6">
            Set up Slack or email alerts to get notified about data quality issues.
          </p>
        </div>
      ) : (
        <div className="space-y-4" data-testid="alerts-list">
          {configs.map((config, index) => (
            <div 
              key={config.id} 
              className="watchtower-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`alert-config-${config.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center ${
                    config.alert_type === 'slack' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {config.alert_type === 'slack' ? (
                      <MessageSquare className="w-6 h-6" />
                    ) : (
                      <Mail className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold capitalize">{config.alert_type}</h3>
                      {config.enabled ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <XCircle className="w-3 h-3" />
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {config.alert_type === 'slack' 
                        ? config.config.webhook_url?.slice(0, 40) + '...'
                        : config.config.email
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={() => handleToggle(config)}
                    data-testid={`toggle-${config.id}`}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(config.id)}
                    disabled={testing === config.id || !config.enabled}
                    className="gap-2"
                    data-testid={`test-btn-${config.id}`}
                  >
                    {testing === config.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Test
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(config.id)}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid={`delete-btn-${config.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="watchtower-card">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Slack Setup</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to your Slack workspace settings</li>
            <li>Create a new Slack App or use an existing one</li>
            <li>Enable Incoming Webhooks</li>
            <li>Create a new webhook for your channel</li>
            <li>Copy the webhook URL and paste above</li>
          </ol>
        </div>

        <div className="watchtower-card">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Email Setup</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Sign up for SendGrid (free tier available)</li>
            <li>Verify your sender email address</li>
            <li>Create an API key with send permissions</li>
            <li>Add SENDGRID_API_KEY to backend .env</li>
            <li>Enter recipient email address above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
