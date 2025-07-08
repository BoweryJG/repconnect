import React from 'react';

interface HarveyCoachingOverlayProps {
  isActive: boolean;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  coachingMode?: 'off' | 'gentle' | 'normal' | 'aggressive' | 'brutal';
}

export const HarveyCoachingOverlay: React.FC<HarveyCoachingOverlayProps> = ({
  isActive,
  onClose,
  position = 'top-right',
  coachingMode = 'normal',
}) => {
  if (!isActive) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: position.includes('top') ? '24px' : 'auto',
      bottom: position.includes('bottom') ? '24px' : 'auto',
      right: position.includes('right') ? '24px' : 'auto',
      left: position.includes('left') ? '24px' : 'auto',
      padding: '16px',
      background: 'rgba(26, 26, 26, 0.95)',
      border: '1px solid rgba(236, 72, 153, 0.3)',
      borderRadius: '8px',
      zIndex: 9999,
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Harvey AI Coach</h4>
      <p style={{ margin: 0, fontSize: '14px' }}>Coaching overlay coming soon...</p>
    </div>
  );
}