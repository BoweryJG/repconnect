import { EventEmitter } from 'events';
import type { StartVoiceSessionResponse } from '../../shared/voice-types';

export class AgentVoiceHandler extends EventEmitter {
  private audioContext: AudioContext;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  
  constructor() {
    super();
    this.audioContext = new AudioContext();
  }
  
  async handleAgentAudio(audioData: ArrayBuffer) {
    try {
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      
      // Add to queue
      this.audioQueue.push(audioBuffer);
      
      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error decoding agent audio:', error);
      this.emit('error', error);
    }
  }
  
  private async playNextInQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.emit('playback-complete');
      return;
    }
    
    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;
    
    // Create source
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    
    // Connect to speakers
    this.currentSource.connect(this.audioContext.destination);
    
    // Handle playback end
    this.currentSource.onended = () => {
      this.playNextInQueue();
    };
    
    // Start playback
    this.currentSource.start();
    this.emit('agent-speaking', true);
  }
  
  pausePlayback() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
      this.isPlaying = false;
      this.audioQueue = [];
      this.emit('agent-speaking', false);
    }
  }
  
  getAudioLevel(): number {
    // Implement real-time audio level monitoring
    return 0.5; // Placeholder
  }
  
  destroy() {
    this.pausePlayback();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

export default AgentVoiceHandler;