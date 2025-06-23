import React from 'react';
import { Box } from '@mui/material';
import { AdaptiveRenderer } from '../../lib/performance/AdaptiveRenderer';

interface AdaptiveGradientBackgroundProps {
  quality?: 'ultra' | 'high' | 'medium' | 'low';
}

export const AdaptiveGradientBackground: React.FC<AdaptiveGradientBackgroundProps> = ({ quality }) => {
  const renderer = AdaptiveRenderer.getInstance();
  const currentQuality = quality || renderer.getCurrentQuality();
  
  const getBackground = () => {
    switch (currentQuality) {
      case 'ultra':
      case 'high':
        return `
          radial-gradient(
            ellipse at top left,
            rgba(99, 102, 241, 0.15) 0%,
            transparent 50%
          ),
          radial-gradient(
            ellipse at bottom right,
            rgba(139, 92, 246, 0.15) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at center,
            rgba(168, 85, 247, 0.05) 0%,
            transparent 70%
          ),
          linear-gradient(
            135deg,
            #0F172A 0%,
            #1E293B 50%,
            #0F172A 100%
          )
        `;
      case 'medium':
        return `
          radial-gradient(
            ellipse at top left,
            rgba(99, 102, 241, 0.1) 0%,
            transparent 50%
          ),
          linear-gradient(
            135deg,
            #0F172A 0%,
            #1E293B 50%,
            #0F172A 100%
          )
        `;
      case 'low':
        return '#0F172A';
      default:
        return '#0F172A';
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: getBackground(),
        zIndex: 0,
        transition: 'background 0.5s ease',
      }}
    />
  );
};