import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import DataSourcesPage from "./pages/DataSourcesPage";
import QualityChecksPage from "./pages/QualityChecksPage";
import PipelinePage from "./pages/PipelinePage";
import AlertsPage from "./pages/AlertsPage";
import LineagePage from "./pages/LineagePage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-mono">LOADING...</div>
      </div>
    );
  }
  
  return children;
};

// Demo mode route - allows access without auth
const DemoRoute = ({ children }) => {
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Dashboard routes - work for both auth and demo */}
      <Route path="/dashboard" element={<DemoRoute><DashboardLayout /></DemoRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="sources" element={<DataSourcesPage />} />
        <Route path="quality" element={<QualityChecksPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="lineage/:sourceId" element={<LineagePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
