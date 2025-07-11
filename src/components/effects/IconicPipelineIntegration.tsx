import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material';
import { PipeSystem } from '../pipeline/PipeSystem';
import { PipeSystemConfig, Point } from '../../types/pipes';
import { createNeuralNetwork, createDataFlow, createPortalRings } from '../../utils/presets';

interface IconicPipelineIntegrationProps {
  variant?: 'neural' | 'flow' | 'portal' | 'minimal';
  children?: React.ReactNode;
  borderGlow?: boolean;
  backgroundPipes?: boolean;
  interactiveBorders?: boolean;
  borderWidth?: number;
  glowIntensity?: number;
}

export const IconicPipelineIntegration: React.FC<IconicPipelineIntegrationProps> = ({
  variant = 'neural',
  children,
  borderGlow = true,
  backgroundPipes = true,
  interactiveBorders = true,
  borderWidth = 120,
  glowIntensity = 0.8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const theme = useTheme();

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Track mouse position for interactive effects
  useEffect(() => {
    if (!interactiveBorders) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactiveBorders]);

  // Get preset configuration based on variant
  const getPresetConfig = (): PipeSystemConfig => {
    const { width, height } = dimensions;

    switch (variant) {
      case 'neural': {
        // Create a grid of nodes for neural network
        const nodes: Point[] = [];
        const rows = 4;
        const cols = 5;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            nodes.push({
              x: (j + 1) * (width / (cols + 1)),
              y: (i + 1) * (height / (rows + 1)),
            });
          }
        }
        // Create connections between nodes
        const connections: [number, number][] = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          connections.push([i, (i + 3) % nodes.length]);
          connections.push([i, (i + 5) % nodes.length]);
        }
        return { pipes: createNeuralNetwork(nodes, connections) };
      }
      case 'flow': {
        // Create flow points
        const flowPoints: Point[] = [
          { x: width * 0.1, y: height * 0.5 },
          { x: width * 0.3, y: height * 0.3 },
          { x: width * 0.5, y: height * 0.6 },
          { x: width * 0.7, y: height * 0.4 },
          { x: width * 0.9, y: height * 0.5 },
        ];
        return { pipes: createDataFlow(flowPoints, []) };
      }
      case 'portal': {
        // Create portal center and radius
        const center = { x: width / 2, y: height / 2 };
        const radius = Math.min(width, height) * 0.3;
        return { pipes: createPortalRings(center, radius, 3) };
      }
      case 'minimal':
        return {
          pipes: [
            {
              id: 'minimal-1',
              segments: [
                {
                  id: 'seg-1',
                  start: { x: 0, y: 50 },
                  end: { x: dimensions.width, y: 50 },
                  controlPoint1: { x: dimensions.width * 0.3, y: 20 },
                  controlPoint2: { x: dimensions.width * 0.7, y: 80 },
                  width: 2,
                },
              ],
              gradientStart: '#0EA5E9',
              gradientEnd: '#6366F1',
              animationDuration: 8,
              glowIntensity: 0.5,
            },
          ],
          enableInteractions: false,
          performanceMode: 'performance',
        };
      default: {
        // Default to neural network pattern
        const nodes: Point[] = [];
        const rows = 4;
        const cols = 5;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            nodes.push({
              x: (j + 1) * (width / (cols + 1)),
              y: (i + 1) * (height / (rows + 1)),
            });
          }
        }
        const connections: [number, number][] = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          connections.push([i, (i + 3) % nodes.length]);
        }
        return { pipes: createNeuralNetwork(nodes, connections) };
      }
    }
  };

  // Generate border pipe configuration
  const generateBorderPipes = (): PipeSystemConfig => {
    const config = getPresetConfig();
    const borderPipes: PipeSystemConfig = {
      ...config,
      pipes: [],
    };

    // Top border pipe
    borderPipes.pipes.push({
      id: 'border-top',
      segments: [
        {
          id: 'top-seg',
          start: { x: borderWidth, y: 10 },
          end: { x: dimensions.width - borderWidth, y: 10 },
          controlPoint1: { x: dimensions.width * 0.3, y: 5 },
          controlPoint2: { x: dimensions.width * 0.7, y: 15 },
          width: 3,
        },
      ],
      gradientStart: config.pipes[0]?.gradientStart || '#00ffff',
      gradientEnd: config.pipes[0]?.gradientEnd || '#ff00ff',
      animationDuration: 6,
      glowIntensity: borderGlow ? glowIntensity : 0,
      flowSpeed: 1.2,
    });

    // Bottom border pipe
    borderPipes.pipes.push({
      id: 'border-bottom',
      segments: [
        {
          id: 'bottom-seg',
          start: { x: dimensions.width - borderWidth, y: dimensions.height - 10 },
          end: { x: borderWidth, y: dimensions.height - 10 },
          controlPoint1: { x: dimensions.width * 0.7, y: dimensions.height - 5 },
          controlPoint2: { x: dimensions.width * 0.3, y: dimensions.height - 15 },
          width: 3,
        },
      ],
      gradientStart: config.pipes[0]?.gradientEnd || '#ff00ff',
      gradientEnd: config.pipes[0]?.gradientStart || '#00ffff',
      animationDuration: 6,
      glowIntensity: borderGlow ? glowIntensity : 0,
      flowSpeed: 1.2,
    });

    // Left border pipe
    borderPipes.pipes.push({
      id: 'border-left',
      segments: [
        {
          id: 'left-seg',
          start: { x: 10, y: borderWidth },
          end: { x: 10, y: dimensions.height - borderWidth },
          controlPoint1: { x: 5, y: dimensions.height * 0.3 },
          controlPoint2: { x: 15, y: dimensions.height * 0.7 },
          width: 3,
        },
      ],
      gradientStart: config.pipes[0]?.gradientStart || '#00ffff',
      gradientEnd: config.pipes[0]?.gradientEnd || '#ff00ff',
      animationDuration: 5,
      glowIntensity: borderGlow ? glowIntensity : 0,
      flowSpeed: 1.5,
    });

    // Right border pipe
    borderPipes.pipes.push({
      id: 'border-right',
      segments: [
        {
          id: 'right-seg',
          start: { x: dimensions.width - 10, y: dimensions.height - borderWidth },
          end: { x: dimensions.width - 10, y: borderWidth },
          controlPoint1: { x: dimensions.width - 5, y: dimensions.height * 0.7 },
          controlPoint2: { x: dimensions.width - 15, y: dimensions.height * 0.3 },
          width: 3,
        },
      ],
      gradientStart: config.pipes[0]?.gradientEnd || '#ff00ff',
      gradientEnd: config.pipes[0]?.gradientStart || '#00ffff',
      animationDuration: 5,
      glowIntensity: borderGlow ? glowIntensity : 0,
      flowSpeed: 1.5,
    });

    // Corner connector pipes
    const corners = [
      { from: 'border-top', to: 'border-right', x: dimensions.width - borderWidth, y: borderWidth },
      {
        from: 'border-right',
        to: 'border-bottom',
        x: dimensions.width - borderWidth,
        y: dimensions.height - borderWidth,
      },
      {
        from: 'border-bottom',
        to: 'border-left',
        x: borderWidth,
        y: dimensions.height - borderWidth,
      },
      { from: 'border-left', to: 'border-top', x: borderWidth, y: borderWidth },
    ];

    corners.forEach((corner, idx) => {
      borderPipes.pipes.push({
        id: `corner-${idx}`,
        segments: [
          {
            id: `corner-seg-${idx}`,
            start: { x: corner.x - 20, y: corner.y },
            end: { x: corner.x, y: corner.y - 20 },
            controlPoint1: { x: corner.x - 10, y: corner.y - 5 },
            controlPoint2: { x: corner.x - 5, y: corner.y - 10 },
            width: 2.5,
          },
        ],
        gradientStart: '#A855F7',
        gradientEnd: '#EC4899',
        animationDuration: 3,
        glowIntensity: borderGlow ? glowIntensity * 1.2 : 0,
      });
    });

    return borderPipes;
  };

  // Generate subtle background pipes
  const generateBackgroundPipes = (): PipeSystemConfig => {
    const config = getPresetConfig();
    const bgPipes: PipeSystemConfig = {
      ...config,
      pipes: [],
    };

    // Create a grid of subtle background pipes
    const gridSize = 200;
    const numHorizontal = Math.floor(dimensions.height / gridSize);
    const numVertical = Math.floor(dimensions.width / gridSize);

    // Horizontal background pipes
    for (let i = 1; i < numHorizontal; i++) {
      const y = i * gridSize;
      bgPipes.pipes.push({
        id: `bg-h-${i}`,
        segments: [
          {
            id: `bg-h-seg-${i}`,
            start: { x: 50, y },
            end: { x: dimensions.width - 50, y },
            controlPoint1: { x: dimensions.width * 0.25, y: y - 20 },
            controlPoint2: { x: dimensions.width * 0.75, y: y + 20 },
            width: 1,
          },
        ],
        gradientStart: 'rgba(14, 165, 233, 0.3)',
        gradientEnd: 'rgba(168, 85, 247, 0.3)',
        animationDuration: 12 + Math.random() * 6,
        glowIntensity: 0.2,
        opacity: 0.3,
      });
    }

    // Vertical background pipes
    for (let i = 1; i < numVertical; i++) {
      const x = i * gridSize;
      bgPipes.pipes.push({
        id: `bg-v-${i}`,
        segments: [
          {
            id: `bg-v-seg-${i}`,
            start: { x, y: 50 },
            end: { x, y: dimensions.height - 50 },
            controlPoint1: { x: x - 20, y: dimensions.height * 0.25 },
            controlPoint2: { x: x + 20, y: dimensions.height * 0.75 },
            width: 1,
          },
        ],
        gradientStart: 'rgba(236, 72, 153, 0.3)',
        gradientEnd: 'rgba(99, 102, 241, 0.3)',
        animationDuration: 10 + Math.random() * 8,
        glowIntensity: 0.2,
        opacity: 0.3,
      });
    }

    return bgPipes;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '16px',
        background: 'rgba(10, 10, 11, 0.95)',
      }}
    >
      {/* Background pipes layer */}
      {backgroundPipes && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        >
          <PipeSystem
            config={generateBackgroundPipes()}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      )}

      {/* Border pipes layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: interactiveBorders ? 'auto' : 'none',
          zIndex: 10,
        }}
      >
        <PipeSystem
          config={generateBorderPipes()}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 5,
          padding: `${borderWidth}px`,
        }}
      >
        {children}
      </div>

      {/* Corner nodes with pulse effect */}
      {borderGlow && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        >
          <defs>
            <filter id="corner-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Corner junction nodes */}
          {[
            { x: borderWidth, y: borderWidth },
            { x: dimensions.width - borderWidth, y: borderWidth },
            { x: dimensions.width - borderWidth, y: dimensions.height - borderWidth },
            { x: borderWidth, y: dimensions.height - borderWidth },
          ].map((pos, idx) => (
            <motion.circle
              key={`corner-${idx}`}
              cx={pos.x}
              cy={pos.y}
              r="12"
              fill="#A855F7"
              filter="url(#corner-glow)"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: idx * 0.5,
              }}
            />
          ))}
        </svg>
      )}
    </div>
  );
};
