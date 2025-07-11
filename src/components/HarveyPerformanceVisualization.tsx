import React from 'react';

interface HarveyPerformanceVisualizationProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export const HarveyPerformanceVisualization: React.FC<HarveyPerformanceVisualizationProps> = ({
  width = 400,
  height = 300,
}) => {
  return (
    <div
      style={{
        width,
        height,
        background: '#1a1a1a',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p style={{ color: '#888' }}>Performance visualization coming soon...</p>
    </div>
  );
};
