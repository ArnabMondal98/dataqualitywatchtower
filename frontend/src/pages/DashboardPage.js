import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, qualityChecksApi, pipelineApi, dataSourcesApi } from '../services/api';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, summaryRes, runsRes, sourcesRes] = await Promise.all([
        dashboardApi.getStats(),
        qualityChecksApi.getSummary(),
        pipelineApi.getRuns(),
        dataSourcesApi.getAll()
      ]);
      
      setStats(statsRes.data);
      setSummary(summaryRes.data);
      setRecentRuns(runsRes.data.slice(0, 5));
      setSources(sourcesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Data Sources',
      value: stats?.total_data_sources || 0,
      icon: <Database className="w-5 h-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Quality Score',
      value: `${stats?.overall_quality_score || 0}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: stats?.overall_quality_score >= 80 ? 'text-green-500' : stats?.overall_quality_score >= 50 ? 'text-yellow-500' : 'text-red-500',
      bgColor: stats?.overall_quality_score >= 80 ? 'bg-green-500/10' : stats?.overall_quality_score >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      label: 'Checks Passed',
      value: stats?.checks_passed || 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Checks Failed',
      value: stats?.checks_failed || 0,
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your data quality at a glance
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2" data-testid="refresh-btn">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="watchtower-grid" data-testid="metrics-grid">
        {metricCards.map((metric, index) => (
          <div 
            key={index} 
            className="metric-card animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
            data-testid={`metric-${metric.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center justify-between">
              <span className="metric-label">{metric.label}</span>
              <div className={`w-10 h-10 ${metric.bgColor} flex items-center justify-center ${metric.color}`}>
                {metric.icon}
              </div>
            </div>
            <div className={`metric-value ${metric.color}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Quality Summary */}
      {summary && (
        <div className="watchtower-card" data-testid="quality-summary">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quality Check Summary
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Pass Rate</span>
              <span className="font-mono text-primary">{summary.pass_rate}%</span>
            </div>
            <Progress value={summary.pass_rate} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-mono text-green-500">{summary.passed}</div>
                <div className="text-xs text-muted-foreground uppercase">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono text-yellow-500">{summary.warning}</div>
                <div className="text-xs text-muted-foreground uppercase">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono text-red-500">{summary.failed}</div>
                <div className="text-xs text-muted-foreground uppercase">Failed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pipeline Runs */}
        <div className="watchtower-card" data-testid="recent-runs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Pipeline Runs
            </h2>
            <Link to="/dashboard/pipeline" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pipeline runs yet</p>
              <Link to="/dashboard/sources">
                <Button size="sm" className="mt-4" data-testid="create-source-btn">
                  Create Data Source
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 bg-muted/30 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`status-dot ${run.gold_status === 'completed' ? 'status-passed' : run.gold_status === 'failed' ? 'status-failed' : 'status-warning'}`} />
                    <div>
                      <p className="text-sm font-mono">{run.data_source_id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-primary">{run.quality_score}%</p>
                    <p className="text-xs text-muted-foreground">{run.total_records} records</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="watchtower-card" data-testid="data-sources-summary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Sources
            </h2>
            <Link to="/dashboard/sources" className="text-sm text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No data sources configured</p>
              <Link to="/dashboard/sources">
                <Button size="sm" className="mt-4" data-testid="add-source-btn">
                  Add Data Source
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <Link 
                  key={source.id} 
                  to={`/dashboard/lineage/${source.id}`}
                  className="flex items-center justify-between p-3 bg-muted/30 border border-white/5 hover:border-primary/30 transition-colors block"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${
                      source.source_type === 'insurance' ? 'bg-blue-500/20 text-blue-400' :
                      source.source_type === 'banking' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{source.source_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{source.record_count}</p>
                    <p className="text-xs text-muted-foreground">records</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts Banner */}
      {stats?.recent_alerts > 0 && (
        <div className="watchtower-card bg-red-500/10 border-red-500/30" data-testid="alerts-banner">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">
                {stats.recent_alerts} Alert{stats.recent_alerts > 1 ? 's' : ''} in Last 24 Hours
              </h3>
              <p className="text-sm text-muted-foreground">
                Quality checks have failed. Review and take action.
              </p>
            </div>
            <Link to="/dashboard/quality">
              <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
