# ElevenLabs TTS Service Documentation

## Overview

The ElevenLabs TTS (Text-to-Speech) service provides real-time voice synthesis capabilities for the RepConnect application. It supports all agent voices defined in the agent configurations and offers both streaming (WebSocket) and standard (HTTP) TTS generation.

## Features

- **Real-time Streaming**: WebSocket-based streaming for low-latency voice synthesis
- **Multiple Voice Support**: Pre-configured voices for all agents (aesthetic, dental, and general)
- **WebRTC Integration**: Seamless integration with existing WebRTC voice service
- **Browser Audio Playback**: Built-in audio playback with volume control
- **Event-Driven Architecture**: Comprehensive event system for monitoring TTS operations
- **Error Handling**: Robust error handling with detailed error types

## Installation

The service is already integrated into the project. The API key is configured in the service constructor.

## Basic Usage

### Initialize the Service

```typescript
import elevenLabsTTS from '@/services/elevenLabsTTS';

// Initialize the service
await elevenLabsTTS.initialize();
```

### Stream Text-to-Speech (Recommended for Real-time)

```typescript
// Stream TTS for a specific agent
await elevenLabsTTS.streamTextToSpeech('Hello, how can I help you today?', 'harvey');

// Listen for audio chunks
elevenLabsTTS.on('audio-chunk', (audioData) => {
  console.log('Received audio chunk:', audioData.byteLength, 'bytes');
});

// Listen for completion
elevenLabsTTS.on('stream-complete', () => {
  console.log('TTS streaming complete');
});
```

### Generate Speech (Standard HTTP)

```typescript
// Generate complete audio file
const audioData = await elevenLabsTTS.generateSpeech('Hello!', 'botox');

// Play the generated audio
await elevenLabsTTS.playAudio(audioData, 'mp3');
```

## Agent Voice Configurations

Each agent has a pre-configured voice with optimized settings:

| Agent ID | Agent Name | Voice ID | Description |
|----------|------------|----------|-------------|
| harvey | Harvey | nPczCjzI2devNBz1zQrb | Professional, clear voice |
| botox | Dr. Bella | EXAVITQu4vr4xnSDxMaL | Professional female voice |
| fillers | Dr. Sophia | jsCqWAovK2LkecY7zXl4 | Warm, friendly voice |
| skincare | Dr. Luna | XB0fDUnXU5powFXDhCwa | Clear, informative voice |
| laser | Dr. Ray | TxGEqnHWrfWFTfGW9XjX | Clear, confident voice |
| bodycontouring | Dr. Sculpt | flq6f7yk4E4fJM5XTYuZ | Energetic, motivational voice |
| implants | Dr. Anchor | VR6AewLTigWG4xSOukaG | Professional, trustworthy voice |
| orthodontics | Dr. Align | yoZ06aMxZJJ28mfd3POQ | Friendly, upbeat voice |
| cosmetic | Dr. Bright | SOYHLrjzK2X1ezoPC6cr | Warm, artistic voice |

## WebRTC Integration

### Basic Integration

```typescript
import ttsWebRTCIntegration from '@/utils/ttsWebRTCIntegration';

// Set up TTS for a WebRTC session
await ttsWebRTCIntegration.setupTTSForSession({
  sessionId: 'session-123',
  agentId: 'harvey',
  enableEchoCancellation: true,
  enableNoiseSuppression: true
});

// Speak text through the WebRTC connection
await ttsWebRTCIntegration.speakText('session-123', 'Hello!', 'harvey');
```

### Advanced Integration Example

```typescript
// In your WebRTC component
import elevenLabsTTS from '@/services/elevenLabsTTS';
import webRTCVoiceService from '@/services/webRTCVoiceService';

class VoiceCallComponent {
  async startCallWithTTS(agentId: string) {
    // Start WebRTC session
    const session = await webRTCVoiceService.startVoiceSession('call-123');
    
    // Connect TTS to WebRTC
    await elevenLabsTTS.connectToWebRTC(session.id, agentId);
    
    // Process agent responses
    elevenLabsTTS.on('audio-chunk', (audioData) => {
      // Audio is automatically routed to WebRTC
    });
    
    // Speak through agent
    await elevenLabsTTS.processTextForWebRTC(
      'Hello! I am Dr. Harvey. How can I assist you today?',
      session.id,
      agentId
    );
  }
}
```

## Event Handling

The service emits various events for monitoring and control:

```typescript
// Success events
elevenLabsTTS.on('initialized', () => {
  console.log('TTS service initialized');
});

elevenLabsTTS.on('stream-started', () => {
  console.log('TTS streaming started');
});

elevenLabsTTS.on('stream-complete', () => {
  console.log('TTS streaming complete');
});

elevenLabsTTS.on('playback-started', () => {
  console.log('Audio playback started');
});

// Error handling
elevenLabsTTS.on('error', (error) => {
  console.error(`TTS Error (${error.type}):`, error.error);
});
```

## Playback Control

```typescript
// Stop current playback
elevenLabsTTS.stopPlayback();

// Pause/Resume playback
await elevenLabsTTS.togglePlayback();

// Set volume (0-1)
elevenLabsTTS.setVolume(0.8);
```

## Testing Voices

```typescript
// Test a specific agent's voice
await elevenLabsTTS.testAgentVoice('harvey', 'This is a test message.');

// Get all available voices
const voices = elevenLabsTTS.getAvailableVoices();
console.log(voices);
// Output: [{ agentId: 'harvey', agentName: 'Harvey', voiceId: 'nPczCjzI2devNBz1zQrb' }, ...]
```

## Error Types

The service emits errors with specific types for better error handling:

- `initialization`: Service initialization failed
- `websocket`: WebSocket connection error
- `stream-setup`: Stream configuration error
- `audio-processing`: Audio decoding/processing error
- `playback`: Audio playback error
- `webrtc-connection`: WebRTC integration error
- `webrtc-processing`: WebRTC audio processing error
- `voice-test`: Voice testing error

## Best Practices

1. **Always Initialize**: Call `initialize()` before using any TTS features
2. **Use Streaming for Real-time**: Prefer `streamTextToSpeech()` for interactive conversations
3. **Handle Events**: Always set up event listeners for error handling
4. **Clean Up**: Call `dispose()` when done to free resources
5. **Volume Control**: Provide user controls for volume adjustment
6. **Agent Selection**: Use the appropriate agent voice for the context

## Resource Cleanup

```typescript
// Clean up when component unmounts or app closes
elevenLabsTTS.dispose();
```

## Demo Component

A demo component is available at `src/components/ElevenLabsTTSDemo.tsx` that demonstrates all features of the TTS service.

## Security Note

The API key is currently hardcoded in the service. In production, this should be:
1. Stored in environment variables
2. Fetched from a secure backend endpoint
3. Rotated regularly

## Performance Considerations

- WebSocket streaming provides lower latency than HTTP generation
- Audio is buffered for smooth playback
- PCM format (44.1kHz) is used for highest quality
- The service supports concurrent TTS operations for multiple agents