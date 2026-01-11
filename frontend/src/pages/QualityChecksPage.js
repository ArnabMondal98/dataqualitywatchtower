import React, { useState, useEffect } from 'react';
import { qualityChecksApi, dataSourcesApi } from '../services/api';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function QualityChecksPage() {
  const [checks, setChecks] = useState([]);
  const [sources, setSources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState('all');
  const [expandedCheck, setExpandedCheck] = useState(null);

  const fetchData = async () => {
    try {
      const [checksRes, sourcesRes, summaryRes] = await Promise.all([
        qualityChecksApi.getAll(selectedSource !== 'all' ? selectedSource : null),
        dataSourcesApi.getAll(),
        qualityChecksApi.getSummary()
      ]);
      
      setChecks(checksRes.data);
      setSources(sourcesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch quality checks:', error);
      toast.error('Failed to load quality checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSource]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getCheckTypeLabel = (type) => {
    switch (type) {
      case 'schema':
        return 'Schema Validation';
      case 'constraint':
        return 'Constraint Enforcement';
      case 'business_rule':
        return 'Business Rule';
      default:
        return type;
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
    <div className="space-y-8 animate-fade-in" data-testid="quality-checks-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quality Checks</h1>
          <p className="text-muted-foreground mt-1">
            View validation results and constraint violations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[200px] watchtower-input" data-testid="source-filter">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2" data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-cards">
          <div className="watchtower-card">
            <div className="text-3xl font-mono font-bold text-foreground">{summary.total}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Total Checks</div>
          </div>
          <div className="watchtower-card">
            <div className="text-3xl font-mono font-bold text-green-500">{summary.passed}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Passed</div>
          </div>
          <div className="watchtower-card">
            <div className="text-3xl font-mono font-bold text-yellow-500">{summary.warning}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Warnings</div>
          </div>
          <div className="watchtower-card">
            <div className="text-3xl font-mono font-bold text-red-500">{summary.failed}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Failed</div>
          </div>
        </div>
      )}

      {/* Checks by Type */}
      {summary?.by_type && (
        <div className="watchtower-card" data-testid="checks-by-type">
          <h2 className="text-lg font-semibold mb-4">Checks by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(summary.by_type).map(([type, stats]) => (
              <div key={type} className="p-4 bg-muted/30 border border-white/5">
                <div className="text-sm font-mono text-primary uppercase mb-2">
                  {getCheckTypeLabel(type)}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-green-400">{stats.passed} passed</span>
                  <span className="text-yellow-400">{stats.warning} warn</span>
                  <span className="text-red-400">{stats.failed} failed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checks Table */}
      {checks.length === 0 ? (
        <div className="watchtower-card text-center py-16">
          <CheckCircle2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Quality Checks Yet</h2>
          <p className="text-muted-foreground">
            Create a data source to start running quality checks.
          </p>
        </div>
      ) : (
        <div className="watchtower-card p-0 overflow-hidden" data-testid="checks-table">
          <table className="watchtower-table">
            <thead>
              <tr className="bg-muted/50">
                <th>Status</th>
                <th>Rule Name</th>
                <th>Type</th>
                <th>Executed At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <React.Fragment key={check.id}>
                  <tr 
                    className="cursor-pointer"
                    onClick={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.status)}
                        <span className={`px-2 py-0.5 text-xs uppercase font-mono border ${getStatusClass(check.status)}`}>
                          {check.status}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">{check.rule_name}</td>
                    <td>
                      <span className="text-xs text-muted-foreground uppercase">
                        {getCheckTypeLabel(check.check_type)}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {new Date(check.executed_at).toLocaleString()}
                    </td>
                    <td>
                      {expandedCheck === check.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                  {expandedCheck === check.id && check.details && (
                    <tr>
                      <td colSpan={5} className="bg-muted/20 p-4">
                        <div className="font-mono text-sm">
                          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                            Check Details
                          </h4>
                          <pre className="overflow-x-auto p-4 bg-background border border-white/10 text-xs">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
