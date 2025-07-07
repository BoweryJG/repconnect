import { createClient, LiveTranscriptionEvents, DeepgramClient, LiveClient } from '@deepgram/sdk';
import webRTCVoiceService from './webRTCVoiceService';
import { EventEmitter } from 'events';

interface DeepgramConfig {
  apiKey: string;
  model: string;
  language: string;
  sampleRate: number;
}

interface AudioBuffer {
  sessionId: string;
  buffer: Int16Array[];
  lastProcessed: number;
}

export class DeepgramWebRTCBridge extends EventEmitter {
  private deepgram: DeepgramClient;
  private liveConnections: Map<string, LiveClient> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private config: DeepgramConfig;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.config = {
      apiKey: process.env.REACT_APP_DEEPGRAM_API_KEY || '',
      model: 'nova-2',
      language: 'en-US',
      sampleRate: 16000
    };

    // Initialize Deepgram client
    this.deepgram = createClient(this.config.apiKey);

    this.setupWebRTCAudioHandler();
    this.startAudioProcessing();
  }

  private setupWebRTCAudioHandler(): void {
    // Listen for audio data from WebRTC service
    webRTCVoiceService.on('audio-data', (data: {
      sessionId: string;
      audio: Int16Array;
      sampleRate: number;
      timestamp: number;
    }) => {
      this.handleWebRTCAudio(data);
    });
  }

  private handleWebRTCAudio(data: {
    sessionId: string;
    audio: Int16Array;
    sampleRate: number;
    timestamp: number;
  }): void {
    // Resample if necessary (WebRTC uses 48kHz, Deepgram can handle various rates)
    const resampledAudio = this.resampleAudio(data.audio, data.sampleRate, this.config.sampleRate);
    
    // Buffer audio for batch processing
    if (!this.audioBuffers.has(data.sessionId)) {
      this.audioBuffers.set(data.sessionId, {
        sessionId: data.sessionId,
        buffer: [],
        lastProcessed: Date.now()
      });
    }

    const buffer = this.audioBuffers.get(data.sessionId)!;
    buffer.buffer.push(resampledAudio);
  }

  private resampleAudio(input: Int16Array, inputRate: number, outputRate: number): Int16Array {
    if (!input || input.length === 0) {
      return new Int16Array(0);
    }
    
    if (inputRate === outputRate) {
      return input;
    }

    const ratio = inputRate / outputRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const inputIndex = Math.floor(i * ratio);
      output[i] = input[inputIndex];
    }

    return output;
  }

  private startAudioProcessing(): void {
    // Process audio buffers every 100ms
    this.processingInterval = setInterval(() => {
      this.processAudioBuffers();
    }, 100);
  }

  private processAudioBuffers(): void {
    this.audioBuffers.forEach((buffer, sessionId) => {
      if (!buffer || !buffer.buffer || buffer.buffer.length === 0) return;

      const connection = this.liveConnections.get(sessionId);
      if (!connection) return;

      // Combine buffered audio chunks
      const totalLength = buffer.buffer.reduce((sum, chunk) => sum + (chunk?.length || 0), 0);
      const combinedAudio = new Int16Array(totalLength);
      let offset = 0;

      buffer.buffer.forEach(chunk => {
        if (chunk && chunk.length > 0) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
      });

      // Clear buffer
      buffer.buffer = [];
      buffer.lastProcessed = Date.now();

      // Send to Deepgram
      this.sendAudioToDeepgram(sessionId, combinedAudio);
    });

    // Clean up stale buffers
    this.audioBuffers.forEach((buffer, sessionId) => {
      if (Date.now() - buffer.lastProcessed > 30000) { // 30 seconds
        this.audioBuffers.delete(sessionId);
      }
    });
  }

  async connectToDeepgram(sessionId: string): Promise<void> {
    if (this.liveConnections.has(sessionId)) {
            return;
    }

    try {
      // Create live transcription connection
      const connection = this.deepgram.listen.live({
        model: this.config.model,
        language: this.config.language,
        punctuate: true,
        smart_format: true,
        encoding: 'linear16',
        sample_rate: this.config.sampleRate,
        channels: 1,
        endpointing: 300,
        interim_results: true,
        utterance_end_ms: 1000,
        vad_events: true,
        diarize: true
      });

      // Set up event handlers
      connection.on(LiveTranscriptionEvents.Open, () => {
                this.emit('connected', sessionId);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        this.handleTranscript(sessionId, data);
      });

      connection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
        this.emit('utterance-end', {
          sessionId,
          ...data
        });
      });

      connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
        this.emit('speech-started', sessionId);
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
                this.emit('error', { sessionId, error });
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
                this.liveConnections.delete(sessionId);
        this.audioBuffers.delete(sessionId);
        this.emit('disconnected', sessionId);
      });

      this.liveConnections.set(sessionId, connection);
      
      // Connection starts automatically when created with deepgram.listen.live()
    } catch (error) {
            throw error;
    }
  }

  private sendAudioToDeepgram(sessionId: string, audio: Int16Array): void {
    const connection = this.liveConnections.get(sessionId);
    if (!connection) return;

    // Convert Int16Array to Buffer for Deepgram
    const buffer = Buffer.from(audio.buffer);
    connection.send(buffer);
  }

  private handleTranscript(sessionId: string, data: any): void {
    const transcript = data.channel?.alternatives?.[0];
    if (!transcript) return;

    // Extract speaker info if available
    const speaker = transcript.words?.[0]?.speaker || 'unknown';

    this.emit('transcript', {
      sessionId,
      text: transcript.transcript,
      isFinal: data.is_final || false,
      confidence: transcript.confidence || 0,
      language: data.channel?.alternatives?.[0]?.language || this.config.language,
      timestamp: Date.now(),
      speaker,
      words: transcript.words || []
    });

    // Send transcript to WebRTC data channel
    const webrtcSession = webRTCVoiceService.getSession(sessionId);
    if (webrtcSession) {
      webRTCVoiceService.sendMetadata(sessionId, {
        type: 'transcript',
        text: transcript.transcript,
        isFinal: data.is_final || false,
        confidence: transcript.confidence,
        speaker
      });
    }
  }

  // Voice Agent API integration (for full conversational AI)
  async startVoiceAgent(sessionId: string, config?: {
    agent?: string;
    model?: string;
    voice?: string;
  }): Promise<void> {
    try {
      // Note: Deepgram Voice Agent API is still in beta
      // This is a placeholder for when it's fully available
            
      // For now, we'll use transcription + separate TTS
      await this.connectToDeepgram(sessionId);
    } catch (error) {
            throw error;
    }
  }

  // Text-to-Speech integration
  async synthesizeSpeech(sessionId: string, text: string): Promise<ArrayBuffer> {
    try {
      // For now, we'll skip TTS implementation since it's not critical for WebRTC voice
      // Deepgram SDK v4 TTS API is different and would need proper implementation
            
      // Return empty audio buffer
      const emptyBuffer = new ArrayBuffer(0);
      
      this.emit('synthesis', {
        sessionId,
        audio: new Uint8Array(emptyBuffer),
        text
      });

      return emptyBuffer;
    } catch (error) {
            throw error;
    }
  }

  async sendText(sessionId: string, text: string): Promise<void> {
    // For Deepgram, we don't send text directly to the transcription service
    // Instead, we emit it as a coaching message for the UI
    this.emit('coaching-message', {
      sessionId,
      text,
      timestamp: Date.now()
    });
    
    // Optionally, we could use Deepgram's TTS here to convert text to speech
    // For now, we'll just emit the text for UI display
  }

  async disconnect(sessionId: string): Promise<void> {
    const connection = this.liveConnections.get(sessionId);
    if (connection) {
      connection.finish();
      this.liveConnections.delete(sessionId);
    }
    this.audioBuffers.delete(sessionId);
  }

  async disconnectAll(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    const promises = Array.from(this.liveConnections.keys()).map(sessionId => 
      this.disconnect(sessionId)
    );
    await Promise.all(promises);
  }

  getActiveConnections(): string[] {
    return Array.from(this.liveConnections.keys());
  }

  isConnected(sessionId: string): boolean {
    return this.liveConnections.has(sessionId);
  }
}

// Export singleton instance
export const deepgramWebRTCBridge = new DeepgramWebRTCBridge();

export default deepgramWebRTCBridge;