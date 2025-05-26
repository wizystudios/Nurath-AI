import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const isHomePage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";
  const isChatPage = location.pathname === "/chat";

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session && !["", "/", "/auth"].includes(location.pathname)) {
        navigate("/auth");
      }
      setChecking(false);
    };

    checkAuth();
  }, [navigate, location]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-pulse">
            <Logo size="lg" />
          </div>
          <p className="mt-4 text-lg">Loading Nurath.AI...</p>
        </div>
      </div>
    );
  }

  // For home, auth, and chat pages, render children without layout
  if (isHomePage || isAuthPage || isChatPage) {
    return <>{children}</>;
  }

  // For all other pages, render with layout
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-purple-600 to-indigo-800 text-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Logo />
          </div>
          <MainNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
