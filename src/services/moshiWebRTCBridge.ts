import webRTCVoiceService from './webRTCVoiceService';
import { EventEmitter } from 'events';

interface MoshiConfig {
  apiUrl: string;
  apiKey: string;
  sampleRate: number;
  language: string;
}

interface AudioBuffer {
  sessionId: string;
  buffer: Int16Array[];
  lastProcessed: number;
}

export class MoshiWebRTCBridge extends EventEmitter {
  private moshiConnections: Map<string, WebSocket> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private config: MoshiConfig;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.config = {
      apiUrl: process.env.REACT_APP_MOSHI_API_URL || 'wss://moshi.kyutai.org/api/v1/stream',
      apiKey: process.env.REACT_APP_MOSHI_API_KEY || '',
      sampleRate: 16000, // Moshi expects 16kHz
      language: 'en-US'
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
    // Resample if necessary (WebRTC uses 48kHz, Moshi expects 16kHz)
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
      if (buffer.buffer.length === 0) return;

      const moshiConnection = this.moshiConnections.get(sessionId);
      if (!moshiConnection || moshiConnection.readyState !== WebSocket.OPEN) return;

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

      // Send to Moshi
      this.sendAudioToMoshi(sessionId, combinedAudio);
    });

    // Clean up stale buffers
    this.audioBuffers.forEach((buffer, sessionId) => {
      if (Date.now() - buffer.lastProcessed > 30000) { // 30 seconds
        this.audioBuffers.delete(sessionId);
      }
    });
  }

  async connectToMoshi(sessionId: string): Promise<void> {
    if (this.moshiConnections.has(sessionId)) {
      console.warn(`Moshi connection already exists for session ${sessionId}`);
      return;
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.config.apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Session-ID': sessionId,
          'X-Sample-Rate': this.config.sampleRate.toString(),
          'X-Language': this.config.language
        }
      });

      ws.on('open', () => {
        console.log(`Connected to Moshi for session ${sessionId}`);
        
        // Send initial configuration
        ws.send(JSON.stringify({
          type: 'config',
          config: {
            sampleRate: this.config.sampleRate,
            channels: 1,
            encoding: 'pcm16',
            language: this.config.language,
            mode: 'conversation',
            features: {
              transcription: true,
              synthesis: true,
              emotion: true,
              interruption: true
            }
          }
        }));

        this.moshiConnections.set(sessionId, ws);
        resolve();
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMoshiMessage(sessionId, message);
        } catch (error) {
          console.error('Error parsing Moshi message:', error);
        }
      });

      ws.on('error', (error) => {
        console.error(`Moshi connection error for session ${sessionId}:`, error);
        this.emit('error', { sessionId, error });
        reject(error);
      });

      ws.on('close', () => {
        console.log(`Moshi connection closed for session ${sessionId}`);
        this.moshiConnections.delete(sessionId);
        this.audioBuffers.delete(sessionId);
        this.emit('disconnected', sessionId);
      });
    });
  }

  private sendAudioToMoshi(sessionId: string, audio: Int16Array): void {
    const connection = this.moshiConnections.get(sessionId);
    if (!connection || connection.readyState !== WebSocket.OPEN) return;

    // Convert Int16Array to base64 for transmission
    const buffer = Buffer.from(audio.buffer);
    const base64Audio = buffer.toString('base64');

    connection.send(JSON.stringify({
      type: 'audio',
      audio: base64Audio,
      encoding: 'pcm16',
      sampleRate: this.config.sampleRate
    }));
  }

  private handleMoshiMessage(sessionId: string, message: any): void {
    switch (message.type) {
      case 'transcript':
        this.handleTranscript(sessionId, message);
        break;
      
      case 'synthesis':
        this.handleSynthesis(sessionId, message);
        break;
      
      case 'emotion':
        this.emit('emotion', {
          sessionId,
          emotion: message.emotion,
          confidence: message.confidence
        });
        break;
      
      case 'ready':
        this.emit('ready', sessionId);
        break;
      
      case 'error':
        this.emit('error', {
          sessionId,
          error: new Error(message.error || 'Unknown Moshi error')
        });
        break;
    }
  }

  private handleTranscript(sessionId: string, message: any): void {
    this.emit('transcript', {
      sessionId,
      text: message.text,
      isFinal: message.isFinal,
      confidence: message.confidence,
      language: message.language,
      timestamp: Date.now()
    });

    // Send transcript to WebRTC data channel
    const webrtcSession = webRTCVoiceService.getSession(sessionId);
    if (webrtcSession) {
      webRTCVoiceService.sendMetadata(sessionId, {
        type: 'transcript',
        text: message.text,
        isFinal: message.isFinal,
        confidence: message.confidence
      });
    }
  }

  private handleSynthesis(sessionId: string, message: any): void {
    // Decode base64 audio
    const audioBuffer = Buffer.from(message.audio, 'base64');
    const int16Audio = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);

    // Resample from 16kHz to 48kHz for WebRTC
    const resampledAudio = this.resampleAudio(int16Audio, this.config.sampleRate, 48000);

    this.emit('synthesis', {
      sessionId,
      audio: resampledAudio,
      text: message.text,
      duration: message.duration
    });

    // TODO: Send synthesized audio back through WebRTC
    // This would require creating a MediaStreamTrack from the audio data
    // and replacing the remote stream in the peer connection
  }

  async sendText(sessionId: string, text: string): Promise<void> {
    const connection = this.moshiConnections.get(sessionId);
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      throw new Error(`No active Moshi connection for session ${sessionId}`);
    }

    connection.send(JSON.stringify({
      type: 'text',
      text: text,
      generateSpeech: true
    }));
  }

  async disconnect(sessionId: string): Promise<void> {
    const connection = this.moshiConnections.get(sessionId);
    if (connection) {
      connection.close();
      this.moshiConnections.delete(sessionId);
    }
    this.audioBuffers.delete(sessionId);
  }

  async disconnectAll(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    const promises = Array.from(this.moshiConnections.keys()).map(sessionId => 
      this.disconnect(sessionId)
    );
    await Promise.all(promises);
  }

  getActiveConnections(): string[] {
    return Array.from(this.moshiConnections.keys());
  }

  isConnected(sessionId: string): boolean {
    const connection = this.moshiConnections.get(sessionId);
    return connection?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const moshiWebRTCBridge = new MoshiWebRTCBridge();

export default moshiWebRTCBridge;