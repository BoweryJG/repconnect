import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material';

interface Pipe {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  flowSpeed: number;
  particles: Particle[];
  glowIntensity: number;
  type: 'main' | 'branch' | 'connector';
}

interface Particle {
  id: string;
  progress: number;
  size: number;
  opacity: number;
  color: string;
}

interface PipelineBackgroundProps {
  variant?: 'default' | 'dense' | 'minimal';
  interactive?: boolean;
}

export const PipelineBackground: React.FC<PipelineBackgroundProps> = ({ 
  variant = 'default',
  interactive = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const theme = useTheme();

  // Pipeline colors
  const pipeColors = {
    main: '#0EA5E9',
    hot: '#F97316',
    cold: '#0369A1',
    success: '#10B981',
    data: '#A855F7',
    glow: '#60A5FA',
  };

  // Generate initial pipe network
  useEffect(() => {
    const generatePipes = () => {
      const newPipes: Pipe[] = [];
      const gridSize = variant === 'dense' ? 150 : variant === 'minimal' ? 300 : 200;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Create main horizontal pipes
      for (let y = gridSize; y < height; y += gridSize) {
        newPipes.push({
          id: `h-${y}`,
          x1: 0,
          y1: y,
          x2: width,
          y2: y,
          color: pipeColors.main,
          flowSpeed: 0.5 + Math.random() * 0.5,
          particles: generateParticles(8),
          glowIntensity: 0.3,
          type: 'main',
        });
      }

      // Create main vertical pipes
      for (let x = gridSize; x < width; x += gridSize) {
        newPipes.push({
          id: `v-${x}`,
          x1: x,
          y1: 0,
          x2: x,
          y2: height,
          color: pipeColors.data,
          flowSpeed: 0.3 + Math.random() * 0.7,
          particles: generateParticles(6),
          glowIntensity: 0.3,
          type: 'main',
        });
      }

      // Add some diagonal connectors
      for (let i = 0; i < 5; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const angle = Math.random() * Math.PI * 2;
        const length = 100 + Math.random() * 200;
        
        newPipes.push({
          id: `d-${i}`,
          x1,
          y1,
          x2: x1 + Math.cos(angle) * length,
          y2: y1 + Math.sin(angle) * length,
          color: i % 2 === 0 ? pipeColors.hot : pipeColors.cold,
          flowSpeed: 0.8 + Math.random() * 0.4,
          particles: generateParticles(4),
          glowIntensity: 0.5,
          type: 'connector',
        });
      }

      setPipes(newPipes);
    };

    generatePipes();
    
    const handleResize = () => generatePipes();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [variant]);

  // Generate particles for a pipe
  const generateParticles = (count: number): Particle[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p-${Math.random()}`,
      progress: i / count,
      size: 2 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.4,
      color: pipeColors.glow,
    }));
  };

  // Mouse interaction
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw pipes
      pipes.forEach(pipe => {
        // Update particle positions
        pipe.particles.forEach(particle => {
          particle.progress += pipe.flowSpeed * 0.01;
          if (particle.progress > 1) particle.progress = 0;
        });

        // Calculate glow intensity based on mouse proximity
        if (interactive) {
          const pipeMidX = (pipe.x1 + pipe.x2) / 2;
          const pipeMidY = (pipe.y1 + pipe.y2) / 2;
          const distance = Math.sqrt(
            Math.pow(mousePos.x - pipeMidX, 2) + 
            Math.pow(mousePos.y - pipeMidY, 2)
          );
          pipe.glowIntensity = Math.max(0.3, Math.min(1, 150 / distance));
        }

        // Draw pipe
        drawPipe(ctx, pipe);
        
        // Draw particles
        pipe.particles.forEach(particle => {
          drawParticle(ctx, pipe, particle);
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pipes, mousePos, interactive]);

  // Draw a pipe
  const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    ctx.save();
    
    // Main pipe line
    ctx.beginPath();
    ctx.moveTo(pipe.x1, pipe.y1);
    ctx.lineTo(pipe.x2, pipe.y2);
    
    // Pipe style
    ctx.strokeStyle = pipe.color;
    ctx.lineWidth = pipe.type === 'main' ? 3 : 2;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    
    // Glow effect
    ctx.shadowBlur = 20 * pipe.glowIntensity;
    ctx.shadowColor = pipe.color;
    ctx.globalAlpha = 0.6 * pipe.glowIntensity;
    ctx.stroke();
    
    ctx.restore();
  };

  // Draw a particle
  const drawParticle = (ctx: CanvasRenderingContext2D, pipe: Pipe, particle: Particle) => {
    const x = pipe.x1 + (pipe.x2 - pipe.x1) * particle.progress;
    const y = pipe.y1 + (pipe.y2 - pipe.y1) * particle.progress;
    
    ctx.save();
    
    // Particle glow
    ctx.beginPath();
    ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity * 0.3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = particle.color;
    ctx.fill();
    
    // Particle core
    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = particle.opacity;
    ctx.fill();
    
    ctx.restore();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 20%, rgba(249, 115, 22, 0.05) 0%, transparent 50%),
          linear-gradient(180deg, rgba(10, 10, 11, 0.9) 0%, rgba(10, 10, 11, 0.95) 100%)
        `,
      }} />
      
      {/* Canvas for pipes */}
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.8,
        }}
      />
      
      {/* Animated glow nodes at intersections */}
      {variant !== 'minimal' && (
        <svg 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Junction nodes */}
          {pipes.filter(p => p.type === 'main').map((pipe, i) => {
            if (i % 3 === 0) {
              return (
                <motion.circle
                  key={pipe.id}
                  cx={pipe.x1}
                  cy={pipe.y1}
                  r="8"
                  fill={pipeColors.glow}
                  filter="url(#glow)"
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              );
            }
            return null;
          })}
        </svg>
      )}
    </div>
  );
};