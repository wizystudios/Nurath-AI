import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Tutorials from './pages/Tutorials';
import CodeEditor from './pages/CodeEditor';
import ProgressTracker from './pages/Progress';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';
import { Layout } from './components/Layout';
import NewDiscussion from './pages/NewDiscussion';
import { supabase } from '@/integrations/supabase/client';
import TelemedChatbot from './pages/TelemedChatbot';
import TelemedAuth from './pages/TelemedAuth';
import TelemedBooking from './pages/TelemedBooking';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import OrgAdminDashboard from './pages/OrgAdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import LabDashboard from './pages/LabDashboard';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(!!data.session);
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  if (loading) return null;
  
  return authenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" storageKey="nurath-theme">
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <Routes>
              {/* Main AI chat interface */}
              <Route path="/" element={<Chat />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/editor" element={<CodeEditor />} />
              <Route path="/progress" element={<ProgressTracker />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/new" element={<NewDiscussion />} />
              <Route path="/telemed" element={<TelemedChatbot />} />
              <Route path="/telemed/auth" element={<TelemedAuth />} />
              <Route path="/telemed/book/:doctorId" element={<TelemedBooking />} />
              <Route path="/telemed/admin" element={<SuperAdminDashboard />} />
              <Route path="/telemed/organization" element={<OrgAdminDashboard />} />
              <Route path="/telemed/doctor" element={<DoctorDashboard />} />
              <Route path="/telemed/pharmacy" element={<PharmacyDashboard />} />
              <Route path="/telemed/lab" element={<LabDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
