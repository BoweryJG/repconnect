import React, { useRef, useEffect } from 'react';

interface Phone3DVisualizerProps {
  isActive?: boolean;
  phoneNumber?: string;
}

export const Phone3DVisualizer: React.FC<Phone3DVisualizerProps> = ({ 
  isActive = false,
  phoneNumber = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    let rotation = 0;
    let animationId: number;

    // Polyfill for roundRect
    if (!ctx.roundRect) {
      (ctx as any).roundRect = function(x: number, y: number, width: number, height: number, radius: number) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
      };
    }

    const drawPhone = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save state
      ctx.save();
      
      // Move to center
      ctx.translate(150, 150);
      
      // Rotate
      ctx.rotate(rotation);
      
      // Draw phone body
      const gradient = ctx.createLinearGradient(-40, -60, 40, 60);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0.4)');
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      
      // Phone body
      ctx.beginPath();
      ctx.roundRect(-40, -60, 80, 120, 10);
      ctx.fill();
      ctx.stroke();
      
      // Screen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(-35, -50, 70, 85, 5);
      ctx.fill();
      
      // Display number
      if (phoneNumber) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayNumber = phoneNumber.slice(-10);
        ctx.fillText(displayNumber.slice(0, 5), 0, -15);
        ctx.fillText(displayNumber.slice(5), 0, 0);
      }
      
      // Home button
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(0, 45, 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // Glow effect
      if (isActive) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-42, -62, 84, 124, 10);
        ctx.stroke();
      }
      
      // Restore state
      ctx.restore();
      
      // Particles
      if (isActive) {
        for (let i = 0; i < 5; i++) {
          const angle = (rotation * 2) + (i * Math.PI * 2 / 5);
          const x = 150 + Math.cos(angle) * 100;
          const y = 150 + Math.sin(angle) * 100;
          
          ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(rotation * 3 + i) * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      rotation += 0.01;
      animationId = requestAnimationFrame(drawPhone);
    };

    drawPhone();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, phoneNumber]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: 300,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
};