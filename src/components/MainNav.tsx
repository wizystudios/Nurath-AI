
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserDropdown from "./UserDropdown";

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Fetch user data on component mount
  useState(() => {
    const fetchUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session?.user) {
        // Fetch profile data from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
          
        if (profileData) {
          setUserName(profileData.full_name || sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email?.split('@')[0] || "User");
          setAvatarUrl(profileData.avatar_url);
        } else {
          setUserName(sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email?.split('@')[0] || "User");
        }
      }
    };
    
    fetchUserData();
  });
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
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
      href: "/editor",
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

  return (
    <>
      <div className="hidden md:flex items-center space-x-4">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={isActive(item.href) ? "default" : "ghost"}
            asChild
            className="flex items-center gap-2"
          >
            <Link to={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </Button>
        ))}
        <ThemeToggle />
        <UserDropdown userName={userName} avatarUrl={avatarUrl} />
      </div>

      <div className="flex md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background pt-16">
          <nav className="grid gap-2 p-4">
            <div className="flex justify-center mb-8">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={avatarUrl || undefined} alt={userName} />
                <AvatarFallback className="text-2xl">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
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
              <ThemeToggle />
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
