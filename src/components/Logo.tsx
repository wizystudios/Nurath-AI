
import React from "react";
import { Brain } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md", showText = true, className = "" }) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-indigo-600 to-purple-800 rounded-lg flex items-center justify-center text-white`}>
          <Brain className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-7 w-7"} text-white`} />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-indigo-600 to-purple-800 dark:from-indigo-400 dark:to-purple-600 bg-clip-text text-transparent animate-pulse`}>
            Nurath.AI
          </span>
          <span className="text-xs text-muted-foreground">
            Coding with Nurath.AI - Coding Assistance
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
