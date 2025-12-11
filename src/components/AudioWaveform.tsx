import React, { useEffect, useRef } from "react";

interface AudioWaveformProps {
  isActive: boolean;
  type: 'speaking' | 'listening';
  analyserNode?: AnalyserNode | null;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive, type, analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw flat line when inactive
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        return;
      }

      const color = type === 'speaking' ? '#22c55e' : '#ef4444';
      const bars = 32;
      const barWidth = width / bars;
      const gap = 2;

      ctx.fillStyle = color;

      if (analyserNode) {
        // Real audio data visualization
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        for (let i = 0; i < bars; i++) {
          const dataIndex = Math.floor(i * (bufferLength / bars));
          const value = dataArray[dataIndex] / 255;
          const barHeight = Math.max(4, value * (height * 0.8));
          
          ctx.fillRect(
            i * barWidth + gap / 2,
            centerY - barHeight / 2,
            barWidth - gap,
            barHeight
          );
        }
      } else {
        // Simulated waveform when no analyser
        const time = Date.now() / 100;
        
        for (let i = 0; i < bars; i++) {
          const offset = i * 0.3;
          const wave1 = Math.sin(time + offset) * 0.3;
          const wave2 = Math.sin(time * 1.5 + offset) * 0.2;
          const wave3 = Math.sin(time * 0.7 + offset) * 0.2;
          const value = 0.3 + wave1 + wave2 + wave3;
          const barHeight = Math.max(4, value * (height * 0.8));
          
          ctx.fillRect(
            i * barWidth + gap / 2,
            centerY - barHeight / 2,
            barWidth - gap,
            barHeight
          );
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, type, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className="rounded-lg"
    />
  );
};

export default AudioWaveform;
