import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/material';

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
`;

interface PremiumGradientBackgroundProps {
  variant?: 'aurora' | 'cosmic' | 'sunset' | 'ocean';
}

export const PremiumGradientBackground: React.FC<PremiumGradientBackgroundProps> = ({ variant = 'aurora' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gradients = {
    aurora: 'linear-gradient(125deg, #0A0A0B 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #e94560 100%)',
    cosmic: 'linear-gradient(125deg, #0A0A0B 0%, #2D1B69 25%, #0F0C29 50%, #24243e 75%, #302b63 100%)',
    sunset: 'linear-gradient(125deg, #0A0A0B 0%, #1a1c20 25%, #2d1b69 50%, #e94560 75%, #f27121 100%)',
    ocean: 'linear-gradient(125deg, #0A0A0B 0%, #0f3460 25%, #16213e 50%, #1a1a2e 75%, #e94560 100%)',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: gradients[variant],
          backgroundSize: '400% 400%',
          animation: `${gradientAnimation} 15s ease infinite`,
          zIndex: -3,
        }}
      />
      
      {/* Animated orbs */}
      <Box
        sx={{
          position: 'fixed',
          top: '20%',
          left: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: `${floatAnimation} 20s ease-in-out infinite`,
          zIndex: -2,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: '20%',
          right: '10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: `${floatAnimation} 25s ease-in-out infinite reverse`,
          zIndex: -2,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: `${floatAnimation} 30s ease-in-out infinite`,
          animationDelay: '5s',
          zIndex: -2,
        }}
      />
      
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          opacity: 0.6,
        }}
      />
      
      {/* Noise texture overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
          zIndex: -1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </>
  );
};