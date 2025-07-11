export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const generateKeyframes = (name: string, keyframes: string): string => {
  return `@keyframes ${name} { ${keyframes} }`;
};

export const flowAnimation = generateKeyframes(
  'flow',
  `
    0% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -100; }
  `
);

export const pulseAnimation = generateKeyframes(
  'pulse',
  `
    0%, 100% { 
      stroke-width: var(--pipe-width);
      filter: drop-shadow(0 0 2px currentColor);
    }
    50% { 
      stroke-width: calc(var(--pipe-width) * 1.2);
      filter: drop-shadow(0 0 8px currentColor);
    }
  `
);

export const glowAnimation = generateKeyframes(
  'glow',
  `
    0%, 100% { 
      filter: drop-shadow(0 0 4px currentColor) 
              drop-shadow(0 0 8px currentColor);
      opacity: 0.8;
    }
    50% { 
      filter: drop-shadow(0 0 8px currentColor) 
              drop-shadow(0 0 16px currentColor)
              drop-shadow(0 0 24px currentColor);
      opacity: 1;
    }
  `
);

export const morphAnimation = generateKeyframes(
  'morph',
  `
    0%, 100% { transform: scale(1) translateZ(0); }
    25% { transform: scale(1.02) translateZ(0); }
    50% { transform: scale(0.98) translateZ(0); }
    75% { transform: scale(1.01) translateZ(0); }
  `
);

export const particleAnimation = generateKeyframes(
  'particle',
  `
    0% { 
      offset-distance: 0%;
      opacity: 0;
      transform: scale(0);
    }
    10% {
      opacity: 1;
      transform: scale(1);
    }
    90% {
      opacity: 1;
      transform: scale(1);
    }
    100% { 
      offset-distance: 100%;
      opacity: 0;
      transform: scale(0);
    }
  `
);

export const generateGradientAnimation = (gradientId: string, colors: string[]): string => {
  const stops = colors
    .map((color, i) => {
      const offset = (i / (colors.length - 1)) * 100;
      return `${offset}% { stop-color: ${color}; }`;
    })
    .join(' ');

  return generateKeyframes(`gradient-${gradientId}`, stops);
};

export const generatePathMorphAnimation = (paths: string[]): string => {
  const steps = paths
    .map((path, i) => {
      const percentage = (i / (paths.length - 1)) * 100;
      return `${percentage}% { d: path('${path}'); }`;
    })
    .join(' ');

  return generateKeyframes('pathMorph', steps);
};
