import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleStream } from './FlowParticle';

interface Connection {
  startElement: string; // CSS selector or element ID
  endElement: string;
  color?: string;
  flowSpeed?: number;
  particleCount?: number;
  type?: 'straight' | 'curved' | 'elbow';
  active?: boolean;
}

interface PipelineConnectorProps {
  connections: Connection[];
  showParticles?: boolean;
  pulseOnHover?: boolean;
}

export const PipelineConnector: React.FC<PipelineConnectorProps> = ({
  connections,
  showParticles = true,
  pulseOnHover = true,
}) => {
  const [positions, setPositions] = useState<Record<string, { start: DOMRect; end: DOMRect }>>({});
  const svgRef = useRef<SVGSVGElement>(null);

  // Update positions when elements move or resize
  useEffect(() => {
    const updatePositions = () => {
      const newPositions: Record<string, { start: DOMRect; end: DOMRect }> = {};
      
      connections.forEach((conn) => {
        const startEl = document.querySelector(conn.startElement);
        const endEl = document.querySelector(conn.endElement);
        
        if (startEl && endEl) {
          newPositions[`${conn.startElement}-${conn.endElement}`] = {
            start: startEl.getBoundingClientRect(),
            end: endEl.getBoundingClientRect(),
          };
        }
      });
      
      setPositions(newPositions);
    };

    updatePositions();
    
    // Update on scroll and resize
    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    // Use ResizeObserver for element size changes
    const observer = new ResizeObserver(updatePositions);
    connections.forEach(conn => {
      const startEl = document.querySelector(conn.startElement);
      const endEl = document.querySelector(conn.endElement);
      if (startEl) observer.observe(startEl);
      if (endEl) observer.observe(endEl);
    });
    
    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
      observer.disconnect();
    };
  }, [connections]);

  const generatePath = (
    start: DOMRect, 
    end: DOMRect, 
    type: 'straight' | 'curved' | 'elbow' = 'curved'
  ): string => {
    const startX = start.left + start.width / 2;
    const startY = start.top + start.height / 2;
    const endX = end.left + end.width / 2;
    const endY = end.top + end.height / 2;
    
    switch (type) {
      case 'straight':
        return `M ${startX} ${startY} L ${endX} ${endY}`;
        
      case 'curved':
        const controlX = (startX + endX) / 2;
        const controlY = (startY + endY) / 2 - Math.abs(endX - startX) * 0.2;
        return `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`;
        
      case 'elbow':
        const midX = (startX + endX) / 2;
        return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
        
      default:
        return `M ${startX} ${startY} L ${endX} ${endY}`;
    }
  };

  return (
    <>
      {/* SVG for pipe paths */}
      <svg
        ref={svgRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <defs>
          {/* Gradient definitions for pipes */}
          <linearGradient id="pipeGradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="pipeGradient-purple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="pipeGradient-orange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#F97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="pipeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Animated gradient for active pipes */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0">
              <animate
                attributeName="offset"
                from="0%"
                to="100%"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="10%" stopColor="#60A5FA" stopOpacity="1">
              <animate
                attributeName="offset"
                from="10%"
                to="110%"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="20%" stopColor="#60A5FA" stopOpacity="0">
              <animate
                attributeName="offset"
                from="20%"
                to="120%"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        
        <AnimatePresence>
          {connections.map((conn) => {
            const key = `${conn.startElement}-${conn.endElement}`;
            const pos = positions[key];
            if (!pos) return null;
            
            const path = generatePath(pos.start, pos.end, conn.type);
            const color = conn.color || '#0EA5E9';
            const gradientId = color.includes('#F97316') ? 'orange' : 
                              color.includes('#A855F7') ? 'purple' : 'blue';
            
            return (
              <motion.g
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: conn.active !== false ? 1 : 0.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Pipe background */}
                <motion.path
                  d={path}
                  fill="none"
                  stroke={`url(#pipeGradient-${gradientId})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#pipeGlow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                
                {/* Pipe core */}
                <motion.path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
                
                {/* Flow animation overlay */}
                {conn.active !== false && (
                  <motion.path
                    d={path}
                    fill="none"
                    stroke="url(#flowGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.6"
                    style={{ mixBlendMode: 'screen' }}
                  />
                )}
                
                {/* Pulse animation on hover */}
                {pulseOnHover && (
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    opacity="0"
                    whileHover={{ opacity: 0.3 }}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  />
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
      
      {/* Particle streams */}
      {showParticles && connections.map((conn) => {
        const key = `${conn.startElement}-${conn.endElement}`;
        const pos = positions[key];
        if (!pos || conn.active === false) return null;
        
        return (
          <ParticleStream
            key={`particles-${key}`}
            startX={pos.start.left + pos.start.width / 2}
            startY={pos.start.top + pos.start.height / 2}
            endX={pos.end.left + pos.end.width / 2}
            endY={pos.end.top + pos.end.height / 2}
            particleCount={conn.particleCount || 5}
            color={conn.color || '#60A5FA'}
            speed={conn.flowSpeed || 3}
            active={conn.active === undefined ? true : conn.active}
          />
        );
      })}
    </>
  );
};