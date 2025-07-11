import React, { useMemo, useState, useRef, useEffect } from 'react';
import { PipeConfig } from '../../types/pipes';
import { segmentToPath } from '../../utils/pathGenerator';

interface AnimatedPipeProps {
  config: PipeConfig;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

export const AnimatedPipe: React.FC<AnimatedPipeProps> = ({
  config,
  isHovered = false,
  isSelected = false,
  onHover,
  onClick,
}) => {
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  const path = useMemo(() => {
    return config.segments.map((segment) => segmentToPath(segment)).join(' ');
  }, [config.segments]);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [path]);

  const gradientId = `gradient-${config.id}`;
  const filterId = `glow-${config.id}`;

  const strokeWidth = useMemo(() => {
    const baseWidth = config.segments[0]?.width || 3;
    if (isSelected) return baseWidth * 1.3;
    if (isHovered) return baseWidth * 1.15;
    return baseWidth;
  }, [config.segments, isHovered, isSelected]);

  const animationDuration = config.animationDuration || 3;
  const flowSpeed = config.flowSpeed || 1;

  return (
    <g
      className="animated-pipe"
      onMouseEnter={() => onHover?.(config.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(config.id)}
      style={{ cursor: config.interactive ? 'pointer' : 'default' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            stopColor={config.gradientStart || config.color || '#00ffff'}
            stopOpacity={0.8}
          >
            <animate
              attributeName="stop-opacity"
              values="0.8;1;0.8"
              dur={`${animationDuration * 2}s`}
              repeatCount="indefinite"
            />
          </stop>
          <stop
            offset="100%"
            stopColor={config.gradientEnd || config.color || '#ff00ff'}
            stopOpacity={0.8}
          >
            <animate
              attributeName="stop-opacity"
              values="0.8;0.6;0.8"
              dur={`${animationDuration * 2}s`}
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <filter id={filterId}>
          <feGaussianBlur stdDeviation={config.glowIntensity || 2} />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 1" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* Glow layer */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth * 2}
        opacity={isHovered ? 0.6 : 0.3}
        filter={`url(#${filterId})`}
        className="pipe-glow"
      />

      {/* Main pipe */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={config.opacity || 0.9}
        className="pipe-main"
        style={{
          strokeDasharray: pathLength ? `${pathLength * 0.15} ${pathLength * 0.05}` : undefined,
          strokeDashoffset: 0,
          animation: pathLength
            ? `flow ${animationDuration / flowSpeed}s linear infinite`
            : undefined,
          transition: 'stroke-width 0.3s ease, opacity 0.3s ease',
        }}
      />

      {/* Flow particles */}
      {config.segments.map((_, index) => (
        <circle
          key={`particle-${config.id}-${index}`}
          r={strokeWidth / 2}
          fill={config.color || '#ffffff'}
          opacity={0}
          className="flow-particle"
        >
          <animateMotion
            dur={`${animationDuration / flowSpeed}s`}
            repeatCount="indefinite"
            begin={`${index * 0.2}s`}
          >
            <mpath href={`#path-${config.id}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur={`${animationDuration / flowSpeed}s`}
            repeatCount="indefinite"
            begin={`${index * 0.2}s`}
          />
          <animate
            attributeName="r"
            values={`${strokeWidth / 3};${strokeWidth / 1.5};${strokeWidth / 3}`}
            dur={`${animationDuration / flowSpeed}s`}
            repeatCount="indefinite"
            begin={`${index * 0.2}s`}
          />
        </circle>
      ))}

      {/* Hidden path for particle animation */}
      <path id={`path-${config.id}`} d={path} fill="none" stroke="none" />
    </g>
  );
};
