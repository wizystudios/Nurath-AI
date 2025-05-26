
import React from "react";

interface KNTechLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const KNTechLogo: React.FC<KNTechLogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Border */}
          <rect x="10" y="10" width="180" height="180" rx="15" stroke="black" strokeWidth="8" fill="white"/>
          
          {/* K letter design */}
          <path d="M40 40V160M40 100H80M80 40L40 100M40 100L80 160" stroke="black" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Green dot */}
          <circle cx="140" cy="60" r="12" fill="#22c55e"/>
          
          {/* Blue dot */}
          <circle cx="140" cy="140" r="12" fill="#3b82f6"/>
        </svg>
      </div>
      <span className={`font-bold tracking-wide ${textSizes[size]} text-gray-900 dark:text-white`}>
        TECHNOLOGY
      </span>
    </div>
  );
};

export default KNTechLogo;
