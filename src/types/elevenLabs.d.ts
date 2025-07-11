/// <reference types="node" />

import { EventEmitter } from 'events';

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  speakerBoost?: boolean;
}

export interface ElevenLabsStreamOptions {
  voiceId: string;
  modelId?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
  outputFormat?: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
  optimizeStreamingLatency?: number;
}

export interface ElevenLabsAudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  duration?: number;
}

export interface ElevenLabsError {
  type:
    | 'initialization'
    | 'websocket'
    | 'stream-setup'
    | 'audio-processing'
    | 'playback'
    | 'webrtc-connection'
    | 'webrtc-processing'
    | 'voice-test';
  error: Error;
}

export interface ElevenLabsWebRTCEvent {
  sessionId: string;
  agentId: string;
}

export interface ElevenLabsTTSEvents {
  initialized: () => void;
  error: (error: ElevenLabsError) => void;
  'stream-started': () => void;
  'stream-complete': () => void;
  'stream-closed': () => void;
  'audio-chunk': (chunk: ArrayBuffer) => void;
  'playback-started': () => void;
  'playback-stopped': () => void;
  'playback-resumed': () => void;
  'playback-paused': () => void;
  'volume-changed': (volume: number) => void;
  'webrtc-connected': (event: ElevenLabsWebRTCEvent) => void;
  'webrtc-audio-ready': (event: ElevenLabsWebRTCEvent) => void;
}

export declare interface ElevenLabsTTSService extends EventEmitter {
  on<K extends keyof ElevenLabsTTSEvents>(event: K, listener: ElevenLabsTTSEvents[K]): this;
  off<K extends keyof ElevenLabsTTSEvents>(event: K, listener: ElevenLabsTTSEvents[K]): this;
  emit<K extends keyof ElevenLabsTTSEvents>(
    event: K,
    ...args: Parameters<ElevenLabsTTSEvents[K]>
  ): boolean;
  once<K extends keyof ElevenLabsTTSEvents>(event: K, listener: ElevenLabsTTSEvents[K]): this;
}

export interface AvailableVoice {
  agentId: string;
  agentName: string;
  voiceId: string;
}
