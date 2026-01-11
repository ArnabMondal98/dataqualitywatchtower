import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { 
  Shield, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  GitBranch, 
  Bell,
  ArrowRight,
  Layers,
  Zap,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const features = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Medallion Architecture",
      description: "Bronze → Silver → Gold data layers with automated transformations and quality gates."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Quality Checks",
      description: "Schema validation, constraint enforcement, and custom business rules powered by Great Expectations patterns."
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Data Lineage",
      description: "Track data flow from source to report. Trace failures back to specific upstream issues."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Real-time Alerts",
      description: "Slack and email notifications for data quality issues before stakeholders see broken reports."
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Multi-Domain Support",
      description: "Pre-built validators for Insurance and Banking domains with custom dataset upload."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automated Pipelines",
      description: "Continuous monitoring with automated re-runs and quality score tracking."
    }
  ];

  const qualityTypes = [
    { type: "Schema Validation", tool: "Delta Lake Schema Enforcement", rationale: "Prevents data corruption from unknown source changes" },
    { type: "Constraint Enforcement", tool: "SQL Constraints (CHECK)", rationale: "Ensures numeric and categorical accuracy" },
    { type: "Custom Business Rules", tool: "Great Expectations Suites", rationale: "Validates complex cross-field dependencies" },
    { type: "Data Lineage", tool: "Unity Catalog Pattern", rationale: "Provides regulatory compliance transparency" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="hero-section relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background z-10" />
        
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="watchtower-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-mono text-xl font-bold tracking-tight">WATCHTOWER</span>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button 
                  onClick={handleDashboardClick}
                  className="watchtower-btn-primary"
                  data-testid="nav-dashboard-btn"
                >
                  GO TO DASHBOARD
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="font-mono" data-testid="nav-login-btn">
                      SIGN IN
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="watchtower-btn-primary" data-testid="nav-register-btn">
                      GET STARTED
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-20 watchtower-container text-center py-32">
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
              <AlertTriangle className="w-4 h-4" />
              DATA RELIABILITY ENGINEERING
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
              Automated Data Quality
              <br />
              <span className="text-gradient">Watchtower</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              End-to-end data reliability framework implementing the Medallion Architecture. 
              Catch broken pipelines, silent corruption, and schema drift before they impact your business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                onClick={handleDemoClick}
                className="watchtower-btn-primary text-lg px-8 py-6"
                data-testid="hero-demo-btn"
              >
                TRY DEMO
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Link to="/register">
                <Button 
                  variant="outline" 
                  className="border-white/20 hover:bg-white/5 font-mono text-lg px-8 py-6"
                  data-testid="hero-register-btn"
                >
                  <Lock className="mr-2 w-5 h-5" />
                  CREATE ACCOUNT
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 grid-pattern">
        <div className="watchtower-container">
          <div className="text-center mb-16">
            <span className="font-mono text-sm uppercase tracking-widest text-primary">CAPABILITIES</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Enterprise-Grade Data Quality
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="watchtower-card group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Types Table */}
      <section className="py-24 bg-card/50">
        <div className="watchtower-container">
          <div className="text-center mb-16">
            <span className="font-mono text-sm uppercase tracking-widest text-accent">METHODOLOGY</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Quality Check Framework
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="watchtower-table w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th>Quality Check Type</th>
                  <th>Implementation Tool</th>
                  <th>Business Rationale</th>
                </tr>
              </thead>
              <tbody>
                {qualityTypes.map((item, index) => (
                  <tr key={index}>
                    <td className="font-mono text-primary">{item.type}</td>
                    <td>{item.tool}</td>
                    <td className="text-muted-foreground">{item.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Domain Images Section */}
      <section className="py-24">
        <div className="watchtower-container">
          <div className="text-center mb-16">
            <span className="font-mono text-sm uppercase tracking-widest text-primary">SAMPLE DOMAINS</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Pre-Built Data Validators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="watchtower-card p-0 overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/17243495/pexels-photo-17243495.jpeg" 
                  alt="Insurance Domain"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Insurance Claims</h3>
                <p className="text-muted-foreground">
                  Validate policy limits, claim amounts, deductibles, and cross-field business rules.
                </p>
              </div>
            </div>

            <div className="watchtower-card p-0 overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/3592799/pexels-photo-3592799.jpeg" 
                  alt="Banking Domain"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Banking Transactions</h3>
                <p className="text-muted-foreground">
                  Monitor transaction integrity, balance consistency, and fraud detection flags.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-card/50 to-background">
        <div className="watchtower-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
            Ready to Monitor Your Data?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start with the demo or create an account to set up your own data quality pipelines.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={handleDemoClick}
              className="watchtower-btn-primary text-lg px-8"
              data-testid="cta-demo-btn"
            >
              LAUNCH DEMO
            </Button>
            <Link to="/register">
              <Button 
                variant="outline" 
                className="border-white/20 hover:bg-white/5 font-mono text-lg px-8"
                data-testid="cta-register-btn"
              >
                CREATE ACCOUNT
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="watchtower-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm">WATCHTOWER</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Data Quality Engineering Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
