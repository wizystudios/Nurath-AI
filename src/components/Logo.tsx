
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
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent`}>
          Nurath.AI
        </span>
      )}
    </div>
  );
};

export default Logo;
