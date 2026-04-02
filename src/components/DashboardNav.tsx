import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  MessageSquare,
  Shield,
  Building2,
  Stethoscope,
  Heart,
  Pill,
  FlaskConical,
  Home,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

const mainLinks: NavItem[] = [
  { label: "AI Chat", href: "/", icon: MessageSquare, description: "General AI assistant" },
  { label: "Telemed", href: "/?mode=telemed", icon: Heart, description: "Health services" },
];

const dashboardLinks: NavItem[] = [
  { label: "Super Admin", href: "/telemed/admin", icon: Shield, description: "Global management" },
  { label: "Organization", href: "/telemed/organization", icon: Building2, description: "Manage your facility" },
  { label: "Doctor", href: "/telemed/doctor", icon: Stethoscope, description: "Appointments & chats" },
  { label: "Patient", href: "/telemed/patient", icon: User, description: "My health records" },
  { label: "Pharmacy", href: "/telemed/pharmacy", icon: Pill, description: "Orders & medicines" },
  { label: "Lab", href: "/telemed/lab", icon: FlaskConical, description: "Tests & results" },
];

const DashboardNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const handleNavigate = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const isActive = (href: string) => location.pathname === href;

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

        <div className="flex flex-col gap-1 p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Main
          </p>
          {mainLinks.map((item) => (
            <button
              key={item.href}
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
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <Separator className="mx-3" />

        <div className="flex flex-col gap-1 p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Dashboards
          </p>
          {dashboardLinks.map((item) => (
            <button
              key={item.href}
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
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <Separator className="mx-3" />

        <div className="flex flex-col gap-1 p-3">
          <button
            onClick={() => handleNavigate("/profile")}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors text-left w-full"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Profile & Settings</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashboardNav;
