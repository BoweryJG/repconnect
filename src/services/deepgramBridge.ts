import { EventEmitter } from 'events';
import webRTCVoiceService from './webRTCVoiceService';

interface DeepgramConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  version: string;
  features: {
    transcription: boolean;
    synthesis: boolean;
    emotion: boolean;
    moshiProxy: boolean; // Enable Moshi proxy mode
  };
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
      version: 'latest',
      features: {
        transcription: true,
        synthesis: true,
        emotion: true,
        moshiProxy: true // Enable Moshi integration through Deepgram
      }
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
      console.warn(`Deepgram connection already exists for session ${sessionId}`);
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

      // Add Moshi proxy parameters if enabled
      if (this.config.features.moshiProxy) {
        params.append('moshi_proxy', 'true');
        params.append('moshi_api_key', process.env.REACT_APP_MOSHI_API_KEY || '');
        params.append('moshi_features', JSON.stringify({
          synthesis: this.config.features.synthesis,
          emotion: this.config.features.emotion
        }));
      }

      const url = `${this.config.apiUrl}?${params.toString()}`;
      
      const ws = new WebSocket(url, {
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'User-Agent': 'RepConnect/1.0'
        }
      });

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log(`Connected to Deepgram (with Moshi proxy) for session ${sessionId}`);
        this.deepgramConnections.set(sessionId, ws);
        
        // Send keep-alive message
        const keepAlive = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'KeepAlive' }));
          } else {
            clearInterval(keepAlive);
          }
        }, 10000);
        
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data.toString());
          this.handleDeepgramMessage(sessionId, message);
        } catch (error) {
          console.error('Error parsing Deepgram message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`Deepgram connection error for session ${sessionId}:`, error);
        this.emit('error', { sessionId, error });
        reject(error);
      };

      ws.onclose = () => {
        console.log(`Deepgram connection closed for session ${sessionId}`);
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

    // Handle Moshi proxy responses
    if (message.moshi_response) {
      switch (message.moshi_response.type) {
        case 'synthesis':
          this.handleMoshiSynthesis(sessionId, message.moshi_response);
          break;
          
        case 'emotion':
          this.emit('emotion', {
            sessionId,
            emotion: message.moshi_response.emotion,
            confidence: message.moshi_response.confidence
          });
          break;
          
        case 'ready':
          this.emit('ready', sessionId);
          break;
      }
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

  private handleMoshiSynthesis(sessionId: string, moshiResponse: any): void {
    // Decode audio from Moshi response
    const audioBuffer = Buffer.from(moshiResponse.audio, 'base64');
    const int16Audio = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);

    this.emit('synthesis', {
      sessionId,
      audio: int16Audio,
      text: moshiResponse.text,
      duration: moshiResponse.duration
    });
  }

  async sendText(sessionId: string, text: string): Promise<void> {
    const connection = this.deepgramConnections.get(sessionId);
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      throw new Error(`No active Deepgram connection for session ${sessionId}`);
    }

    // Send text for Moshi synthesis through Deepgram proxy
    connection.send(JSON.stringify({
      type: 'InjectText',
      text: text,
      moshi_synthesis: true
    }));
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
}

// Export singleton instance
export const deepgramBridge = new DeepgramBridge();

export default deepgramBridge;