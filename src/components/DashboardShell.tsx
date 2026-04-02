import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, LogOut } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onLogout: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  subtitle,
  icon,
  onLogout,
  headerActions,
  children,
  maxWidth = "max-w-4xl",
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <DashboardNav />
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-sm font-semibold leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className={`${maxWidth} mx-auto px-4 py-4`}>{children}</div>
      </div>
    </div>
  );
};

export default DashboardShell;
