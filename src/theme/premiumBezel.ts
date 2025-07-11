import { alpha, Theme } from '@mui/material/styles';
import { keyframes } from '@mui/material';

// Animation keyframes
export const animations = {
  screwWiggle: keyframes`
    0%, 100% { transform: rotate(var(--angle, 10deg)); }
    25% { transform: rotate(calc(var(--angle, 10deg) + 1.5deg)); }
    50% { transform: rotate(calc(var(--angle, 10deg) - 1deg)); }
    75% { transform: rotate(calc(var(--angle, 10deg) + 0.5deg)); }
  `,
  jewelPulse: keyframes`
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
  `,
  glassRefraction: keyframes`
    0%, 100% { opacity: 0.1; transform: translateX(-100%) skewX(-20deg); }
    50% { opacity: 0.2; transform: translateX(100%) skewX(-20deg); }
  `,
  edgeGlow: keyframes`
    0%, 100% { opacity: 0.6; box-shadow: 0 0 8px currentColor; }
    50% { opacity: 1; box-shadow: 0 0 16px currentColor; }
  `,
};

export interface BezelConfig {
  showScrews?: boolean;
  showEdgeMounts?: boolean;
  glassEffect?: boolean;
  colorTheme?: {
    impossible: string;
    shift: string;
    deep: string;
  };
  elevation?: number;
}

// Get premium bezel container styles
export const getBezelContainer = (theme: Theme, config: BezelConfig = {}) => {
  const {
    glassEffect = true,
    colorTheme = {
      impossible: '255, 0, 255',
      shift: '0, 255, 255',
      deep: '255, 0, 170',
    },
    elevation = 1,
  } = config;

  return {
    position: 'relative' as const,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    background: `linear-gradient(135deg,
      ${alpha(theme.palette.background.paper, 0.95)} 0%,
      ${alpha(theme.palette.background.paper, 0.9)} 25%,
      ${alpha(theme.palette.background.paper, 0.88)} 50%,
      ${alpha(theme.palette.background.paper, 0.9)} 75%,
      ${alpha(theme.palette.background.paper, 0.95)} 100%
    )`,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: theme.spacing(2),
    boxShadow: `
      0 ${4 * elevation}px ${16 * elevation}px ${alpha('#000000', 0.2 * elevation)},
      0 0 ${20 * elevation}px rgba(${colorTheme.shift}, 0.08),
      0 ${2 * elevation}px ${10 * elevation}px ${alpha('#000000', 0.3)},
      inset 0 1px 0 ${alpha('#ffffff', 0.06)},
      inset 0 -1px 0 ${alpha('#000000', 0.3)}
    `,
    overflow: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: theme.transitions.duration.standard,
    }),

    // Glass refraction overlay
    ...(glassEffect && {
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at top left, ${alpha('#ffffff', 0.06)}, transparent 70%),
          radial-gradient(ellipse at bottom right, rgba(${colorTheme.impossible}, 0.03), transparent 60%)
        `,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: 0.2,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: `linear-gradient(90deg,
          transparent 0%,
          ${alpha('#ffffff', 0.1)} 45%,
          ${alpha('#ffffff', 0.2)} 50%,
          ${alpha('#ffffff', 0.1)} 55%,
          transparent 100%
        )`,
        transform: 'skewX(-20deg)',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'all 1s ease',
      },
    }),

    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `
        0 ${6 * elevation}px ${24 * elevation}px ${alpha('#000000', 0.25 * elevation)},
        0 0 ${30 * elevation}px rgba(${colorTheme.shift}, 0.12),
        0 ${3 * elevation}px ${15 * elevation}px ${alpha('#000000', 0.35)},
        inset 0 1px 0 ${alpha('#ffffff', 0.08)},
        inset 0 -1px 0 ${alpha('#000000', 0.4)}
      `,
      ...(glassEffect && {
        '&::after': {
          opacity: 1,
          left: '100%',
          transition: 'all 0.6s ease',
        },
      }),
    },
  };
};

// Get screw component styles
export const getScrewStyles = (
  theme: Theme,
  position: { top?: number; bottom?: number; left?: number; right?: number },
  angle: string = '10deg'
) => ({
  wrapper: {
    position: 'absolute' as const,
    ...position,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: `radial-gradient(circle at center, 
      ${alpha('#000000', 0.3)} 0%, 
      ${alpha('#000000', 0.15)} 40%, 
      transparent 70%
    )`,
    boxShadow: `
      inset 0 1px 2px ${alpha('#000000', 0.5)},
      inset 0 -1px 1px ${alpha('#ffffff', 0.1)},
      0 1px 1px ${alpha('#ffffff', 0.05)}
    `,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
    zIndex: 10,
  },
  screw: {
    position: 'relative' as const,
    width: 6,
    height: 6,
    background: `
      radial-gradient(circle at 35% 35%, #e0e0e0 0%, #b8b8b8 15%, #888 40%, #555 70%, #222 100%),
      linear-gradient(135deg, #ccc 0%, #666 100%)
    `,
    backgroundSize: '100%, 100%',
    borderRadius: '50%',
    boxShadow: `
      inset 0 0.5px 1px ${alpha('#ffffff', 0.4)},
      inset 0 -0.5px 1px ${alpha('#000000', 0.5)},
      0 0.5px 2px ${alpha('#000000', 0.8)},
      0 0 3px ${alpha('#000000', 0.3)}
    `,
    border: `0.5px solid ${alpha('#000000', 0.2)}`,
    animation: `${animations.screwWiggle} 5s ease-in-out infinite`,
    '--angle': angle,
    transform: `rotate(${angle})`,

    // Phillips head grooves
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '70%',
      height: '0.5px',
      background: `linear-gradient(90deg, 
        transparent, 
        ${alpha('#000000', 0.7)} 20%, 
        ${alpha('#000000', 0.7)} 80%, 
        transparent
      )`,
      transform: 'translate(-50%, -50%)',
      boxShadow: `0 0 1px ${alpha('#ffffff', 0.15)}`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '0.5px',
      height: '70%',
      background: `linear-gradient(180deg, 
        transparent, 
        ${alpha('#000000', 0.7)} 20%, 
        ${alpha('#000000', 0.7)} 80%, 
        transparent
      )`,
      transform: 'translate(-50%, -50%)',
      boxShadow: `0 0 1px ${alpha('#ffffff', 0.15)}`,
    },
  },
  jewel: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 2,
    height: 2,
    transform: 'translate(-50%, -50%)',
    background: `radial-gradient(circle at center, 
      ${alpha('#ffffff', 0.8)}, 
      ${alpha(theme.palette.primary.main, 0.6)}, 
      ${alpha(theme.palette.secondary.main, 0.4)}, 
      transparent
    )`,
    borderRadius: '50%',
    opacity: 0.7,
    animation: `${animations.jewelPulse} 3s infinite`,
  },
});

// Get edge mount styles
export const getEdgeMountStyles = (
  theme: Theme,
  side: 'left' | 'right',
  colorTheme = { shift: '0, 255, 255', impossible: '255, 0, 255' }
) => ({
  position: 'absolute' as const,
  top: theme.spacing(1.5),
  bottom: theme.spacing(1.5),
  [side]: -4,
  width: 3,
  background: `linear-gradient(to bottom,
    rgba(${colorTheme.impossible}, 0.2),
    rgba(${colorTheme.shift}, 0.1)
  )`,
  boxShadow: `0 0 8px rgba(${colorTheme.shift}, 0.15)`,
  opacity: 0.6,
  borderRadius: side === 'left' ? '2px 0 0 2px' : '0 2px 2px 0',
  transition: theme.transitions.create(['opacity', 'box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  transform: 'scaleY(1)',
  animation: `${animations.edgeGlow} 4s ease-in-out infinite`,

  '&:hover': {
    opacity: 1,
    boxShadow: `0 0 12px rgba(${colorTheme.shift}, 0.3)`,
    transform: 'scaleY(1.1)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 10,
    height: '80%',
    background: `radial-gradient(circle, rgba(${colorTheme.impossible}, 0.4), transparent)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0.1,
    transition: theme.transitions.create('opacity'),
  },

  '&:hover::after': {
    opacity: 0.5,
  },
});

// Create a premium card with bezel design
export const createBezelCard = (theme: Theme, config: BezelConfig = {}) => {
  const baseStyles = getBezelContainer(theme, config);

  return {
    ...baseStyles,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),

    // Add corner screws if enabled
    ...(config.showScrews && {
      '& .bezel-screws': {
        '& > *:nth-of-type(1)': getScrewStyles(theme, { top: 12, left: 12 }, '10deg'),
        '& > *:nth-of-type(2)': getScrewStyles(theme, { top: 12, right: 12 }, '22deg'),
        '& > *:nth-of-type(3)': getScrewStyles(theme, { bottom: 12, left: 12 }, '-12deg'),
        '& > *:nth-of-type(4)': getScrewStyles(theme, { bottom: 12, right: 12 }, '18deg'),
      },
    }),

    // Add edge mounts if enabled
    ...(config.showEdgeMounts && {
      '& .bezel-edge-left': getEdgeMountStyles(theme, 'left', config.colorTheme),
      '& .bezel-edge-right': getEdgeMountStyles(theme, 'right', config.colorTheme),
    }),
  };
};

// Utility to add bezel design to existing components
export const withBezelDesign = (styles: any, theme: Theme, config: BezelConfig = {}) => ({
  ...styles,
  ...createBezelCard(theme, config),
});

// Premium button with forcefield effect
export const getPremiumButtonStyles = (
  theme: Theme,
  colorTheme = { impossible: '255, 0, 255', shift: '0, 255, 255' }
) => ({
  position: 'relative' as const,
  overflow: 'hidden',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
  }),

  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    border: '2px solid',
    borderColor: `transparent rgb(${colorTheme.impossible}) transparent rgb(${colorTheme.shift})`,
    borderRadius: 'inherit',
    transform: 'translate(-50%, -50%) scale(1.1)',
    opacity: 0,
    transition: theme.transitions.create(['all']),
  },

  '&:hover::after': {
    opacity: 1,
    transform: 'translate(-50%, -50%) scale(1.15) rotate(180deg)',
    animation: `forcefieldRotate 2s linear infinite`,
  },

  '@keyframes forcefieldRotate': {
    '0%': { transform: 'translate(-50%, -50%) scale(1.15) rotate(0deg)' },
    '100%': { transform: 'translate(-50%, -50%) scale(1.15) rotate(360deg)' },
  },

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg,
      transparent,
      ${alpha('#ffffff', 0.3)},
      transparent
    )`,
    transition: 'left 0.5s',
  },

  '&:hover::before': {
    left: '100%',
  },

  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `
      0 6px 30px ${alpha(theme.palette.primary.main, 0.4)},
      0 0 0 2px ${alpha('#ffffff', 0.2)} inset,
      0 0 40px rgba(${colorTheme.impossible}, 0.3)
    `,
    filter: 'brightness(1.1)',
  },
});
