import { EventEmitter } from 'events';
import webRTCVoiceService from './webRTCVoiceService';

interface DeepgramConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  version: string;
}

interface AudioBuffer {
  sessionId: string;
  buffer: Int16Array[];
  lastProcessed: number;
}

export class DeepgramBridge extends EventEmitter {
  private deepgramConnections: Map<string, WebSocket> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private config: DeepgramConfig;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.config = {
      apiKey: process.env.REACT_APP_DEEPGRAM_API_KEY || '',
      apiUrl: 'wss://api.deepgram.com/v1/listen',
      model: 'nova-2',
      version: 'latest'
    };

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
    // Buffer audio for batch processing
    if (!this.audioBuffers.has(data.sessionId)) {
      this.audioBuffers.set(data.sessionId, {
        sessionId: data.sessionId,
        buffer: [],
        lastProcessed: Date.now()
      });
    }

    const buffer = this.audioBuffers.get(data.sessionId)!;
    buffer.buffer.push(data.audio);
  }

  private startAudioProcessing(): void {
    // Process audio buffers every 100ms
    this.processingInterval = setInterval(() => {
      this.processAudioBuffers();
    }, 100);
  }

  private processAudioBuffers(): void {
    this.audioBuffers.forEach((buffer, sessionId) => {
      if (buffer.buffer.length === 0) return;

      const deepgramConnection = this.deepgramConnections.get(sessionId);
      if (!deepgramConnection || deepgramConnection.readyState !== WebSocket.OPEN) return;

      // Combine buffered audio chunks
      const totalLength = buffer.buffer.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Int16Array(totalLength);
      let offset = 0;

      buffer.buffer.forEach(chunk => {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
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
    if (this.deepgramConnections.has(sessionId)) {
            return;
    }

    return new Promise((resolve, reject) => {
      // Build URL with parameters
      const params = new URLSearchParams({
        encoding: 'linear16',
        sample_rate: '48000',
        channels: '1',
        language: 'en-US',
        model: this.config.model,
        version: this.config.version,
        punctuate: 'true',
        profanity_filter: 'false',
        redact: 'false',
        diarize: 'false',
        smart_format: 'true',
        utterances: 'false',
        interim_results: 'true',
        endpointing: '200',
        vad_events: 'true'
      });

      // In browser, we include auth token in URL parameters
      params.set('token', this.config.apiKey);
      const url = `${this.config.apiUrl}?${params.toString()}`;
      
      const ws = new WebSocket(url);

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
                this.deepgramConnections.set(sessionId, ws);
        
        // Send keep-alive message periodically
        const keepAlive = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'KeepAlive' }));
          } else {
            clearInterval(keepAlive);
          }
        }, 10000);
        
        this.emit('ready', sessionId);
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data.toString());
          this.handleDeepgramMessage(sessionId, message);
        } catch (error) {
                  }
      };

      ws.onerror = (error) => {
                this.emit('error', { sessionId, error });
        reject(error);
      };

      ws.onclose = () => {
                this.deepgramConnections.delete(sessionId);
        this.audioBuffers.delete(sessionId);
        this.emit('disconnected', sessionId);
      };
    });
  }

  private sendAudioToDeepgram(sessionId: string, audio: Int16Array): void {
    const connection = this.deepgramConnections.get(sessionId);
    if (!connection || connection.readyState !== WebSocket.OPEN) return;

    // Convert Int16Array to ArrayBuffer for binary transmission
    const buffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength);
    connection.send(buffer);
  }

  private handleDeepgramMessage(sessionId: string, message: any): void {
    // Handle standard Deepgram transcription
    if (message.channel) {
      const transcript = message.channel.alternatives[0];
      if (transcript) {
        this.emit('transcript', {
          sessionId,
          text: transcript.transcript,
          isFinal: message.is_final || false,
          confidence: transcript.confidence || 0,
          language: message.channel.language || 'en-US',
          timestamp: Date.now()
        });

        // Send transcript to WebRTC data channel
        const webrtcSession = webRTCVoiceService.getSession(sessionId);
        if (webrtcSession) {
          webRTCVoiceService.sendMetadata(sessionId, {
            type: 'transcript',
            text: transcript.transcript,
            isFinal: message.is_final || false,
            confidence: transcript.confidence || 0
          });
        }
      }
    }

    // Handle VAD (Voice Activity Detection) events
    if (message.speech_final !== undefined) {
      this.emit('speech_final', {
        sessionId,
        duration: message.duration,
        timestamp: Date.now()
      });
    }

    // Handle metadata
    if (message.metadata) {
      this.emit('metadata', {
        sessionId,
        metadata: message.metadata
      });
    }

    // Handle errors
    if (message.type === 'Error') {
      this.emit('error', {
        sessionId,
        error: new Error(message.error || 'Unknown Deepgram error')
      });
    }
  }

  // Simplified emotion detection based on speech patterns
  private detectEmotionFromSpeech(transcript: string, confidence: number): void {
    // This is a placeholder - in production you'd use more sophisticated analysis
    // For now, we can analyze speech patterns, pace, etc.
    // Deepgram doesn't provide emotion detection out of the box
  }

  async sendText(sessionId: string, text: string): Promise<void> {
    // Deepgram is primarily for transcription, not synthesis
    // This method is here for API compatibility but won't do synthesis
        
    // Emit a mock response for compatibility
    this.emit('synthesis', {
      sessionId,
      audio: new Int16Array(0),
      text: text,
      duration: 0
    });
  }

  async disconnect(sessionId: string): Promise<void> {
    const connection = this.deepgramConnections.get(sessionId);
    if (connection) {
      // Send close message
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify({ type: 'CloseStream' }));
      }
      connection.close();
      this.deepgramConnections.delete(sessionId);
    }
    this.audioBuffers.delete(sessionId);
  }

  async disconnectAll(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    const promises = Array.from(this.deepgramConnections.keys()).map(sessionId => 
      this.disconnect(sessionId)
    );
    await Promise.all(promises);
  }

  getActiveConnections(): string[] {
    return Array.from(this.deepgramConnections.keys());
  }

  isConnected(sessionId: string): boolean {
    const connection = this.deepgramConnections.get(sessionId);
    return connection?.readyState === WebSocket.OPEN;
  }

  // Method to match Moshi bridge interface
  async connectToMoshi(sessionId: string): Promise<void> {
    // Redirect to Deepgram
    return this.connectToDeepgram(sessionId);
  }
}

// Export singleton instance
export const deepgramBridge = new DeepgramBridge();

export default deepgramBridge;