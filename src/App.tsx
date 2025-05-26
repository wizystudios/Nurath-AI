import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';  // ✅ Correct import
import { Toaster } from "@/components/ui/sonner";

import { Layout } from '@/components/Layout'; // ✅ Use named import
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import Tutorials from '@/pages/Tutorials';
import Progress from '@/pages/Progress';
import Community from '@/pages/Community';
import NewDiscussion from '@/pages/NewDiscussion';
import CodeEditor from '@/pages/CodeEditor';
import Dashboard from '@/pages/Dashboard';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import TutorialDetails from "@/pages/TutorialDetails";

const queryClient = new QueryClient(); // ✅ Create query client

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}> {/* ✅ Wrap with provider */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="chat" element={<Chat />} />
              <Route path="tutorials" element={<Tutorials />} />
              <Route path="tutorials/:id" element={<TutorialDetails />} />
              <Route path="progress" element={<Progress />} />
              <Route path="community" element={<Community />} />
              <Route path="community/new-discussion" element={<NewDiscussion />} />
              <Route path="code-editor" element={<CodeEditor />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="auth" element={<Auth />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
