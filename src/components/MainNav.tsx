
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  BookOpen,
  Code,
  BarChart2,
  Users,
  User,
  Menu,
  X,
  LogOut,
  Globe,
  MessageCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserDropdown from "./UserDropdown";
import LanguageSelector, { Language } from "./LanguageSelector";

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  
  // Handle language change
  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem("preferredLanguage", language);
    
    // Update user profile if authenticated
    if (isAuthenticated) {
      updateUserLanguagePreference(language);
    }
    
    toast.success(`Language changed to ${language === "en" ? "English" : "Kiswahili"}`);
  };
  
  const updateUserLanguagePreference = async (language: Language) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ language_preference: language })
        .eq('id', session.user.id);
    }
  };
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (data.session?.user) {
        // Fetch profile data from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setUserName(profileData.full_name || data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || "User");
          setAvatarUrl(profileData.avatar_url);
          
          // Set language preference from profile
          if (profileData.language_preference) {
            setCurrentLanguage(profileData.language_preference as Language);
          }
        } else {
          setUserName(data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || "User");
        }
      }
      
      // Get language from localStorage if available
      const savedLanguage = localStorage.getItem("preferredLanguage") as Language | null;
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "sw")) {
        setCurrentLanguage(savedLanguage);
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User");
      } else {
        setUserName("");
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleChatClick = () => {
    navigate("/chat");
    setMobileMenuOpen(false);
    toast.success("Opening chat with Nurath.AI...");
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart2,
    },
    {
      title: "Tutorials",
      href: "/tutorials",
      icon: BookOpen,
    },
    {
      title: "Code Editor",
      href: "/code-editor",
      icon: Code,
    },
    {
      title: "Progress",
      href: "/progress",
      icon: BarChart2,
    },
    {
      title: "Community",
      href: "/community",
      icon: Users,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (loading) {
    return <div className="w-6 h-6 animate-pulse bg-white/20 rounded"></div>;
  }

  return (
    <>
      <div className="hidden md:flex items-center space-x-4">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={isActive(item.href) ? "default" : "ghost"}
            asChild
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20"
          >
            <Link to={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </Button>
        ))}
        
        <Button 
          variant="ghost" 
          className="bg-white/10 hover:bg-white/20 flex items-center gap-2"
          onClick={handleChatClick}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Chat with AI</span>
        </Button>
        
        {/* Language Selector */}
        <LanguageSelector 
          currentLanguage={currentLanguage} 
          onLanguageChange={(lang) => {
            setCurrentLanguage(lang);
            localStorage.setItem("preferredLanguage", lang);
            
            // Update user profile if authenticated
            if (isAuthenticated) {
              updateUserLanguagePreference(lang);
            }
            
            toast.success(`Language changed to ${lang === "en" ? "English" : "Kiswahili"}`);
          }} 
        />
        
        <ThemeToggle />
        {isAuthenticated && <UserDropdown userName={userName} avatarUrl={avatarUrl} />}
        {!isAuthenticated && (
          <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20">
            <Link to="/auth">Login</Link>
          </Button>
        )}
      </div>

      <div className="flex md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          className="text-white hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background pt-16">
          <nav className="grid gap-2 p-4">
            {isAuthenticated && (
              <div className="flex justify-center mb-8">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={avatarUrl || undefined} alt={userName} />
                  <AvatarFallback className="text-2xl">
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-lg"
              onClick={handleChatClick}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with Nurath.AI
            </Button>
            
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "default" : "ghost"}
                className="w-full justify-start text-lg"
                onClick={() => setMobileMenuOpen(false)}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.title}
                </Link>
              </Button>
            ))}
            
            <div className="flex justify-between mt-4 pt-4 border-t">
              <LanguageSelector 
                currentLanguage={currentLanguage} 
                onLanguageChange={(lang) => {
                  setCurrentLanguage(lang);
                  localStorage.setItem("preferredLanguage", lang);
                  
                  if (isAuthenticated) {
                    updateUserLanguagePreference(lang);
                  }
                  
                  toast.success(`Language changed to ${lang === "en" ? "English" : "Kiswahili"}`);
                  setMobileMenuOpen(false);
                }} 
              />
              
              <ThemeToggle />
              {isAuthenticated ? (
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// Helper function for updating language preference
const updateUserLanguagePreference = async (language: Language) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    await supabase
      .from('profiles')
      .update({ language_preference: language })
      .eq('id', session.user.id);
  }
};
