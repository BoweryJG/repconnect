import { EventEmitter } from 'events';
// @ts-nocheck
// @ts-ignore
import { getAgentList } from '../components/ChatbotLauncher/agents/agentConfigs';

// Global agentConfigs fallback
let agentConfigs: any = {};

interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  wsBaseUrl: string;
  defaultVoiceSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
  };
}

interface StreamOptions {
  voiceId: string;
  modelId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    speakerBoost?: boolean;
  };
  outputFormat?: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
  optimizeStreamingLatency?: number;
}

interface AudioQueueItem {
  audioData: ArrayBuffer;
  timestamp: number;
  duration?: number;
}

export class ElevenLabsTTSService extends EventEmitter {
  private config: ElevenLabsConfig;
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueueItem[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextPlayTime: number = 0;
  private streamBuffer: ArrayBuffer[] = [];
  private isConnected: boolean = false;

  constructor() {
    super();
    this.config = {
      apiKey: process.env.REACT_APP_ELEVENLABS_API_KEY || '',
      baseUrl: 'https://api.elevenlabs.io/v1',
      wsBaseUrl: 'wss://api.elevenlabs.io/v1',
      defaultVoiceSettings: {
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.3,
        speakerBoost: true,
      },
    };
  }

  async initialize(): Promise<void> {
    try {
      // Validate API key is configured
      if (!this.config.apiKey) {
        throw new Error(
          'ElevenLabs API key is not configured. Please set REACT_APP_ELEVENLABS_API_KEY environment variable.'
        );
      }

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume audio context if suspended (for browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.emit('initialized');
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  /**
   * Get voice configuration for a specific agent
   */
  getAgentVoiceConfig(agentId: string): StreamOptions | null {
    const agentConfig = (agentConfigs as any)[agentId];
    if (!agentConfig?.voiceConfig) {
      return null;
    }

    const { voiceId, stability, similarityBoost, style, speakerBoost } = agentConfig.voiceConfig;

    return {
      voiceId,
      voiceSettings: {
        stability,
        similarityBoost,
        style,
        speakerBoost,
      },
      modelId: 'eleven_turbo_v2',
      outputFormat: 'pcm_44100',
      optimizeStreamingLatency: 2, // Optimize for low latency
    };
  }

  /**
   * Stream text-to-speech with WebSocket for real-time voice generation
   */
  async streamTextToSpeech(text: string, agentId: string): Promise<void> {
    const voiceConfig = this.getAgentVoiceConfig(agentId);
    if (!voiceConfig) {
      throw new Error(`No voice configuration found for agent: ${agentId}`);
    }

    return this.streamWithVoice(text, voiceConfig);
  }

  /**
   * Stream text with custom voice configuration
   */
  private async streamWithVoice(text: string, options: StreamOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clean up any existing connection
        if (this.websocket) {
          this.websocket.close();
        }

        // Clear audio queue and reset state
        this.audioQueue = [];
        this.streamBuffer = [];
        this.isPlaying = false;

        // Construct WebSocket URL with model
        const modelId = options.modelId || 'eleven_turbo_v2';
        const wsUrl = `${this.config.wsBaseUrl}/text-to-speech/${options.voiceId}/stream-input?model_id=${modelId}&output_format=${options.outputFormat || 'pcm_44100'}`;

        this.websocket = new WebSocket(wsUrl);
        this.websocket.binaryType = 'arraybuffer';

        this.websocket.onopen = () => {
          this.isConnected = true;
          this.emit('stream-started');

          // Send initial configuration
          const initMessage = {
            text: ' ',
            voice_settings: options.voiceSettings || this.config.defaultVoiceSettings,
            generation_config: {
              chunk_length_schedule: [120, 160, 250, 290],
            },
          };

          this.websocket!.send(JSON.stringify(initMessage));

          // Send the actual text
          const textMessage = {
            text: text,
            flush: true,
          };

          this.websocket!.send(JSON.stringify(textMessage));
        };

        this.websocket.onmessage = async (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Audio data received
            this.streamBuffer.push(event.data);
            this.emit('audio-chunk', event.data);

            // Process audio if we have enough buffered
            if (this.streamBuffer.length >= 2) {
              await this.processAudioBuffer();
            }
          } else {
            // Text message (metadata)
            try {
              const message = JSON.parse(event.data);
              if (message.isFinal) {
                // Flush remaining buffer
                if (this.streamBuffer.length > 0) {
                  await this.processAudioBuffer(true);
                }
                this.emit('stream-complete');
                this.emit('speaking-end');
                resolve();
              }
            } catch (e) {
              // Error parsing WebSocket message - handle silently
            }
          }
        };

        this.websocket.onerror = (error) => {
          this.isConnected = false;
          this.emit('error', { type: 'websocket', error });
          reject(error);
        };

        this.websocket.onclose = () => {
          this.isConnected = false;
          this.emit('stream-closed');
        };
      } catch (error) {
        this.emit('error', { type: 'stream-setup', error });
        reject(error);
      }
    });
  }

  /**
   * Process buffered audio data
   */
  private async processAudioBuffer(_flush: boolean = false): Promise<void> {
    if (!this.audioContext || this.streamBuffer.length === 0) return;

    // Concatenate buffers
    const totalLength = this.streamBuffer.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combinedBuffer = new ArrayBuffer(totalLength);
    const combinedView = new Uint8Array(combinedBuffer);

    let offset = 0;
    for (const buffer of this.streamBuffer) {
      combinedView.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    // Clear processed buffers
    this.streamBuffer = [];

    // Convert PCM to AudioBuffer
    try {
      const audioBuffer = await this.pcmToAudioBuffer(combinedBuffer);

      // Add to queue
      this.audioQueue.push({
        audioData: combinedBuffer,
        timestamp: Date.now(),
        duration: audioBuffer.duration,
      });

      // Start playback if not already playing
      if (!this.isPlaying) {
        this.startPlayback();
      }

      // Play this buffer
      await this.playAudioBuffer(audioBuffer);
    } catch (error) {
      // Error processing audio buffer
      this.emit('error', { type: 'audio-processing', error });
    }
  }

  /**
   * Convert PCM data to AudioBuffer
   */
  private async pcmToAudioBuffer(pcmData: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Assuming PCM 44100Hz, 16-bit mono
    const sampleRate = 44100;
    const numChannels = 1;
    const bytesPerSample = 2;

    const dataView = new DataView(pcmData);
    const length = pcmData.byteLength / bytesPerSample;

    const audioBuffer = this.audioContext.createBuffer(numChannels, length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Convert 16-bit PCM to float32
    for (let i = 0; i < length; i++) {
      const sample = dataView.getInt16(i * bytesPerSample, true);
      channelData[i] = sample / 32768.0;
    }

    return audioBuffer;
  }

  /**
   * Play an AudioBuffer
   */
  private async playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.audioContext) return;

    return new Promise((resolve) => {
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);

      // Schedule playback
      const currentTime = this.audioContext!.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);

      source.onended = () => {
        this.currentSource = null;
        resolve();
      };

      source.start(startTime);
      this.currentSource = source;

      // Update next play time for gapless playback
      this.nextPlayTime = startTime + audioBuffer.duration;
    });
  }

  /**
   * Start audio playback queue processing
   */
  private startPlayback(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.nextPlayTime = this.audioContext?.currentTime || 0;
    this.emit('playback-started');
    this.emit('speaking-start');
  }

  /**
   * Generate speech using standard HTTP API (non-streaming)
   */
  async generateSpeech(text: string, agentId: string): Promise<ArrayBuffer> {
    const agentConfig = (agentConfigs as any)[agentId];
    if (!agentConfig?.voiceConfig) {
      throw new Error(`No voice configuration found for agent: ${agentId}`);
    }

    const { voiceId, stability, similarityBoost, style, speakerBoost } = agentConfig.voiceConfig;

    const response = await fetch(`${this.config.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: speakerBoost,
        },
        output_format: 'mp3_44100_128',
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Play audio from ArrayBuffer
   */
  async playAudio(audioData: ArrayBuffer, format: 'mp3' | 'pcm' = 'mp3'): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      let audioBuffer: AudioBuffer;

      if (format === 'mp3') {
        // Decode MP3 data
        audioBuffer = await this.audioContext!.decodeAudioData(audioData);
      } else {
        // Convert PCM to AudioBuffer
        audioBuffer = await this.pcmToAudioBuffer(audioData);
      }

      // Play the audio
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);

      return new Promise((resolve) => {
        source.onended = () => resolve();
        source.start(0);
        this.currentSource = source;
      });
    } catch (error) {
      this.emit('error', { type: 'playback', error });
      throw error;
    }
  }

  /**
   * Stop current playback
   */
  stopPlayback(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }

    this.audioQueue = [];
    this.streamBuffer = [];
    this.isPlaying = false;
    this.nextPlayTime = 0;

    this.emit('playback-stopped');
  }

  /**
   * Pause/resume playback
   */
  async togglePlayback(): Promise<void> {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      this.emit('playback-resumed');
    } else {
      await this.audioContext.suspend();
      this.emit('playback-paused');
    }
  }

  /**
   * Set playback volume
   */
  setVolume(volume: number): void {
    // Volume is controlled at the destination level
    // For more granular control, we'd need to add a GainNode
    this.emit('volume-changed', volume);
  }

  /**
   * Integration with WebRTC service for real-time voice
   */
  async connectToWebRTC(sessionId: string, agentId: string): Promise<void> {
    try {
      // Get agent voice config
      const voiceConfig = this.getAgentVoiceConfig(agentId);
      if (!voiceConfig) {
        throw new Error(`No voice configuration found for agent: ${agentId}`);
      }

      // Set up WebRTC audio processing pipeline
      this.emit('webrtc-connected', { sessionId, agentId });
    } catch (error) {
      this.emit('error', { type: 'webrtc-connection', error });
      throw error;
    }
  }

  /**
   * Process text for WebRTC streaming
   */
  async processTextForWebRTC(text: string, sessionId: string, agentId: string): Promise<void> {
    try {
      // Stream TTS through WebSocket
      await this.streamTextToSpeech(text, agentId);

      // Audio chunks will be emitted via 'audio-chunk' events
      // WebRTC integration can listen to these events
      this.emit('webrtc-audio-ready', { sessionId, agentId });
    } catch (error) {
      this.emit('error', { type: 'webrtc-processing', error });
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopPlayback();

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.removeAllListeners();
  }

  /**
   * Get list of available voices for all agents
   */
  getAvailableVoices(): Array<{ agentId: string; agentName: string; voiceId: string }> {
    return Object.entries(agentConfigs as any).map(([agentId, config]: [string, any]) => ({
      agentId,
      agentName: (config as any).name,
      voiceId: (config as any).voiceConfig?.voiceId,
    }));
  }

  /**
   * Test voice for a specific agent
   */
  async testAgentVoice(
    agentId: string,
    testText: string = "Hello, I'm here to help you today."
  ): Promise<void> {
    try {
      const audioData = await this.generateSpeech(testText, agentId);
      await this.playAudio(audioData, 'mp3');
    } catch (error) {
      this.emit('error', { type: 'voice-test', error });
      throw error;
    }
  }
}

// Export singleton instance
const elevenLabsTTSInstance = new ElevenLabsTTSService();
export default elevenLabsTTSInstance;

// Export class for testing
export { ElevenLabsTTSService as ElevenLabsTTS };
