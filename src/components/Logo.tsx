
import React from "react";
import { MessageCircle } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = "md", showText = true }) => {
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
    <div className="flex items-center gap-2">
      <div className="relative">
        <MessageCircle className={`${sizeClasses[size]} text-white`} />
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
