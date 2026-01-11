import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lineageApi, pipelineApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  GitBranch, 
  RefreshCw,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  Layers,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function LineagePage() {
  const { sourceId } = useParams();
  const [lineage, setLineage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);

  const fetchLineage = async () => {
    try {
      const response = await lineageApi.getLineage(sourceId);
      setLineage(response.data);
    } catch (error) {
      console.error('Failed to fetch lineage:', error);
      toast.error('Failed to load data lineage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage();
  }, [sourceId]);

  const handleRerun = async () => {
    setRerunning(true);
    try {
      await pipelineApi.rerun(sourceId);
      toast.success('Pipeline rerun started');
      setTimeout(fetchLineage, 2000);
    } catch (error) {
      toast.error('Failed to rerun pipeline');
    } finally {
      setRerunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <RefreshCw className="w-6 h-6 text-gray-500" />;
    }
  };

  const getLayerStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 bg-green-500/5';
      case 'failed':
        return 'border-red-500/50 bg-red-500/5';
      case 'pending':
        return 'border-yellow-500/50 bg-yellow-500/5';
      default:
        return 'border-white/10';
    }
  };

  const getCheckStatusClass = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!lineage) {
    return (
      <div className="watchtower-card text-center py-16">
        <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Data Source Not Found</h2>
        <Link to="/dashboard/sources">
          <Button className="mt-4">Go to Data Sources</Button>
        </Link>
      </div>
    );
  }

  const { source, layers, quality_checks, pipeline_runs } = lineage;
  const latestRun = pipeline_runs?.[0];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="lineage-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link 
            to="/dashboard/sources" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sources</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{source.name}</h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {source.source_type} • {source.record_count} records
          </p>
        </div>
        
        <Button 
          onClick={handleRerun} 
          disabled={rerunning}
          className="watchtower-btn-primary gap-2"
          data-testid="rerun-pipeline-btn"
        >
          {rerunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4" />
          )}
          Rerun Pipeline
        </Button>
      </div>

      {/* Medallion Architecture Visualization */}
      <div className="watchtower-card" data-testid="medallion-visualization">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Data Lineage
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
          {/* Bronze Layer */}
          <div className={`p-6 border ${getLayerStyle(layers.bronze.status)} relative`}>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(layers.bronze.status)}
              <div>
                <h3 className="font-mono text-lg text-amber-400">BRONZE</h3>
                <p className="text-xs text-muted-foreground uppercase">Raw Data</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{layers.bronze.description}</p>
            <div className="pt-4 border-t border-white/10">
              <div className="text-2xl font-mono">{layers.bronze.record_count}</div>
              <div className="text-xs text-muted-foreground">Total Records</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Silver Layer */}
          <div className={`p-6 border ${getLayerStyle(layers.silver.status)} relative`}>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(layers.silver.status)}
              <div>
                <h3 className="font-mono text-lg text-slate-300">SILVER</h3>
                <p className="text-xs text-muted-foreground uppercase">Validated</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{layers.silver.description}</p>
            <div className="pt-4 border-t border-white/10">
              <div className="text-2xl font-mono">{layers.silver.checks_applied}</div>
              <div className="text-xs text-muted-foreground">Quality Checks</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Gold Layer */}
          <div className={`p-6 border ${getLayerStyle(layers.gold.status)} relative`}>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(layers.gold.status)}
              <div>
                <h3 className="font-mono text-lg text-yellow-400">GOLD</h3>
                <p className="text-xs text-muted-foreground uppercase">Business Ready</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{layers.gold.description}</p>
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-mono">{layers.gold.quality_score}%</div>
                <span className={`text-xs ${layers.gold.quality_score >= 80 ? 'text-green-400' : layers.gold.quality_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  Quality Score
                </span>
              </div>
              <Progress value={layers.gold.quality_score} className="h-2 mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Quality Checks Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Checks */}
        <div className="watchtower-card" data-testid="quality-checks-summary">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Quality Checks Applied
          </h2>

          {quality_checks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No quality checks available
            </p>
          ) : (
            <div className="space-y-3">
              {quality_checks.map((check) => (
                <div 
                  key={check.id}
                  className="flex items-center justify-between p-3 bg-muted/30 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className={`status-dot ${check.status === 'passed' ? 'status-passed' : check.status === 'failed' ? 'status-failed' : 'status-warning'}`} />
                    <div>
                      <p className="text-sm font-medium">{check.rule_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{check.check_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs uppercase font-mono border ${getCheckStatusClass(check.status)}`}>
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline Run History */}
        <div className="watchtower-card" data-testid="pipeline-history">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Pipeline Run History
          </h2>

          {pipeline_runs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pipeline runs yet
            </p>
          ) : (
            <div className="space-y-3">
              {pipeline_runs.map((run, index) => (
                <div 
                  key={run.id}
                  className={`flex items-center justify-between p-3 border ${index === 0 ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-muted/30'}`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.gold_status)}
                    <div>
                      <p className="text-sm">
                        {new Date(run.started_at).toLocaleString()}
                        {index === 0 && <span className="ml-2 text-xs text-primary">(Latest)</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{run.total_records} records</span>
                        <span>•</span>
                        <span>{run.passed_records} passed</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-mono ${run.quality_score >= 80 ? 'text-green-500' : run.quality_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {run.quality_score}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Source Details */}
      <div className="watchtower-card" data-testid="source-details">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Source Details
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/30 border border-white/5">
            <div className="text-xs text-muted-foreground uppercase mb-1">Source ID</div>
            <div className="font-mono text-sm truncate">{source.id}</div>
          </div>
          <div className="p-4 bg-muted/30 border border-white/5">
            <div className="text-xs text-muted-foreground uppercase mb-1">Domain Type</div>
            <div className="font-mono text-sm capitalize">{source.source_type}</div>
          </div>
          <div className="p-4 bg-muted/30 border border-white/5">
            <div className="text-xs text-muted-foreground uppercase mb-1">Created</div>
            <div className="font-mono text-sm">{new Date(source.created_at).toLocaleDateString()}</div>
          </div>
          <div className="p-4 bg-muted/30 border border-white/5">
            <div className="text-xs text-muted-foreground uppercase mb-1">Records</div>
            <div className="font-mono text-sm">{source.record_count}</div>
          </div>
        </div>

        {source.description && (
          <div className="mt-4 p-4 bg-muted/30 border border-white/5">
            <div className="text-xs text-muted-foreground uppercase mb-1">Description</div>
            <div className="text-sm">{source.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
