import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Menu, MessageSquare, Heart, User, Bell, Calendar,
  Stethoscope, Building2, Pill, FlaskConical, Shield,
  LayoutDashboard, Search, Settings, LogIn, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

const DashboardNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('user_roles').select('*').eq('user_id', user.id).maybeSingle();
        setUserRole(data);
      }
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase.from('user_roles').select('*').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setUserRole(data));
      } else {
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const isActive = (href: string) => {
    if (href.includes('?')) return location.pathname + location.search === href;
    return location.pathname === href;
  };

  // Core links everyone sees
  const coreLinks: NavItem[] = [
    { label: "AI Assistant", href: "/", icon: MessageSquare, description: "General AI chat" },
    { label: "Health Services", href: "/?mode=telemed", icon: Heart, description: "Find doctors & hospitals" },
  ];

  // Patient-facing links (for all logged in users or patients)
  const patientLinks: NavItem[] = [
    { label: "Find Doctors", href: "/?mode=telemed", icon: Search, description: "Search & book doctors" },
    { label: "My Bookings", href: "/telemed/patient?tab=appointments", icon: Calendar, description: "View appointments" },
    { label: "My Chats", href: "/telemed/patient?tab=chats", icon: MessageSquare, description: "Doctor conversations" },
    { label: "Notifications", href: "/telemed/patient?tab=notifications", icon: Bell, description: "Updates & alerts" },
  ];

  // Role-specific dashboard links
  const getRoleDashboard = (): NavItem[] => {
    if (!userRole) return [];
    const role = userRole.role;
    if (role === 'super_admin') return [
      { label: "Admin Dashboard", href: "/telemed/admin", icon: Shield, description: "Global management" },
    ];
    if (role === 'org_admin') return [
      { label: "Organization Dashboard", href: "/telemed/organization", icon: Building2, description: "Manage facility" },
    ];
    if (role === 'doctor') return [
      { label: "Doctor Dashboard", href: "/telemed/doctor", icon: Stethoscope, description: "Appointments & patients" },
    ];
    return [];
  };

  const roleDashboard = getRoleDashboard();

  const NavButton: React.FC<{ item: NavItem }> = ({ item }) => (
    <button
      onClick={() => handleNavigate(item.href)}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left w-full",
        isActive(item.href)
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <div>
        <div className="leading-tight">{item.label}</div>
        {item.description && (
          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.description}</div>
        )}
      </div>
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b border-border/50">
          <SheetTitle className="text-sm font-semibold">Nurath.AI</SheetTitle>
        </SheetHeader>

        {/* Core */}
        <div className="flex flex-col gap-1 p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">Main</p>
          {coreLinks.map(item => <NavButton key={item.href} item={item} />)}
        </div>

        <Separator className="mx-3" />

        {/* Patient links for logged-in users */}
        {user && (
          <>
            <div className="flex flex-col gap-1 p-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">My Health</p>
              {patientLinks.map(item => <NavButton key={item.label} item={item} />)}
            </div>
            <Separator className="mx-3" />
          </>
        )}

        {/* Role-specific dashboard */}
        {roleDashboard.length > 0 && (
          <>
            <div className="flex flex-col gap-1 p-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">Dashboard</p>
              {roleDashboard.map(item => <NavButton key={item.href} item={item} />)}
            </div>
            <Separator className="mx-3" />
          </>
        )}

        {/* Bottom: Profile & Auth */}
        <div className="flex flex-col gap-1 p-3">
          {user ? (
            <>
              <button
                onClick={() => handleNavigate("/profile")}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors text-left w-full"
              >
                <User className="h-4 w-4 shrink-0" />
                <div>
                  <div className="leading-tight">Profile</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{user.email?.split('@')[0]}</div>
                </div>
              </button>
              <button
                onClick={async () => { await supabase.auth.signOut(); setOpen(false); navigate('/'); }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left w-full"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavigate("/auth")}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors text-left w-full"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashboardNav;
