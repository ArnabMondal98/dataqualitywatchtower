import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pipelineApi, dataSourcesApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  GitBranch, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  Layers,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function PipelinePage() {
  const [runs, setRuns] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(null);

  const fetchData = async () => {
    try {
      const [runsRes, sourcesRes] = await Promise.all([
        pipelineApi.getRuns(),
        dataSourcesApi.getAll()
      ]);
      
      setRuns(runsRes.data);
      setSources(sourcesRes.data);
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
      toast.error('Failed to load pipeline runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRerun = async (sourceId) => {
    setRerunning(sourceId);
    try {
      await pipelineApi.rerun(sourceId);
      toast.success('Pipeline rerun started');
      setTimeout(fetchData, 2000); // Refresh after 2 seconds
    } catch (error) {
      toast.error('Failed to rerun pipeline');
    } finally {
      setRerunning(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getSourceName = (sourceId) => {
    const source = sources.find(s => s.id === sourceId);
    return source?.name || sourceId.slice(0, 8);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="pipeline-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pipeline Runs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor Medallion Architecture pipeline executions
          </p>
        </div>
        
        <Button onClick={fetchData} variant="outline" className="gap-2" data-testid="refresh-btn">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Pipeline Architecture Overview */}
      <div className="watchtower-card" data-testid="pipeline-architecture">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Medallion Architecture
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bronze Layer */}
          <div className="p-6 border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-mono text-lg text-amber-400">BRONZE</h3>
                <p className="text-xs text-muted-foreground">Raw Data Layer</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Raw data ingestion with schema inference. Preserves original data formats.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
          </div>

          {/* Silver Layer */}
          <div className="p-6 border border-slate-400/30 bg-slate-400/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-400/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="font-mono text-lg text-slate-300">SILVER</h3>
                <p className="text-xs text-muted-foreground">Validated Layer</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Quality checks applied. Schema validation, constraints, and business rules.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
          </div>

          {/* Gold Layer */}
          <div className="p-6 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-mono text-lg text-yellow-400">GOLD</h3>
                <p className="text-xs text-muted-foreground">Business Ready</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Clean, validated data ready for analytics and reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Runs */}
      {runs.length === 0 ? (
        <div className="watchtower-card text-center py-16">
          <GitBranch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Pipeline Runs Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a data source to start running pipelines.
          </p>
          <Link to="/dashboard/sources">
            <Button className="watchtower-btn-primary" data-testid="go-to-sources-btn">
              Go to Data Sources
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4" data-testid="pipeline-runs-list">
          {runs.map((run, index) => (
            <div 
              key={run.id} 
              className="watchtower-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`pipeline-run-${run.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Source Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-primary" />
                    <Link 
                      to={`/dashboard/lineage/${run.data_source_id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {getSourceName(run.data_source_id)}
                    </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Started: {new Date(run.started_at).toLocaleString()}
                  </div>
                </div>

                {/* Layer Status */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    {getStatusIcon(run.bronze_status)}
                    <div className="text-xs text-muted-foreground mt-1">Bronze</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    {getStatusIcon(run.silver_status)}
                    <div className="text-xs text-muted-foreground mt-1">Silver</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    {getStatusIcon(run.gold_status)}
                    <div className="text-xs text-muted-foreground mt-1">Gold</div>
                  </div>
                </div>

                {/* Quality Score */}
                <div className="lg:w-48">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Quality</span>
                    <span className={`font-mono ${run.quality_score >= 80 ? 'text-green-500' : run.quality_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {run.quality_score}%
                    </span>
                  </div>
                  <Progress value={run.quality_score} className="h-2" />
                </div>

                {/* Records */}
                <div className="text-sm text-center">
                  <div className="font-mono text-foreground">{run.total_records}</div>
                  <div className="text-xs text-muted-foreground">records</div>
                </div>

                {/* Actions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRerun(run.data_source_id)}
                  disabled={rerunning === run.data_source_id}
                  className="gap-2"
                  data-testid={`rerun-btn-${run.id}`}
                >
                  {rerunning === run.data_source_id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )}
                  Rerun
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
