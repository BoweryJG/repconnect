import React from 'react';
import { NodeConfig } from '../../types/pipes';

interface PipeNodeProps {
  config: NodeConfig;
  isActive?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

export const PipeNode: React.FC<PipeNodeProps> = ({
  config,
  isActive = false,
  onHover,
  onClick,
}) => {
  const radius = config.radius || 8;
  const pulseRadius = radius * 2;
  
  const getNodeColor = () => {
    if (config.color) return config.color;
    switch (config.type) {
      case 'source': return '#00ff88';
      case 'sink': return '#ff0088';
      case 'junction': return '#88aaff';
      default: return '#ffffff';
    }
  };
  
  const nodeColor = getNodeColor();
  const filterId = `node-glow-${config.id}`;
  
  return (
    <g
      className="pipe-node"
      onMouseEnter={() => onHover?.(config.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(config.id)}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <radialGradient id={`node-gradient-${config.id}`}>
          <stop offset="0%" stopColor={nodeColor} stopOpacity={1} />
          <stop offset="70%" stopColor={nodeColor} stopOpacity={0.6} />
          <stop offset="100%" stopColor={nodeColor} stopOpacity={0.2} />
        </radialGradient>
        
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="3" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 .5 .5 .5 .5 .5 .5 .5 .5 .5 1" />
          </feComponentTransfer>
        </filter>
      </defs>
      
      {/* Pulse rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={`pulse-${config.id}-${i}`}
          cx={config.position.x}
          cy={config.position.y}
          r={radius}
          fill="none"
          stroke={nodeColor}
          strokeWidth={2}
          opacity={0}
          className="node-pulse"
        >
          <animate
            attributeName="r"
            values={`${radius};${pulseRadius}`}
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
          <animate
            attributeName="opacity"
            values="0.8;0"
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
          <animate
            attributeName="stroke-width"
            values="2;0.5"
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
        </circle>
      ))}
      
      {/* Glow effect */}
      <circle
        cx={config.position.x}
        cy={config.position.y}
        r={radius * 1.5}
        fill={nodeColor}
        opacity={0.4}
        filter={`url(#${filterId})`}
        className="node-glow"
        style={{
          transform: isActive ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      />
      
      {/* Core node */}
      <circle
        cx={config.position.x}
        cy={config.position.y}
        r={radius}
        fill={`url(#node-gradient-${config.id})`}
        stroke={nodeColor}
        strokeWidth={2}
        className="node-core"
        style={{
          filter: isActive ? 'brightness(1.3)' : 'brightness(1)',
          transition: 'filter 0.3s ease',
        }}
      />
      
      {/* Inner glow */}
      <circle
        cx={config.position.x}
        cy={config.position.y}
        r={radius * 0.5}
        fill={nodeColor}
        opacity={0.8}
        className="node-inner"
      >
        <animate
          attributeName="opacity"
          values="0.8;0.4;0.8"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
};