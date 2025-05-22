
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
      <div className={`relative ${sizeClasses[size]} aspect-square flex items-center justify-center text-white`}>
        {/* Logo based on the uploaded image */}
        <div className="relative w-full h-full">
          {/* Outer square border */}
          <div className="absolute inset-0 border-2 border-black dark:border-white rounded-sm"></div>
          
          {/* K letter */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-3/4 h-3/4">
              {/* K shape */}
              <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-black dark:bg-white"></div>
              <div className="absolute right-0 top-0 w-1/2 h-1/2 overflow-hidden">
                <div className="absolute top-0 left-0 w-[141%] h-[141%] bg-black dark:bg-white transform -rotate-45 origin-bottom-left"></div>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-1/2 overflow-hidden">
                <div className="absolute bottom-0 left-0 w-[141%] h-[141%] bg-black dark:bg-white transform rotate-45 origin-top-left"></div>
              </div>
              
              {/* Green dot */}
              <div className="absolute right-1/3 top-1/6 w-1/6 h-1/6 bg-green-600 rounded-full"></div>
              
              {/* Blue dot */}
              <div className="absolute right-1/3 bottom-1/6 w-1/6 h-1/6 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center">
        <span className={`${size === "sm" ? "text-xs font-bold" : size === "md" ? "text-sm font-bold" : "text-lg font-bold"} text-black dark:text-white`}>
          TECHNOLOGY
        </span>
        {size !== "sm" && (
          <span className={`${size === "md" ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400`}>
            Tanzania
          </span>
        )}
      </div>
    </div>
  );
};

export default NKLogo;
