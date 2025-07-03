import React from 'react';
import { motion } from 'framer-motion';

interface FlowParticleProps {
  color?: string;
  size?: number;
  duration?: number;
  path?: string;
  delay?: number;
  glow?: boolean;
}

export const FlowParticle: React.FC<FlowParticleProps> = ({
  color = '#60A5FA',
  size = 4,
  duration = 3,
  path,
  delay = 0,
  glow = true,
}) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: glow ? `
          0 0 ${size * 2}px ${color},
          0 0 ${size * 4}px ${color}40,
          inset 0 0 ${size / 2}px rgba(255, 255, 255, 0.5)
        ` : 'none',
        pointerEvents: 'none',
        zIndex: 100,
      }}
      initial={{ 
        opacity: 0,
        scale: 0,
        offsetDistance: '0%',
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        offsetDistance: '100%',
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        offsetPath: path ? `path('${path}')` : undefined,
      } as any}
    />
  );
};

interface ParticleStreamProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  particleCount?: number;
  color?: string;
  speed?: number;
  active?: boolean;
}

export const ParticleStream: React.FC<ParticleStreamProps> = ({
  startX,
  startY,
  endX,
  endY,
  particleCount = 5,
  color = '#60A5FA',
  speed = 3,
  active = true,
}) => {
  if (!active) return null;

  // Calculate the SVG path
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const controlPointOffset = Math.abs(deltaX) > Math.abs(deltaY) ? deltaY / 2 : deltaX / 2;
  
  const path = `M ${startX} ${startY} Q ${startX + deltaX / 2} ${startY + controlPointOffset}, ${endX} ${endY}`;
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99,
      }}
    >
      {/* Path visualization (optional) */}
      <path
        d={path}
        fill="none"
        stroke={`${color}20`}
        strokeWidth="2"
        strokeDasharray="5,5"
      />
      
      {/* Particles */}
      {Array.from({ length: particleCount }, (_, i) => (
        <motion.circle
          key={i}
          r="3"
          fill={color}
          filter="url(#particleGlow)"
          initial={{
            offsetDistance: '0%',
            opacity: 0,
            scale: 0,
          }}
          animate={{
            offsetDistance: '100%',
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: speed,
            delay: (i * speed) / particleCount,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            offsetPath: `path('${path}')`,
          } as any}
        />
      ))}
      
      {/* Glow filter */}
      <defs>
        <filter id="particleGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

interface ParticleBurstProps {
  x: number;
  y: number;
  count?: number;
  color?: string;
  trigger?: boolean;
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  x,
  y,
  count = 12,
  color = '#F472B6',
  trigger = false,
}) => {
  if (!trigger) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 101,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 50 + Math.random() * 50;
        
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 1,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
};