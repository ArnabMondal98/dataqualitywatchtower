import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataSourcesApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Database, 
  Plus, 
  Upload, 
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Landmark,
  GitBranch,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function DataSourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Form state
  const [newSource, setNewSource] = useState({
    name: '',
    source_type: 'insurance',
    description: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');

  const fetchSources = async () => {
    try {
      const response = await dataSourcesApi.getAll();
      setSources(response.data);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
      toast.error('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleCreateSource = async (e) => {
    e.preventDefault();
    if (!newSource.name) {
      toast.error('Please enter a name');
      return;
    }

    setCreating(true);
    try {
      await dataSourcesApi.create(newSource);
      toast.success('Data source created! Quality checks running...');
      setDialogOpen(false);
      setNewSource({ name: '', source_type: 'insurance', description: '' });
      fetchSources();
    } catch (error) {
      toast.error('Failed to create data source');
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadName) {
      toast.error('Please select a file and enter a name');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      await dataSourcesApi.upload(formData, uploadName);
      toast.success('File uploaded! Processing data...');
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadName('');
      fetchSources();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'insurance':
        return <Building2 className="w-5 h-5" />;
      case 'banking':
        return <Landmark className="w-5 h-5" />;
      default:
        return <FileSpreadsheet className="w-5 h-5" />;
    }
  };

  const getSourceColor = (type) => {
    switch (type) {
      case 'insurance':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'banking':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
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
    <div className="space-y-8 animate-fade-in" data-testid="data-sources-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground mt-1">
            Manage your data sources and run quality checks
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="upload-btn">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Upload Dataset</DialogTitle>
                <DialogDescription>
                  Upload a CSV or JSON file to create a custom data source.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-name">Dataset Name</Label>
                  <Input
                    id="upload-name"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="My Custom Dataset"
                    className="watchtower-input"
                    data-testid="upload-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-file">File (CSV or JSON)</Label>
                  <Input
                    id="upload-file"
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="watchtower-input"
                    data-testid="upload-file-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={uploading} 
                  className="w-full watchtower-btn-primary"
                  data-testid="upload-submit-btn"
                >
                  {uploading ? 'Uploading...' : 'Upload & Process'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="watchtower-btn-primary gap-2" data-testid="create-source-btn">
                <Plus className="w-4 h-4" />
                New Source
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Create Data Source</DialogTitle>
                <DialogDescription>
                  Generate sample data for Insurance or Banking domains.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    placeholder="Insurance Claims Q4"
                    className="watchtower-input"
                    data-testid="source-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Domain Type</Label>
                  <Select
                    value={newSource.source_type}
                    onValueChange={(value) => setNewSource({ ...newSource, source_type: value })}
                  >
                    <SelectTrigger className="watchtower-input" data-testid="source-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insurance">Insurance Claims</SelectItem>
                      <SelectItem value="banking">Banking Transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newSource.description}
                    onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                    placeholder="Monthly claims data from regional office"
                    className="watchtower-input"
                    data-testid="source-description-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={creating} 
                  className="w-full watchtower-btn-primary"
                  data-testid="create-submit-btn"
                >
                  {creating ? 'Creating...' : 'Create & Run Checks'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty State */}
      {sources.length === 0 ? (
        <div className="watchtower-card text-center py-16">
          <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Sources Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a sample data source with pre-built validators or upload your own dataset.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setDialogOpen(true)} className="watchtower-btn-primary gap-2">
              <Plus className="w-4 h-4" />
              Create Sample Source
            </Button>
            <Button onClick={() => setUploadDialogOpen(true)} variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Dataset
            </Button>
          </div>
        </div>
      ) : (
        /* Sources Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="sources-grid">
          {sources.map((source, index) => (
            <Link
              key={source.id}
              to={`/dashboard/lineage/${source.id}`}
              className="watchtower-card group animate-slide-up block"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`source-card-${source.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 flex items-center justify-center border ${getSourceColor(source.source_type)}`}>
                  {getSourceIcon(source.source_type)}
                </div>
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  {source.source_type}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {source.name}
              </h3>
              
              {source.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {source.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="w-4 h-4" />
                  <span>{source.record_count} records</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(source.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <GitBranch className="w-4 h-4" />
                <span>View Lineage</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
