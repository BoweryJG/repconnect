import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Typography, CircularProgress, Alert } from '@mui/material';
import { Gavel, Mic, Psychology, AutoAwesome } from '@mui/icons-material';

interface HarveyLoadingScreenProps {
  isLoading: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'failed' | 'reconnecting';
  error?: string;
}

const loadingMessages = [
  "Initializing Harvey's neural pathways...",
  "Loading brutal honesty module...",
  "Calibrating voice analysis systems...",
  "Preparing tactical sales wisdom...",
  "Activating real-time coaching engine...",
  "Harvey is almost ready to judge you...",
];

export const HarveyLoadingScreen: React.FC<HarveyLoadingScreenProps> = ({
  isLoading,
  connectionStatus = 'connecting',
  error
}) => {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    if (isLoading && connectionStatus === 'connecting') {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, connectionStatus]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10B981';
      case 'failed': return '#EF4444';
      case 'reconnecting': return '#F59E0B';
      default: return '#FFD700';
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connected': return "Harvey is ready. Don't disappoint him.";
      case 'failed': return error || "Connection failed. Harvey is not pleased.";
      case 'reconnecting': return "Reconnecting to Harvey...";
      default: return loadingMessages[currentMessage];
    }
  };

  return (
    <AnimatePresence>
      {isLoading && (
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(26, 26, 26, 0.98) 100%)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              textAlign: 'center',
              padding: '48px',
              background: 'rgba(26, 26, 26, 0.9)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              maxWidth: '500px',
            }}
          >
            {/* Harvey Icon with Glow */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.3)',
                  '0 0 40px rgba(255, 215, 0, 0.5)',
                  '0 0 20px rgba(255, 215, 0, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                marginBottom: '32px',
              }}
            >
              <Gavel sx={{ fontSize: 60, color: '#000' }} />
            </motion.div>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px',
              }}
            >
              HARVEY AI
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px' }}
            >
              Your Brutally Honest Sales Coach
            </Typography>

            {/* Mock Mode Indicator */}
            <Alert
              severity="info"
              sx={{
                mb: 3,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                '& .MuiAlert-icon': {
                  color: '#3B82F6',
                },
              }}
            >
              <Typography variant="caption">
                🎭 Running in Demo Mode - Simulated Harvey Experience
              </Typography>
            </Alert>

            {/* Status Indicator */}
            <div style={{ marginBottom: '24px' }}>
              <CircularProgress
                size={40}
                thickness={4}
                sx={{
                  color: getStatusColor(),
                  opacity: connectionStatus === 'connected' ? 0 : 1,
                }}
              />
            </div>

            {/* Status Message */}
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: connectionStatus === 'failed' ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                  fontStyle: 'italic',
                }}
              >
                {getStatusMessage()}
              </Typography>
            </motion.div>

            {/* Feature Icons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '32px',
              }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                style={{ textAlign: 'center' }}
              >
                <Mic sx={{ fontSize: 30, color: '#FFD700', opacity: 0.7 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Voice
                </Typography>
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                style={{ textAlign: 'center' }}
              >
                <Psychology sx={{ fontSize: 30, color: '#FFD700', opacity: 0.7 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  AI Coach
                </Typography>
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                style={{ textAlign: 'center' }}
              >
                <AutoAwesome sx={{ fontSize: 30, color: '#FFD700', opacity: 0.7 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Real-Time
                </Typography>
              </motion.div>
            </motion.div>

            {/* Error Alert */}
            {connectionStatus === 'failed' && error && (
              <Alert
                severity="error"
                sx={{
                  marginTop: '24px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {error}
              </Alert>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};