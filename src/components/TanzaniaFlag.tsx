
import React from "react";

interface TanzaniaFlagProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const TanzaniaFlag: React.FC<TanzaniaFlagProps> = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-3",
    md: "w-6 h-4",
    lg: "w-8 h-6"
  };
  
  return (
    <div className={`relative ${sizeClasses[size]} inline-block ${className}`}>
      {/* Black diagonal stripe */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-0 w-[140%] h-[140%] bg-black transform origin-top-left rotate-[30deg] translate-x-[-20%] translate-y-[-10%]"></div>
      </div>
      
      {/* Green section (top) */}
      <div className="absolute top-0 left-0 w-full h-[33.33%] bg-green-600 z-10"></div>
      
      {/* Yellow section (middle) */}
      <div className="absolute top-[33.33%] left-0 w-full h-[33.33%] bg-yellow-400 z-10"></div>
      
      {/* Blue section (bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-[33.33%] bg-blue-600 z-10"></div>
    </div>
  );
};

export default TanzaniaFlag;
