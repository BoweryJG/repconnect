import { keyframes } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

// Premium glassmorphism effects
export const premiumGlass = {
  ultra: {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: [
      '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      'inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)',
    ].join(', '),
    transform: 'translateZ(0)',
    willChange: 'transform, opacity',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      opacity: 0.5,
    },
  } as SxProps<Theme>,

  card: {
    background:
      'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: [
      '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      'inset 0 0 32px 0 rgba(255, 255, 255, 0.02)',
      'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    ].join(', '),
    transform: 'translateZ(0)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateZ(0) translateY(-4px) scale(1.02)',
      boxShadow: [
        '0 20px 40px 0 rgba(99, 102, 241, 0.3)',
        'inset 0 0 32px 0 rgba(255, 255, 255, 0.04)',
        'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      ].join(', '),
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
  } as SxProps<Theme>,

  button: {
    background:
      'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)',
    backdropFilter: 'blur(10px) saturate(150%)',
    WebkitBackdropFilter: 'blur(10px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: [
      '0 4px 24px 0 rgba(99, 102, 241, 0.2)',
      'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
    ].join(', '),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background:
        'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: [
        '0 8px 32px 0 rgba(99, 102, 241, 0.4)',
        'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
      ].join(', '),
    },
    '&:active': {
      transform: 'translateY(0) scale(0.98)',
    },
  } as SxProps<Theme>,
};

// Holographic effect
export const holographic = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

export const holographicCard = {
  position: 'relative' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background:
      'linear-gradient(135deg, #6366F1, #EC4899, #3B82F6, #10B981, #F59E0B, #EC4899, #6366F1)',
    backgroundSize: '300% 300%',
    animation: `${holographic} 6s ease infinite`,
    borderRadius: 'inherit',
    opacity: 0.4,
    filter: 'blur(10px)',
    zIndex: -1,
  },
} as SxProps<Theme>;

// Neon glow effects
export const neonGlow = {
  primary: {
    boxShadow: [
      '0 0 20px rgba(99, 102, 241, 0.5)',
      '0 0 40px rgba(99, 102, 241, 0.3)',
      '0 0 60px rgba(99, 102, 241, 0.1)',
      'inset 0 0 20px rgba(99, 102, 241, 0.1)',
    ].join(', '),
    border: '1px solid rgba(99, 102, 241, 0.5)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: [
        '0 0 30px rgba(99, 102, 241, 0.7)',
        '0 0 60px rgba(99, 102, 241, 0.5)',
        '0 0 90px rgba(99, 102, 241, 0.3)',
        'inset 0 0 20px rgba(99, 102, 241, 0.2)',
      ].join(', '),
      border: '1px solid rgba(99, 102, 241, 0.8)',
    },
  } as SxProps<Theme>,

  secondary: {
    boxShadow: [
      '0 0 20px rgba(236, 72, 153, 0.5)',
      '0 0 40px rgba(236, 72, 153, 0.3)',
      '0 0 60px rgba(236, 72, 153, 0.1)',
      'inset 0 0 20px rgba(236, 72, 153, 0.1)',
    ].join(', '),
    border: '1px solid rgba(236, 72, 153, 0.5)',
  } as SxProps<Theme>,
};

// Animated gradient border
export const animatedBorder = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

export const gradientBorder = {
  position: 'relative' as const,
  background: 'rgba(10, 10, 11, 0.9)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: 'linear-gradient(135deg, #6366F1, #EC4899, #3B82F6)',
    backgroundSize: '200% 200%',
    animation: `${animatedBorder} 3s ease infinite`,
    borderRadius: 'inherit',
    zIndex: -1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    background: 'inherit',
    borderRadius: 'inherit',
    zIndex: -1,
  },
} as SxProps<Theme>;

// Floating animation
export const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px) translateZ(0);
  }
  50% {
    transform: translateY(-20px) translateZ(0);
  }
`;

export const floatingCard = {
  animation: `${floatAnimation} 6s ease-in-out infinite`,
  '&:nth-of-type(2n)': {
    animationDelay: '0.5s',
  },
  '&:nth-of-type(3n)': {
    animationDelay: '1s',
  },
} as SxProps<Theme>;

// Shimmer loading effect
export const shimmerLoading = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

export const shimmerCard = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background:
      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
    animation: `${shimmerLoading} 2s infinite`,
  },
} as SxProps<Theme>;

// Particle effect background
export const particleBackground = {
  position: 'relative' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '4px',
    height: '4px',
    background: 'rgba(99, 102, 241, 0.8)',
    borderRadius: '50%',
    boxShadow: [
      '0 0 10px rgba(99, 102, 241, 0.8)',
      '20px 20px 0 rgba(236, 72, 153, 0.6)',
      '-20px -20px 0 rgba(59, 130, 246, 0.6)',
      '40px -40px 0 rgba(16, 185, 129, 0.6)',
      '-40px 40px 0 rgba(245, 158, 11, 0.6)',
    ].join(', '),
    animation: `${floatAnimation} 8s ease-in-out infinite`,
  },
} as SxProps<Theme>;
