import React, { useState, useMemo, useCallback } from 'react';
import { AnimatedPipe } from './AnimatedPipe';
import { PipeNode } from './PipeNode';
import { PipeSystemConfig, NodeConfig, Point } from '../../types/pipes';
import '../../styles/pipes.css';

interface PipeSystemProps {
  config: PipeSystemConfig;
  width?: number;
  height?: number;
  nodes?: NodeConfig[];
  onPipeClick?: (pipeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
}

export const PipeSystem: React.FC<PipeSystemProps> = ({
  config,
  width = 800,
  height = 600,
  nodes = [],
  onPipeClick,
  onNodeClick,
}) => {
  const [hoveredPipe, setHoveredPipe] = useState<string | null>(null);
  const [selectedPipe, setSelectedPipe] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handlePipeClick = useCallback(
    (pipeId: string) => {
      setSelectedPipe(pipeId);
      onPipeClick?.(pipeId);
    },
    [onPipeClick]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeClick?.(nodeId);
    },
    [onNodeClick]
  );

  const backgroundPattern = useMemo(() => {
    const patternId = 'grid-pattern';
    return (
      <defs>
        <pattern id={patternId} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#ffffff" opacity="0.1" />
        </pattern>

        <radialGradient id="background-gradient">
          <stop offset="0%" stopColor="#0a0f1b" />
          <stop offset="100%" stopColor="#000511" />
        </radialGradient>

        <filter id="global-glow">
          <feGaussianBlur stdDeviation="4" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.5 0.8 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    );
  }, []);

  const performanceStyle = useMemo(() => {
    if (config.performanceMode === 'performance') {
      return {
        willChange: 'transform',
        transform: 'translateZ(0)',
      };
    }
    return {};
  }, [config.performanceMode]);

  return (
    <div
      className="pipe-system-container"
      style={{
        width: '100%',
        height: '100%',
        background:
          config.backgroundColor || 'radial-gradient(circle at center, #0a0f1b 0%, #000511 100%)',
        position: 'relative',
        overflow: 'hidden',
        ...performanceStyle,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="pipe-system-svg"
        onMouseMove={handleMouseMove}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {backgroundPattern}

        {/* Background */}
        <rect width={width} height={height} fill="url(#background-gradient)" />
        <rect width={width} height={height} fill="url(#grid-pattern)" opacity={0.3} />

        {/* Ambient glow following mouse */}
        {config.globalGlow && (
          <circle
            cx={mousePosition.x}
            cy={mousePosition.y}
            r="150"
            fill="radial-gradient(circle, rgba(136, 170, 255, 0.1) 0%, transparent 70%)"
            opacity={0.5}
            style={{
              pointerEvents: 'none',
              transition: 'cx 0.1s ease-out, cy 0.1s ease-out',
            }}
          />
        )}

        {/* Render nodes first (behind pipes) */}
        {nodes.map((node) => (
          <PipeNode
            key={node.id}
            config={node}
            isActive={hoveredNode === node.id}
            onHover={setHoveredNode}
            onClick={handleNodeClick}
          />
        ))}

        {/* Render pipes */}
        {config.pipes.map((pipe) => (
          <AnimatedPipe
            key={pipe.id}
            config={pipe}
            isHovered={hoveredPipe === pipe.id}
            isSelected={selectedPipe === pipe.id}
            onHover={config.enableInteractions ? setHoveredPipe : undefined}
            onClick={config.enableInteractions ? handlePipeClick : undefined}
          />
        ))}

        {/* Global effects layer */}
        {config.globalPulse && (
          <rect
            width={width}
            height={height}
            fill="none"
            stroke="rgba(136, 170, 255, 0.1)"
            strokeWidth="1"
            opacity={0}
            className="global-pulse"
          >
            <animate attributeName="opacity" values="0;0.3;0" dur="4s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>
    </div>
  );
};
