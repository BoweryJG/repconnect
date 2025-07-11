import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { pipelineColors } from '../../theme/premiumTheme';

interface PipelineBorderProps {
  children: React.ReactNode;
  active?: boolean;
  color?: string;
  pulseSpeed?: number;
  particleCount?: number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PipelineBorder: React.FC<PipelineBorderProps> = ({
  children,
  active = true,
  color = pipelineColors.pipeBlue,
  pulseSpeed = 3,
  particleCount = 8,
  borderRadius = 16,
  className,
  style,
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; progress: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      progress: (i / particleCount) * 100,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius,
        ...style,
      }}
    >
      {/* Main border */}
      <svg
        style={{
          position: 'absolute',
          top: -2,
          left: -2,
          width: 'calc(100% + 4px)',
          height: 'calc(100% + 4px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <defs>
          {/* Gradient for the pipe */}
          <linearGradient id={`pipe-gradient-${color}`}>
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="50%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="pipe-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Border rect */}
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.3"
          filter="url(#pipe-glow)"
        />

        {/* Animated pulse */}
        {active && (
          <rect
            x="2"
            y="2"
            width="calc(100% - 4px)"
            height="calc(100% - 4px)"
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0"
            filter="url(#pipe-glow)"
          >
            <animate
              attributeName="opacity"
              values="0;0.6;0"
              dur={`${pulseSpeed}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="1;3;1"
              dur={`${pulseSpeed}s`}
              repeatCount="indefinite"
            />
          </rect>
        )}
      </svg>

      {/* Flowing particles */}
      {active &&
        particles.map((particle) => (
          <motion.div
            key={particle.id}
            style={
              {
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: pipelineColors.particleGlow,
                boxShadow: `0 0 8px ${pipelineColors.particleGlow}`,
                pointerEvents: 'none',
                zIndex: 2,
                offsetPath: `path('M ${borderRadius} 2 L ${`calc(100% - ${borderRadius}px)`} 2 Q ${`calc(100% - 2px)`} 2 ${`calc(100% - 2px)`} ${borderRadius} L ${`calc(100% - 2px)`} ${`calc(100% - ${borderRadius}px)`} Q ${`calc(100% - 2px)`} ${`calc(100% - 2px)`} ${`calc(100% - ${borderRadius}px)`} ${`calc(100% - 2px)`} L ${borderRadius} ${`calc(100% - 2px)`} Q 2 ${`calc(100% - 2px)`} 2 ${`calc(100% - ${borderRadius}px)`} L 2 ${borderRadius} Q 2 2 ${borderRadius} 2')`,
                offsetRotate: '0deg',
              } as any
            }
            animate={{
              offsetDistance: ['0%', '100%'],
            }}
            transition={{
              duration: pulseSpeed * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: (particle.id / particleCount) * pulseSpeed * 2,
            }}
          />
        ))}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 0 }}>{children}</div>
    </div>
  );
};

// Simplified version without particles
export const SimplePipelineBorder: React.FC<{
  children: React.ReactNode;
  color?: string;
  borderWidth?: number;
  borderRadius?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({
  children,
  color = pipelineColors.pipeBlue,
  borderWidth = 2,
  borderRadius = 16,
  glow = true,
  style,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        border: `${borderWidth}px solid ${color}`,
        borderRadius,
        boxShadow: glow
          ? `
          0 0 10px ${color}40,
          inset 0 0 10px ${color}20
        `
          : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
