import React, { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Fallback component for 3D scene loading
const ThreeLoadingFallback: React.FC = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
    }}
  >
    <CircularProgress
      size={40}
      thickness={2}
      sx={{
        color: '#00FFFF',
        '& .MuiCircularProgress-circle': {
          strokeLinecap: 'round',
        },
      }}
    />
  </Box>
);

// Lazy load the Canvas and Three.js components
export const LazyCanvas = lazy(() =>
  import('@react-three/fiber').then((module) => ({
    default: module.Canvas,
  }))
);

export const LazyOrbitControls = lazy(() =>
  import('@react-three/drei').then((module) => ({
    default: module.OrbitControls,
  }))
);

export const LazyText = lazy(() =>
  import('@react-three/drei').then((module) => ({
    default: module.Text,
  }))
);

export const LazyFloat = lazy(() =>
  import('@react-three/drei').then((module) => ({
    default: module.Float,
  }))
);

export const LazyMeshDistortMaterial = lazy(() =>
  import('@react-three/drei').then((module) => ({
    default: module.MeshDistortMaterial,
  }))
);

// Wrapper component for Three.js scenes
export const ThreeSceneWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<ThreeLoadingFallback />}>{children}</Suspense>
);

// Export THREE as a lazy import
export const loadThree = () => import('three');

// Utility to preload Three.js when the user might navigate to 3D content
export const preloadThreeJS = () => {
  // Preload the main Three.js library
  loadThree();

  // Preload React Three Fiber components
  import('@react-three/fiber');
  import('@react-three/drei');
};
