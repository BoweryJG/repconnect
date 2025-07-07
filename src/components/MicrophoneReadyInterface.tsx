import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Stack,
  Fade,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Mic,
  VolumeUp,
  Psychology,
  SmartToy,
  CheckCircle,
  Settings,
  RecordVoiceOver
} from '@mui/icons-material';

interface MicrophoneReadyInterfaceProps {
  onConnectToAgent: () => void;
  onAudioSettings: () => void;
  audioLevel?: number;
  isConnecting?: boolean;
  availableAgents?: Array<{
    id: string;
    name: string;
    description: string;
    avatar?: string;
  }>;
  selectedAgent?: string;
  onAgentSelect?: (agentId: string) => void;
}

export const MicrophoneReadyInterface: React.FC<MicrophoneReadyInterfaceProps> = ({
  onConnectToAgent,
  onAudioSettings,
  audioLevel = 0,
  isConnecting = false,
  availableAgents = [
    { id: 'harvey', name: 'Harvey Coach', description: 'Sales coaching AI' },
    { id: 'moshi', name: 'Moshi AI', description: 'General conversation AI' }
  ],
  selectedAgent = 'harvey',
  onAgentSelect
}) => {
  const [showAudioTest, setShowAudioTest] = useState(true);
  const [testPassed, setTestPassed] = useState(false);
  const audioTestTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (audioLevel > 0.1) {
      setTestPassed(true);
      setShowAudioTest(false);
      
      if (audioTestTimeoutRef.current) {
        clearTimeout(audioTestTimeoutRef.current);
      }
    }
  }, [audioLevel]);

  useEffect(() => {
    audioTestTimeoutRef.current = setTimeout(() => {
      if (!testPassed) {
        setShowAudioTest(false);
      }
    }, 5000);

    return () => {
      if (audioTestTimeoutRef.current) {
        clearTimeout(audioTestTimeoutRef.current);
      }
    };
  }, [testPassed]);

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'harvey':
        return <Psychology />;
      case 'moshi':
        return <SmartToy />;
      default:
        return <RecordVoiceOver />;
    }
  };

  return (
    <Card sx={{ maxWidth: 500, margin: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3} alignItems="center">
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" gutterBottom>
              Microphone Ready
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your microphone is initialized and working properly
            </Typography>
          </Box>

          {showAudioTest && (
            <Fade in={showAudioTest}>
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  Speak to test your microphone
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={audioLevel * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: audioLevel > 0.1 ? 'success.main' : 'primary.main'
                    }
                  }}
                />
                <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1 }}>
                  <Mic sx={{ fontSize: 16 }} />
                  <VolumeUp sx={{ fontSize: 16 }} />
                </Stack>
              </Box>
            </Fade>
          )}

          {testPassed && (
            <Fade in={testPassed}>
              <Chip
                icon={<CheckCircle />}
                label="Audio test passed"
                color="success"
                variant="outlined"
              />
            </Fade>
          )}

          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Select Chat Agent
            </Typography>
            <Stack spacing={1}>
              {availableAgents.map((agent) => (
                <Card
                  key={agent.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedAgent === agent.id ? 2 : 1,
                    borderColor: selectedAgent === agent.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => onAgentSelect?.(agent.id)}
                >
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {getAgentIcon(agent.id)}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {agent.description}
                        </Typography>
                      </Box>
                      {selectedAgent === agent.id && (
                        <CheckCircle sx={{ color: 'primary.main', fontSize: 20 }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>

          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Tooltip title="Audio Settings">
              <IconButton onClick={onAudioSettings}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={onConnectToAgent}
              disabled={isConnecting}
              startIcon={isConnecting ? undefined : getAgentIcon(selectedAgent)}
              sx={{ py: 1.5 }}
            >
              {isConnecting ? 'Connecting...' : `Connect to ${availableAgents.find(a => a.id === selectedAgent)?.name}`}
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            Ready to start your conversation with AI assistance
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};