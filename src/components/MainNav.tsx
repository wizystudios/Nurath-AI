
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Book, Code, Users, User, BarChart3, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MainNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully! 👋");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };

  const navItems = [
    {
      title: "Chat with AI",
      href: "/chat",
      icon: MessageSquare,
      description: "💬 Chat with Nurath.AI"
    },
    {
      title: "Tutorials",
      href: "/tutorials",
      icon: Book,
      description: "📚 Learn step by step"
    },
    {
      title: "Code Editor",
      href: "/code-editor",
      icon: Code,
      description: "💻 Practice coding"
    },
    {
      title: "Community",
      href: "/community",
      icon: Users,
      description: "🤝 Connect with others"
    },
    {
      title: "Progress",
      href: "/progress",
      icon: BarChart3,
      description: "📈 Track your journey"
    },
  ];

  return (
    <nav className="flex items-center space-x-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={location.pathname === item.href ? "secondary" : "ghost"}
          size="sm"
          onClick={() => navigate(item.href)}
          className="text-white hover:bg-white/20 transition-all duration-300"
          title={item.description}
        >
          <item.icon className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">{item.title}</span>
        </Button>
      ))}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-800 border-purple-500/20">
          <DropdownMenuItem onClick={() => navigate("/profile")} className="text-gray-300 hover:text-white hover:bg-purple-500/20">
            <User className="h-4 w-4 mr-2" />
            👤 Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
            <LogOut className="h-4 w-4 mr-2" />
            🚪 Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
