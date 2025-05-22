
import React from "react";

interface NKLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const NKLogo: React.FC<NKLogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]} aspect-square bg-gradient-to-br from-indigo-600 to-purple-800 rounded-lg flex items-center justify-center text-white font-bold overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-center h-full w-full">
          <span className={`${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"} font-extrabold`}>NK</span>
        </div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-tl-lg opacity-70"></div>
      </div>
      <div className="flex flex-col">
        <span className={`${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"} font-bold bg-gradient-to-r from-indigo-600 to-purple-800 bg-clip-text text-transparent leading-tight`}>
          NK Technology
        </span>
        <span className={`${size === "sm" ? "text-[0.6rem]" : size === "md" ? "text-xs" : "text-sm"} text-gray-500 dark:text-gray-400 leading-tight`}>
          Tanzania
        </span>
      </div>
    </div>
  );
};

export default NKLogo;
