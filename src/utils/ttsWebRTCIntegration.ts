import elevenLabsTTS from '../services/elevenLabsTTS';
import webRTCVoiceService from '../services/webRTCVoiceService';
import { EventEmitter } from 'events';

interface TTSWebRTCConfig {
  sessionId: string;
  agentId: string;
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
}

interface AudioProcessor {
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  destination: MediaStreamAudioDestinationNode;
  gainNode: GainNode;
  stream: MediaStream;
}

export class TTSWebRTCIntegration extends EventEmitter {
  private audioProcessors: Map<string, AudioProcessor> = new Map();
  private activeStreams: Map<string, MediaStream> = new Map();
  
  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for audio chunks from ElevenLabs TTS
    elevenLabsTTS.on('audio-chunk', async (audioData: ArrayBuffer) => {
      // Process and route audio to active WebRTC sessions
      for (const [sessionId, processor] of this.audioProcessors) {
        await this.injectAudioToWebRTC(sessionId, audioData, processor);
      }
    });

    // Listen for WebRTC session events
    webRTCVoiceService.on('session-started', (sessionId: string) => {
      this.emit('integration-ready', sessionId);
    });

    webRTCVoiceService.on('session-ended', (sessionId: string) => {
      this.cleanupSession(sessionId);
    });
  }

  /**
   * Set up TTS integration for a WebRTC session
   */
  async setupTTSForSession(config: TTSWebRTCConfig): Promise<void> {
    const { sessionId, agentId, enableEchoCancellation = true, enableNoiseSuppression = true } = config;
    
    try {
      // Get the WebRTC session
      const session = webRTCVoiceService.getSession(sessionId);
      if (!session) {
        throw new Error(`WebRTC session ${sessionId} not found`);
      }

      // Create audio processing pipeline
      const processor = await this.createAudioProcessor({
        echoCancellation: enableEchoCancellation,
        noiseSuppression: enableNoiseSuppression
      });

      this.audioProcessors.set(sessionId, processor);

      // Connect TTS to WebRTC
      await elevenLabsTTS.connectToWebRTC(sessionId, agentId);

      // Replace or mix the audio stream in the peer connection
      const senders = session.peerConnection.getSenders();
      const audioSender = senders.find(sender => sender.track?.kind === 'audio');
      
      if (audioSender && processor.stream.getAudioTracks().length > 0) {
        await audioSender.replaceTrack(processor.stream.getAudioTracks()[0]);
      }

      this.emit('tts-connected', { sessionId, agentId });
    } catch (error) {
      this.emit('error', { type: 'setup', error, sessionId });
      throw error;
    }
  }

  /**
   * Create audio processing pipeline for TTS audio
   */
  private async createAudioProcessor(options: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
  }): Promise<AudioProcessor> {
    const context = new AudioContext({ sampleRate: 44100 });
    
    // Create gain node for volume control
    const gainNode = context.createGain();
    gainNode.gain.value = 1.0;

    // Create destination for WebRTC
    const destination = context.createMediaStreamDestination();
    
    // Connect gain to destination
    gainNode.connect(destination);

    // Create a source that we'll update with TTS audio
    const oscillator = context.createOscillator();
    oscillator.frequency.value = 0; // Silent by default
    const source = context.createMediaStreamSource(new MediaStream());

    return {
      context,
      source,
      destination,
      gainNode,
      stream: destination.stream
    };
  }

  /**
   * Inject TTS audio into WebRTC stream
   */
  private async injectAudioToWebRTC(
    sessionId: string, 
    audioData: ArrayBuffer,
    processor: AudioProcessor
  ): Promise<void> {
    try {
      // Convert ArrayBuffer to AudioBuffer
      const audioBuffer = await processor.context.decodeAudioData(audioData.slice(0));
      
      // Create buffer source
      const bufferSource = processor.context.createBufferSource();
      bufferSource.buffer = audioBuffer;
      
      // Connect to gain node
      bufferSource.connect(processor.gainNode);
      
      // Schedule playback
      bufferSource.start();
      
      // Clean up when done
      bufferSource.onended = () => {
        bufferSource.disconnect();
      };

      this.emit('audio-injected', { sessionId, duration: audioBuffer.duration });
    } catch (error) {
      console.error('Error injecting audio:', error);
      this.emit('error', { type: 'audio-injection', error, sessionId });
    }
  }

  /**
   * Process text through TTS and stream to WebRTC
   */
  async speakText(sessionId: string, text: string, agentId: string): Promise<void> {
    try {
      const processor = this.audioProcessors.get(sessionId);
      if (!processor) {
        throw new Error(`No audio processor found for session ${sessionId}`);
      }

      // Process text through ElevenLabs TTS
      await elevenLabsTTS.processTextForWebRTC(text, sessionId, agentId);
      
      this.emit('text-processed', { sessionId, textLength: text.length });
    } catch (error) {
      this.emit('error', { type: 'speak-text', error, sessionId });
      throw error;
    }
  }

  /**
   * Set volume for a specific session
   */
  setSessionVolume(sessionId: string, volume: number): void {
    const processor = this.audioProcessors.get(sessionId);
    if (processor) {
      processor.gainNode.gain.value = Math.max(0, Math.min(1, volume));
      this.emit('volume-changed', { sessionId, volume });
    }
  }

  /**
   * Mute/unmute TTS for a session
   */
  setSessionMuted(sessionId: string, muted: boolean): void {
    const processor = this.audioProcessors.get(sessionId);
    if (processor) {
      processor.gainNode.gain.value = muted ? 0 : 1;
      this.emit('mute-changed', { sessionId, muted });
    }
  }

  /**
   * Clean up session resources
   */
  private cleanupSession(sessionId: string): void {
    const processor = this.audioProcessors.get(sessionId);
    if (processor) {
      processor.context.close();
      this.audioProcessors.delete(sessionId);
    }

    const stream = this.activeStreams.get(sessionId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.activeStreams.delete(sessionId);
    }

    this.emit('session-cleaned', sessionId);
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    for (const sessionId of this.audioProcessors.keys()) {
      this.cleanupSession(sessionId);
    }
    
    this.removeAllListeners();
  }

  /**
   * Get active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.audioProcessors.keys());
  }

  /**
   * Check if a session has TTS enabled
   */
  hasActiveTTS(sessionId: string): boolean {
    return this.audioProcessors.has(sessionId);
  }
}

// Export singleton instance
export const ttsWebRTCIntegration = new TTSWebRTCIntegration();

// Example usage function
export async function enableTTSForWebRTCCall(
  sessionId: string,
  agentId: string,
  text: string
): Promise<void> {
  // Set up TTS for the session
  await ttsWebRTCIntegration.setupTTSForSession({
    sessionId,
    agentId,
    enableEchoCancellation: true,
    enableNoiseSuppression: true
  });

  // Speak text through TTS
  await ttsWebRTCIntegration.speakText(sessionId, text, agentId);
}

export default ttsWebRTCIntegration;