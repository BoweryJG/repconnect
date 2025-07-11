import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleBurst } from './FlowParticle';

interface PipelineNodeProps {
  type?: 'junction' | 'processor' | 'valve' | 'meter';
  size?: number;
  color?: string;
  active?: boolean;
  processing?: boolean;
  label?: string;
  value?: number;
  onClick?: () => void;
  position?: { x: number; y: number };
  connections?: number; // Number of pipes connected
}

export const PipelineNode: React.FC<PipelineNodeProps> = ({
  type = 'junction',
  size = 60,
  color = '#0EA5E9',
  active = true,
  processing = false,
  label,
  value,
  onClick,
  position = { x: 0, y: 0 },
  connections = 4,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleClick = () => {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 100);
    onClick?.();
  };

  const renderNode = () => {
    switch (type) {
      case 'junction':
        return <JunctionNode size={size} color={color} connections={connections} />;
      case 'processor':
        return <ProcessorNode size={size} color={color} processing={processing} />;
      case 'valve':
        return <ValveNode size={size} color={color} active={active} />;
      case 'meter':
        return <MeterNode size={size} color={color} value={value || 0} />;
      default:
        return <JunctionNode size={size} color={color} connections={connections} />;
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        zIndex: 60,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          opacity: active ? [0.5, 0.8, 0.5] : 0.2,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Node content */}
      {renderNode()}

      {/* Label */}
      {label && (
        <motion.div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 8,
            padding: '4px 12px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -10 }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {value !== undefined && `: ${value}%`}
        </motion.div>
      )}

      {/* Click burst effect */}
      <ParticleBurst x={size / 2} y={size / 2} color={color} trigger={showBurst} count={16} />
    </motion.div>
  );
};

// Junction Node - connects multiple pipes
const JunctionNode: React.FC<{ size: number; color: string; connections: number }> = ({
  size,
  color,
  connections,
}) => {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.8"
      />

      {/* Inner circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 3}
        fill={`${color}40`}
        stroke={color}
        strokeWidth="2"
      />

      {/* Connection points */}
      {Array.from({ length: connections }, (_, i) => {
        const angle = (i / connections) * Math.PI * 2 - Math.PI / 2;
        const x = size / 2 + Math.cos(angle) * (size / 2 - 8);
        const y = size / 2 + Math.sin(angle) * (size / 2 - 8);

        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill={color}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        );
      })}
    </svg>
  );
};

// Processor Node - shows processing animation
const ProcessorNode: React.FC<{ size: number; color: string; processing: boolean }> = ({
  size,
  color,
  processing,
}) => {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer square */}
      <rect
        x="4"
        y="4"
        width={size - 8}
        height={size - 8}
        rx="8"
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.8"
      />

      {/* Processing gears */}
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <motion.g
          animate={processing ? { rotate: 360 } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <path
            d={`M 0,-${size / 4} L 4,-${size / 4 - 4} L 0,-${size / 4 - 8} L -4,-${size / 4 - 4} Z`}
            fill={color}
            opacity="0.8"
          />
          {/* Repeat for other gear teeth */}
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M 0,-${size / 4} L 4,-${size / 4 - 4} L 0,-${size / 4 - 8} L -4,-${size / 4 - 4} Z`}
              fill={color}
              opacity="0.8"
              transform={`rotate(${i * 45})`}
            />
          ))}
        </motion.g>
      </g>

      {/* Center dot */}
      <circle cx={size / 2} cy={size / 2} r="3" fill="#fff" />
    </svg>
  );
};

// Valve Node - can open/close
const ValveNode: React.FC<{ size: number; color: string; active: boolean }> = ({
  size,
  color,
  active,
}) => {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Valve body */}
      <rect
        x={size / 4}
        y={size / 3}
        width={size / 2}
        height={size / 3}
        rx="4"
        fill={`${color}40`}
        stroke={color}
        strokeWidth="2"
      />

      {/* Valve handle */}
      <motion.rect
        x={size / 2 - 2}
        y={size / 6}
        width="4"
        height={size / 3}
        rx="2"
        fill={color}
        animate={{
          rotate: active ? 0 : 90,
        }}
        style={{
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Flow indicator */}
      <AnimatePresence>
        {active && (
          <motion.rect
            x={size / 4 + 4}
            y={size / 2 - 2}
            width={size / 2 - 8}
            height="4"
            rx="2"
            fill="#10B981"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            style={{ transformOrigin: 'left center' }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </svg>
  );
};

// Meter Node - shows value
const MeterNode: React.FC<{ size: number; color: string; value: number }> = ({
  size,
  color,
  value,
}) => {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`${color}20`}
        strokeWidth="6"
      />

      {/* Value arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          transform: `rotate(-90deg)`,
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      />

      {/* Center value */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size / 4}
        fontWeight="bold"
      >
        {value}
      </text>
    </svg>
  );
};
