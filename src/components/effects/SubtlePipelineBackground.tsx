import React from 'react';
import { motion } from 'framer-motion';
import { pipelineColors } from '../../theme/premiumTheme';

export const SubtlePipelineBackground: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dark gradient base */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
          radial-gradient(circle at 20% 50%, ${pipelineColors.pipeBlue}10 0%, transparent 40%),
          radial-gradient(circle at 80% 50%, ${pipelineColors.pipePurple}10 0%, transparent 40%),
          radial-gradient(circle at 50% 20%, ${pipelineColors.pipeOrange}08 0%, transparent 30%),
          linear-gradient(180deg, #0A0A0B 0%, #0F0F10 100%)
        `,
        }}
      />

      {/* Subtle grid pattern */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
        }}
      >
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#fff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating orbs */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${pipelineColors.pipeBlue}20 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '30%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${pipelineColors.pipePurple}15 0%, transparent 70%)`,
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
