import React, { Suspense } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

// Loading component for lazy-loaded components
const LoadingFallback = ({ component = 'component' }: { component?: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1e3a 100%)',
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CircularProgress
        size={60}
        thickness={2}
        sx={{
          color: '#00FFFF',
          mb: 3,
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontFamily: 'monospace',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        Loading {component}...
      </Typography>
    </motion.div>
  </div>
);

// Lazy load Harvey components
const HarveySyndicateLazy = React.lazy(() =>
  import('../HarveySyndicate').then((module) => ({
    default: module.HarveySyndicate,
  }))
);

const HarveyWarRoomLazy = React.lazy(() =>
  import('../HarveyWarRoom').then((module) => ({
    default: module.HarveyWarRoom,
  }))
);

const HarveyCallQueueInterfaceLazy = React.lazy(() =>
  import('../HarveyCallQueueInterface').then((module) => ({
    default: module.HarveyCallQueueInterface,
  }))
);

const HarveyBattleModeLazy = React.lazy(() =>
  import('../HarveyBattleMode').then((module) => ({
    default: module.HarveyBattleMode,
  }))
);

const HarveyMetricsDashboardLazy = React.lazy(() =>
  import('../HarveyMetricsDashboard').then((module) => ({
    default: module.HarveyMetricsDashboard,
  }))
);

// Export wrapped components with Suspense
export const LazyHarveySyndicate: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Harvey Syndicate" />}>
    <HarveySyndicateLazy />
  </Suspense>
);

export const LazyHarveyWarRoom: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Harvey War Room" />}>
    <HarveyWarRoomLazy />
  </Suspense>
);

export const LazyHarveyCallQueueInterface: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Call Queue" />}>
    <HarveyCallQueueInterfaceLazy />
  </Suspense>
);

export const LazyHarveyBattleMode: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Battle Mode" />}>
    <HarveyBattleModeLazy />
  </Suspense>
);

export const LazyHarveyMetricsDashboard: React.FC = () => (
  <Suspense fallback={<LoadingFallback component="Metrics Dashboard" />}>
    <HarveyMetricsDashboardLazy />
  </Suspense>
);
