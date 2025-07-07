import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Gavel, PowerSettingsNew } from '@mui/icons-material';
import { HarveyControlPanel } from './HarveyControlPanel';
import { harveyWebRTC } from '../services/harveyWebRTC';
import { useStore } from '../store/useStore';

interface HarveySettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const HarveySettingsModal: React.FC<HarveySettingsModalProps> = ({
  open,
  onClose,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const { subscriptionTier } = useStore();

  const testHarveyConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('Connecting to Harvey...');
    
    try {
      await harveyWebRTC.connect({
        userId: 'test-user',
        onConnectionChange: (connected) => {
          if (connected) {
            setConnectionStatus('Harvey is ready! Connection successful.');
            setTimeout(() => {
              harveyWebRTC.disconnect();
              setTestingConnection(false);
              setConnectionStatus('');
            }, 3000);
          }
        },
      });
    } catch (error) {
      setConnectionStatus('Failed to connect to Harvey. Please check your settings.');
      setTimeout(() => {
        setTestingConnection(false);
        setConnectionStatus('');
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(26, 26, 26, 0.98)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              pb: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Gavel sx={{ fontSize: 28, color: '#000' }} />
              </motion.div>
              <div>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Harvey AI Settings
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Configure your AI sales coach
                </Typography>
              </div>
            </div>
            <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {/* Subscription Alert */}
            {subscriptionTier === 'free' && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  '& .MuiAlert-icon': {
                    color: '#FFD700',
                  },
                }}
              >
                <Typography variant="body2">
                  Harvey is available on Premium plans. Upgrade to unlock real-time AI coaching during calls.
                </Typography>
              </Alert>
            )}

            {/* Harvey Control Panel */}
            <HarveyControlPanel embedded={true} />

            <Divider sx={{ my: 3, borderColor: 'rgba(255, 215, 0, 0.2)' }} />

            {/* Connection Test */}
            <div style={{ marginBottom: '24px' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#FFD700' }}>
                Connection Test
              </Typography>
              <Button
                variant="contained"
                startIcon={<PowerSettingsNew />}
                onClick={testHarveyConnection}
                disabled={testingConnection}
                sx={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: '#000',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 215, 0, 0.3)',
                  },
                }}
              >
                {testingConnection ? 'Testing Connection...' : 'Test Harvey Connection'}
              </Button>
              {connectionStatus && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 2,
                    color: connectionStatus.includes('successful') ? '#10B981' : '#EF4444',
                    fontStyle: 'italic',
                  }}
                >
                  {connectionStatus}
                </Typography>
              )}
            </div>

            {/* Quick Access Info */}
            <Alert
              severity="info"
              sx={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                '& .MuiAlert-icon': {
                  color: '#3B82F6',
                },
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Quick Access:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
                <li>Harvey automatically activates when you make calls</li>
                <li>Access Harvey Syndicate from the navbar</li>
                <li>Use voice commands during calls: "Hey Harvey..."</li>
                <li>Check Harvey War Room for team battles</li>
              </Typography>
            </Alert>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};