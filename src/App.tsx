
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
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
        <ThemeProvider defaultTheme="system" storageKey="nurath-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Routes>
              {/* Nurath AI is now the main route */}
              <Route path="/" element={<Chat />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
