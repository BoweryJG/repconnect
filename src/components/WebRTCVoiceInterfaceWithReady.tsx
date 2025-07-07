import React, { useState, useEffect, useCallback } from 'react';
import { WebRTCVoiceInterface } from './WebRTCVoiceInterface';
import { MicrophoneReadyInterface } from './MicrophoneReadyInterface';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import { Close } from '@mui/icons-material';

interface WebRTCVoiceInterfaceWithReadyProps {
  sessionId?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  showTranscript?: boolean;
}

export const WebRTCVoiceInterfaceWithReady: React.FC<WebRTCVoiceInterfaceWithReadyProps> = (props) => {
  const [microphoneInitialized, setMicrophoneInitialized] = useState(false);
  const [showReadyDialog, setShowReadyDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('harvey');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicrophoneInitialized(true);
        setShowReadyDialog(true);
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setMicrophoneInitialized(false);
      }
    };

    checkMicrophonePermission();
  }, []);

  const handleConnectToAgent = useCallback(() => {
    setIsConnecting(true);
    setShowReadyDialog(false);
    
    setTimeout(() => {
      setIsConnecting(false);
    }, 1000);
  }, []);

  const handleAudioSettings = useCallback(() => {
    console.log('Opening audio settings...');
  }, []);

  const handleAudioLevel = useCallback((level: number) => {
    setAudioLevel(level);
  }, []);

  return (
    <>
      <WebRTCVoiceInterface
        {...props}
        autoConnect={!showReadyDialog && microphoneInitialized}
      />

      <Dialog
        open={showReadyDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={() => setShowReadyDialog(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 1
          }}
        >
          <Close />
        </IconButton>
        
        <DialogContent sx={{ p: 0 }}>
          <MicrophoneReadyInterface
            onConnectToAgent={handleConnectToAgent}
            onAudioSettings={handleAudioSettings}
            audioLevel={audioLevel}
            isConnecting={isConnecting}
            selectedAgent={selectedAgent}
            onAgentSelect={setSelectedAgent}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};