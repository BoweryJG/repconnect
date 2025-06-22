import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { adaptiveRenderer } from '../../lib/performance/AdaptiveRenderer';
import { renderQueue } from '../../lib/performance/RenderQueue';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export const ParticleField: React.FC<{ color?: string }> = ({ color = '#6366F1' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [particleCount, setParticleCount] = useState(10000);

  useEffect(() => {
    const unsubscribe = adaptiveRenderer.subscribe((settings) => {
      setParticleCount(settings.particleCount);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true,
      willReadFrequently: false 
    });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio, 2); // Cap at 2x for performance
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: color
      }));
    };

    initParticles();

    // GPU-optimized render function
    const render = () => {
      renderQueue.addTask({
        id: 'particle-render',
        priority: 'medium',
        work: () => {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          
          // Batch similar particles for fewer state changes
          ctx.globalCompositeOperation = 'screen';
          
          particlesRef.current.forEach((particle) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;
            
            // Draw particle
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          });
          
          // Draw connections between nearby particles
          ctx.strokeStyle = color + '20';
          ctx.lineWidth = 0.5;
          
          for (let i = 0; i < particlesRef.current.length; i++) {
            for (let j = i + 1; j < particlesRef.current.length; j++) {
              const dx = particlesRef.current[i].x - particlesRef.current[j].x;
              const dy = particlesRef.current[i].y - particlesRef.current[j].y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 100) {
                ctx.globalAlpha = (1 - distance / 100) * 0.2;
                ctx.beginPath();
                ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
                ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
                ctx.stroke();
              }
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, particleCount]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          transform: 'translateZ(0)', // Force GPU layer
        }}
      />
    </Box>
  );
};