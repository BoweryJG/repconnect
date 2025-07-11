import React from 'react';

interface HarveySpectatorModeProps {
  callId: string;
  isActive: boolean;
  onClose?: () => void;
  callMetrics?: any;
}

export const HarveySpectatorMode: React.FC<HarveySpectatorModeProps> = ({
  callId,
  isActive,
  onClose,
  callMetrics,
}) => {
  if (!isActive) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center' }}>Harvey Spectator Mode - Coming Soon</h3>
    </div>
  );
};
