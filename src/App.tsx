
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Tutorials from './pages/Tutorials';
import CodeEditor from './pages/CodeEditor';
import ProgressTracker from './pages/Progress';
import Community from './pages/Community';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { Layout } from './components/Layout';
import NewDiscussion from './pages/NewDiscussion';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="nurath-ui-theme">
        <Toaster />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="auth" element={<Auth />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tutorials" element={<Tutorials />} />
            <Route path="code-editor" element={<CodeEditor />} />
            <Route path="progress" element={<ProgressTracker />} />
            <Route path="community" element={<Community />} />
            <Route path="community/new-discussion" element={<NewDiscussion />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
