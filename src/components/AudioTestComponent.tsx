import React, { useState } from 'react';
import { Button, Paper, Typography, Box } from '@mui/material';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function AudioTestComponent() {
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testMicrophone = async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setMicStream(stream);
      setIsMicrophoneEnabled(true);

      // Create audio context for visualization
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);

      // Create analyser for audio levels
      const analyser = ctx.createAnalyser();
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        // const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        // Mic audio level monitoring active

        if (isMicrophoneEnabled) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      checkAudioLevel();
    } catch (err: any) {
      setError(`Microphone error: ${err.message}`);
      console.error('Microphone test failed:', err);
    }
  };

  const stopMicrophone = () => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setIsMicrophoneEnabled(false);
  };

  const testAudioPlayback = async () => {
    try {
      setError(null);

      // Create a test tone
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create oscillator for test tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1; // Low volume

      oscillator.start();
      setIsAudioPlaying(true);

      // Stop after 2 seconds
      setTimeout(() => {
        oscillator.stop();
        setIsAudioPlaying(false);
      }, 2000);
    } catch (err: any) {
      setError(`Audio playback error: ${err.message}`);
      console.error('Audio test failed:', err);
    }
  };

  const testAgentConnection = async () => {
    try {
      setError(null);

      // Test connection to agent backend
      const response = await fetch('https://agentbackend-2932.onrender.com/api/agents');
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      // Agent backend is accessible
      setError(null);
      // Show success in UI instead of alert
      // Successfully connected to agent backend
      setError(`Agent backend connected! Found ${data.agents?.length || 0} agents.`);
    } catch (err: any) {
      setError(`Agent backend connection error: ${err.message}`);
      console.error('Agent connection test failed:', err);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 500 }}>
      <Typography variant="h5" gutterBottom>
        Audio Connection Test
      </Typography>

      {error && (
        <Box sx={{ p: 2, mb: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          onClick={isMicrophoneEnabled ? stopMicrophone : testMicrophone}
          startIcon={isMicrophoneEnabled ? <MicOff /> : <Mic />}
          color={isMicrophoneEnabled ? 'secondary' : 'primary'}
        >
          {isMicrophoneEnabled ? 'Stop Microphone' : 'Test Microphone'}
        </Button>

        <Button
          variant="contained"
          onClick={testAudioPlayback}
          startIcon={isAudioPlaying ? <Volume2 /> : <VolumeX />}
          disabled={isAudioPlaying}
        >
          {isAudioPlaying ? 'Playing Test Tone...' : 'Test Audio Playback'}
        </Button>

        <Button variant="contained" onClick={testAgentConnection} color="success">
          Test Agent Backend Connection
        </Button>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Status:
        </Typography>
        <Typography variant="body2">
          • Microphone: {isMicrophoneEnabled ? '✅ Active' : '❌ Inactive'}
        </Typography>
        <Typography variant="body2">
          • Audio Output: {isAudioPlaying ? '✅ Playing' : '⏸️ Ready'}
        </Typography>
        <Typography variant="body2">
          • Audio Context: {audioContext?.state || 'Not initialized'}
        </Typography>
      </Box>
    </Paper>
  );
}
