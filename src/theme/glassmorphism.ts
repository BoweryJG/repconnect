import { keyframes } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

// GPU-accelerated glassmorphism effects as sx props
export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: [
      '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
    ].join(', '),
    transform: 'translateZ(0)', // Force GPU acceleration
    willChange: 'transform, opacity',
  } as SxProps<Theme>,

  dark: {
    background: 'rgba(17, 25, 40, 0.75)',
    backdropFilter: 'blur(16px) saturate(150%)',
    WebkitBackdropFilter: 'blur(16px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: [
      '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    ].join(', '),
    transform: 'translateZ(0)',
    willChange: 'transform, opacity',
  } as SxProps<Theme>,

  colored: (color: string) =>
    ({
      background: `${color}22`,
      backdropFilter: 'blur(20px) saturate(200%)',
      WebkitBackdropFilter: 'blur(20px) saturate(200%)',
      border: `1px solid ${color}44`,
      boxShadow: [`0 8px 32px 0 ${color}33`, `inset 0 0 0 1px ${color}22`].join(', '),
      transform: 'translateZ(0)',
      willChange: 'transform, opacity',
    }) as SxProps<Theme>,

  hover: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateZ(0) translateY(-2px)',
      boxShadow: [
        '0 12px 48px 0 rgba(31, 38, 135, 0.2)',
        'inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
      ].join(', '),
    },
  } as SxProps<Theme>,
};

// Shimmer effect for loading states
export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const shimmerEffect = {
  background:
    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 2s infinite`,
} as SxProps<Theme>;

// Glow effects
export const glow = {
  soft: (color: string) =>
    ({
      boxShadow: [`0 0 20px ${color}44`, `0 0 40px ${color}22`, `inset 0 0 20px ${color}11`].join(
        ', '
      ),
    }) as SxProps<Theme>,

  intense: (color: string) =>
    ({
      boxShadow: [
        `0 0 30px ${color}66`,
        `0 0 60px ${color}44`,
        `0 0 90px ${color}22`,
        `inset 0 0 30px ${color}22`,
      ].join(', '),
    }) as SxProps<Theme>,

  pulse: (color: string) => keyframes`
    0%, 100% {
      box-shadow: 0 0 20px ${color}44, 0 0 40px ${color}22;
    }
    50% {
      box-shadow: 0 0 30px ${color}66, 0 0 60px ${color}44;
    }
  `,
};

// Floating animation for elements
export const float = keyframes`
  0%, 100% {
    transform: translateZ(0) translateY(0px);
  }
  50% {
    transform: translateZ(0) translateY(-10px);
  }
`;

// GPU-optimized gradient backgrounds
export const gradientShift = keyframes`
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

export const gradients = {
  aurora: {
    background:
      'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #667eea 100%)',
    backgroundSize: '400% 400%',
    animation: `${gradientShift} 15s ease infinite`,
    transform: 'translateZ(0)',
  } as SxProps<Theme>,

  sunset: {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #fa709a 100%)',
    backgroundSize: '200% 200%',
    animation: `${gradientShift} 10s ease infinite`,
    transform: 'translateZ(0)',
  } as SxProps<Theme>,

  ocean: {
    background: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 50%, #2E3192 100%)',
    backgroundSize: '200% 200%',
    animation: `${gradientShift} 12s ease infinite`,
    transform: 'translateZ(0)',
  } as SxProps<Theme>,
};

// Texture overlays for depth
export const textures = {
  noise: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
      pointerEvents: 'none',
      opacity: 0.5,
      mixBlendMode: 'overlay',
    },
  } as SxProps<Theme>,

  dots: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      pointerEvents: 'none',
    },
  } as SxProps<Theme>,
};
