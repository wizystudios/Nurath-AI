
import React from "react";

interface NKTechLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const NKTechLogo: React.FC<NKTechLogoProps> = ({ size = "md", className = "" }) => {
  // Size mapping for the logo
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  // Text size mapping
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* SVG representation of the NK Technology logo */}
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Border */}
          <rect x="10" y="10" width="180" height="180" rx="15" stroke="black" strokeWidth="12" fill="white"/>
          
          {/* K letter */}
          <path d="M40 40V160M40 100H80M80 40L40 100M40 100L80 160" stroke="black" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Green circle */}
          <circle cx="140" cy="60" r="15" fill="#2E8B57"/>
          
          {/* Blue circle */}
          <circle cx="120" cy="140" r="15" fill="#1E88E5"/>
        </svg>
      </div>
      <span className={`font-bold tracking-wide ${textSizes[size]}`}>
        TECHNOLOGY
      </span>
    </div>
  );
};

export default NKTechLogo;
