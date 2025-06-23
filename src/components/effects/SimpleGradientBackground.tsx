import React from 'react';
import { Box } from '@mui/material';

export const SimpleGradientBackground: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
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
          linear-gradient(
            135deg,
            #0F172A 0%,
            #1E293B 50%,
            #0F172A 100%
          )
        `,
        zIndex: 0,
      }}
    />
  );
};