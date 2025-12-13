import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface VoiceActivityIndicatorProps {
  isActive: boolean;
  type: 'input' | 'output';
  analyserNode?: AnalyserNode | null;
  className?: string;
}

const VoiceActivityIndicator: React.FC<VoiceActivityIndicatorProps> = ({
  isActive,
  type,
  analyserNode,
  className
}) => {
  const [level, setLevel] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      setLevel(0);
      return;
    }

    const updateLevel = () => {
      if (analyserNode) {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        setLevel(normalizedLevel);
      } else {
        // Simulated level for visual feedback
        const time = Date.now() / 100;
        const simulated = 0.3 + Math.sin(time) * 0.2 + Math.sin(time * 1.5) * 0.15;
        setLevel(simulated);
      }
      
      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyserNode]);

  const bars = 5;
  const baseColor = type === 'input' ? 'bg-primary' : 'bg-green-500';

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const isAboveThreshold = level >= threshold * 0.8;
        const height = 4 + (i + 1) * 4;
        
        return (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-75",
              isActive && isAboveThreshold ? baseColor : "bg-muted"
            )}
            style={{
              height: `${height}px`,
              opacity: isActive ? (isAboveThreshold ? 1 : 0.3) : 0.2,
              transform: isActive && isAboveThreshold ? 'scaleY(1.1)' : 'scaleY(1)'
            }}
          />
        );
      })}
    </div>
  );
};

export default VoiceActivityIndicator;
