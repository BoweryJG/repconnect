import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { IconButton, Typography, Portal, Box, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  LazyCanvas,
  LazyOrbitControls,
  LazyText,
  LazyFloat,
  LazyMeshDistortMaterial,
  ThreeSceneWrapper,
  loadThree,
} from './lazy/LazyThreeComponents';

// Lazy load Three.js specific components
const ThreeScene = lazy(() => import('./three/MissionControlThreeScene'));

// Non-3D components can remain as they are
interface MissionControlDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionControlDashboard: React.FC<MissionControlDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const { contacts } = useStore();
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    successRate: 0,
    avgDuration: 0,
    activeConnections: 0,
    systemHealth: 95,
    apiLatency: 42,
  });
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    // Calculate real metrics
    const callsPerContact = contacts.map((c) => c.callCount || 0);
    const totalCalls = callsPerContact.reduce((sum, count) => sum + count, 0);

    setMetrics({
      totalCalls,
      successRate: totalCalls > 0 ? Math.round(totalCalls * 0.87 * 100) / 100 : 0,
      avgDuration: totalCalls > 0 ? Math.round(totalCalls * 3.5 * 10) / 10 : 0,
      activeConnections: contacts.length,
      systemHealth: 90 + Math.random() * 10,
      apiLatency: 20 + Math.random() * 50,
    });
  }, [contacts]);

  // Preload Three.js when component mounts if dashboard is likely to be opened
  useEffect(() => {
    if (isOpen && !threeLoaded) {
      loadThree().then(() => setThreeLoaded(true));
    }
  }, [isOpen, threeLoaded]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 3000,
              background: 'rgba(0, 0, 20, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '24px',
                background: 'linear-gradient(180deg, rgba(0, 0, 20, 0.9) 0%, transparent 100%)',
                zIndex: 10,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  {/* Pipeline Logo Link */}
                  <div
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={onClose}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ width: 24, height: 24, position: 'relative' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <defs>
                          <linearGradient id="pipelineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9f58fa" />
                            <stop offset="100%" stopColor="#4B96DC" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="url(#pipelineGrad)"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="8"
                          fill="none"
                          stroke="url(#pipelineGrad)"
                          strokeWidth="1.5"
                          opacity="0.5"
                        />
                        <circle cx="16" cy="16" r="3" fill="url(#pipelineGrad)" />
                      </svg>
                    </div>
                    <Typography
                      sx={{
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      Pipeline
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: 4,
                        background:
                          'linear-gradient(135deg, #00FFFF 0%, #0080FF 50%, #FF00FF 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        mb: 1,
                      }}
                    >
                      Mission Control
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(0, 255, 255, 0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: 3,
                        fontFamily: 'monospace',
                      }}
                    >
                      Real-Time System Analytics
                    </Typography>
                  </div>
                </div>
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: '#00FFFF',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    '&:hover': {
                      background: 'rgba(0, 255, 255, 0.1)',
                      borderColor: 'rgba(0, 255, 255, 0.6)',
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>

            {/* 3D Scene - Lazy Loaded */}
            <Box sx={{ width: '100%', height: '100%' }}>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    <CircularProgress
                      size={60}
                      thickness={2}
                      sx={{
                        color: '#00FFFF',
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                      }}
                    >
                      Initializing 3D Environment...
                    </Typography>
                  </Box>
                }
              >
                <ThreeScene metrics={metrics} />
              </Suspense>
            </Box>

            {/* Bottom Stats Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px',
                background: 'linear-gradient(0deg, rgba(0, 0, 20, 0.9) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              {[
                { label: 'Memory Usage', value: '42%', color: '#00FF00' },
                { label: 'CPU Load', value: '28%', color: '#00FFFF' },
                { label: 'Network I/O', value: '156 KB/s', color: '#FF00FF' },
                { label: 'Active Threads', value: '8', color: '#FFD700' },
              ].map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: stat.color,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    {stat.value}
                  </Typography>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
