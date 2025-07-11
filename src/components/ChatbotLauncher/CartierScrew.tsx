import React from 'react';

interface CartierScrewProps {
  rotation?: number;
  size?: number;
  className?: string;
}

export const CartierScrew: React.FC<CartierScrewProps> = ({ 
  rotation = 45, 
  size = 16,
  className = '' 
}) => {
  return (
    <div 
      className={`cartier-screw ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${rotation}deg)`,
        position: 'relative',
        borderRadius: '50%',
        background: `
          radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.8) 0%, 
            rgba(255, 255, 255, 0.4) 10%, 
            rgba(192, 192, 192, 0.9) 30%, 
            rgba(140, 140, 140, 0.95) 60%, 
            rgba(110, 110, 110, 1) 100%
          )
        `,
        boxShadow: `
          inset 0 0 ${size * 0.125}px rgba(0, 0, 0, 0.4),
          inset 0 0 ${size * 0.0625}px rgba(255, 255, 255, 0.6),
          0 ${size * 0.0625}px ${size * 0.125}px rgba(0, 0, 0, 0.3)
        `,
        overflow: 'hidden'
      }}
    >
      {/* Radial brushed texture overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              rgba(255, 255, 255, 0.1) 0deg,
              rgba(255, 255, 255, 0) 0.5deg,
              rgba(0, 0, 0, 0.05) 1deg,
              rgba(255, 255, 255, 0.1) 1.5deg
            )
          `,
          opacity: 0.8,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Screw slot */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '70%',
          height: `${size * 0.125}px`,
          transform: 'translate(-50%, -50%)',
          background: `
            linear-gradient(90deg, 
              rgba(60, 60, 60, 0.9) 0%, 
              rgba(80, 80, 80, 0.95) 20%,
              rgba(40, 40, 40, 1) 50%,
              rgba(80, 80, 80, 0.95) 80%,
              rgba(60, 60, 60, 0.9) 100%
            )
          `,
          boxShadow: `
            inset 0 ${size * 0.0625}px ${size * 0.0625}px rgba(0, 0, 0, 0.5),
            inset 0 -${size * 0.03125}px ${size * 0.03125}px rgba(255, 255, 255, 0.2)
          `,
          borderRadius: `${size * 0.03125}px`
        }}
      />
      
      {/* Center highlight */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${size * 0.25}px`,
          height: `${size * 0.25}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
          borderRadius: '50%'
        }}
      />
      
      {/* Bevel effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          border: `${size * 0.0625}px solid transparent`,
          borderTopColor: 'rgba(255, 255, 255, 0.3)',
          borderLeftColor: 'rgba(255, 255, 255, 0.2)',
          borderRightColor: 'rgba(0, 0, 0, 0.1)',
          borderBottomColor: 'rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
};

export default CartierScrew;