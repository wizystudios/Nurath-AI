
import React from "react";

const TanzaniaFlag: React.FC = () => {
  return (
    <div className="relative w-6 h-4 inline-block mr-2">
      {/* Green section (top) */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-green-600"></div>
      {/* Yellow section (middle) */}
      <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-yellow-400"></div>
      {/* Blue section (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-blue-600"></div>
      {/* Black diagonal stripe */}
      <div className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden">
        <div className="absolute w-8 h-8 bg-black -rotate-45 -left-1 -top-2"></div>
      </div>
    </div>
  );
};

export default TanzaniaFlag;
