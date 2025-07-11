import React, { useMemo } from 'react';

interface PrecisionScrewProps {
  position:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  grooveType?: 'slot' | 'phillips';
  angleRange?: number; // Max rotation angle (e.g., 30 = -30 to +30 degrees)
  wiggleDuration?: number; // Animation duration in seconds
  jewelColor?: string; // Custom jewel color
  premium?: boolean; // Use premium variant
  delay?: number; // Animation delay in seconds
  className?: string;
  style?: React.CSSProperties;
}

export const PrecisionScrew: React.FC<PrecisionScrewProps> = ({
  position,
  size = 'medium',
  grooveType = 'phillips',
  angleRange = 30,
  wiggleDuration = 6,
  jewelColor,
  premium = false,
  delay = 0,
  className = '',
  style = {},
}) => {
  // Generate random angle and groove rotation
  const { screwAngle, grooveAngle, jewelDelay } = useMemo(() => {
    const angle = (Math.random() - 0.5) * 2 * angleRange;
    const groove = grooveType === 'phillips' ? Math.random() * 45 : 0;
    const jDelay = Math.random() * 2;
    return {
      screwAngle: angle,
      grooveAngle: groove,
      jewelDelay: jDelay,
    };
  }, [angleRange, grooveType]);

  const screwStyle: React.CSSProperties = {
    '--screw-angle': `${screwAngle}deg`,
    '--screw-wiggle-duration': `${wiggleDuration}s`,
    '--screw-delay': `${delay}s`,
    '--jewel-delay': `${jewelDelay}s`,
    ...style,
  } as React.CSSProperties;

  const grooveStyle: React.CSSProperties = {
    '--groove-angle': `${grooveAngle}deg`,
  } as React.CSSProperties;

  const jewelStyle: React.CSSProperties = jewelColor
    ? {
        background: `radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.9) 0%,
      ${jewelColor} 30%,
      ${jewelColor} 60%,
      rgba(255, 0, 170, 0.5) 100%
    )`,
      }
    : {};

  return (
    <div
      className={`screw-wrapper ${position} ${size} ${premium ? 'premium' : ''} ${className}`}
      style={screwStyle}
    >
      <div className="screw-bezel" />
      <div className="screw">
        <div className={`screw-groove ${grooveType}`} style={grooveStyle} />
        <div className="screw-jewel" style={jewelStyle} />
      </div>
    </div>
  );
};

// Helper component for adding screws to all corners
interface CornerScrewsProps {
  size?: 'small' | 'medium' | 'large';
  grooveType?: 'slot' | 'phillips';
  premium?: boolean;
  includeCenter?: boolean; // Add center screws (top/bottom)
}

export const CornerScrews: React.FC<CornerScrewsProps> = ({
  size = 'medium',
  grooveType = 'phillips',
  premium = false,
  includeCenter = false,
}) => {
  const positions: Array<PrecisionScrewProps['position']> = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  if (includeCenter) {
    positions.push('top-center', 'bottom-center');
  }

  return (
    <>
      {positions.map((position, index) => (
        <PrecisionScrew
          key={position}
          position={position}
          size={size}
          grooveType={grooveType}
          premium={premium}
          delay={index * 0.3}
        />
      ))}
    </>
  );
};
