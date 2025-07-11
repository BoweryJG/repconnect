// Voice Metrics Service - Real-time voice analysis for the War Room
import { harveyWebRTC } from './harveyWebRTC';

export interface VoiceMetrics {
  pace: 'slow' | 'normal' | 'fast';
  tone: 'nervous' | 'confident' | 'aggressive' | 'uncertain';
  volume: number; // 0-100
  talkRatio: number; // 0-100, percentage of time rep is talking
  pitch: number; // Average pitch frequency
  clarity: number; // 0-100, speech clarity score
  fillerWords: number; // Count of filler words per minute
  interruptions: number; // Count of interruptions
}

export interface VoiceAnalysisResult {
  metrics: VoiceMetrics;
  confidence: number; // 0-100
  sentiment: number; // -1 to 1
  keywords: string[]; // Important keywords detected
  warnings: string[]; // Real-time warnings (e.g., "Speaking too fast", "Low energy")
}

class VoiceMetricsService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private analysisInterval: NodeJS.Timeout | null = null;
  private talkingHistory: boolean[] = [];
  private pitchHistory: number[] = [];
  private volumeHistory: number[] = [];
  private fillerWordCount = 0;
  private interruptionCount = 0;
  private lastSpeechTime = 0;
  private callbacks: ((analysis: VoiceAnalysisResult) => void)[] = [];

  // Filler words to detect
  private readonly FILLER_WORDS = [
    'um',
    'uh',
    'like',
    'you know',
    'basically',
    'actually',
    'literally',
  ];

  // Speech detection threshold
  private readonly VOLUME_THRESHOLD = 20;
  private readonly SPEECH_GAP_THRESHOLD = 500; // ms

  async startAnalysis(stream: MediaStream): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect stream to analyser
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.analyser);

      // Start analysis loop
      this.startAnalysisLoop();
    } catch (error) {
      // Failed to start voice analysis - handle silently
    }
  }

  private startAnalysisLoop(): void {
    const bufferLength = this.analyser!.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);

    this.analysisInterval = setInterval(() => {
      if (!this.analyser) return;

      // Get time domain data for volume analysis
      this.analyser.getByteTimeDomainData(dataArray);

      // Get frequency data for pitch analysis
      this.analyser.getFloatFrequencyData(frequencyData);

      // Analyze voice characteristics
      const volume = this.calculateVolume(dataArray);
      const pitch = this.calculatePitch(frequencyData);
      const isTalking = volume > this.VOLUME_THRESHOLD;

      // Update histories
      this.volumeHistory.push(volume);
      if (this.volumeHistory.length > 100) this.volumeHistory.shift();

      this.pitchHistory.push(pitch);
      if (this.pitchHistory.length > 100) this.pitchHistory.shift();

      this.talkingHistory.push(isTalking);
      if (this.talkingHistory.length > 300) this.talkingHistory.shift(); // 30 seconds at 10Hz

      // Detect interruptions
      if (isTalking && Date.now() - this.lastSpeechTime > this.SPEECH_GAP_THRESHOLD) {
        this.interruptionCount++;
      }

      if (isTalking) {
        this.lastSpeechTime = Date.now();
      }

      // Calculate metrics
      const metrics = this.calculateMetrics();
      const confidence = this.calculateConfidence(metrics);
      const sentiment = this.calculateSentiment(metrics, pitch);
      const warnings = this.generateWarnings(metrics);

      // Create analysis result
      const analysis: VoiceAnalysisResult = {
        metrics,
        confidence,
        sentiment,
        keywords: [], // Would be populated by speech-to-text service
        warnings,
      };

      // Notify listeners
      this.notifyListeners(analysis);
    }, 100); // Analyze 10 times per second
  }

  private calculateVolume(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(100, Math.round(rms * 200));
  }

  private calculatePitch(frequencyData: Float32Array): number {
    // Find dominant frequency using autocorrelation would be more accurate
    // This is a simplified approach
    let maxValue = -Infinity;
    let maxIndex = 0;

    for (let i = 0; i < frequencyData.length / 2; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }

    const nyquist = this.audioContext!.sampleRate / 2;
    const frequency = (maxIndex / frequencyData.length) * nyquist;

    return frequency;
  }

  private calculateMetrics(): VoiceMetrics {
    // Calculate talk ratio
    const talkRatio =
      this.talkingHistory.length > 0
        ? (this.talkingHistory.filter((t) => t).length / this.talkingHistory.length) * 100
        : 50;

    // Calculate average volume
    const avgVolume =
      this.volumeHistory.length > 0
        ? this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length
        : 50;

    // Calculate average pitch
    const avgPitch =
      this.pitchHistory.length > 0
        ? this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length
        : 150;

    // Determine pace based on interruption frequency
    let pace: VoiceMetrics['pace'] = 'normal';
    if (this.interruptionCount > 10) pace = 'fast';
    else if (this.interruptionCount < 3) pace = 'slow';

    // Determine tone based on pitch and volume patterns
    let tone: VoiceMetrics['tone'] = 'confident';
    if (avgPitch > 200 && avgVolume < 40) tone = 'nervous';
    else if (avgVolume > 70) tone = 'aggressive';
    else if (avgVolume < 30) tone = 'uncertain';

    // Calculate clarity (simplified - would use speech recognition confidence)
    const volumeVariance = this.calculateVariance(this.volumeHistory);
    const clarity = Math.max(0, Math.min(100, 100 - volumeVariance));

    return {
      pace,
      tone,
      volume: Math.round(avgVolume),
      talkRatio: Math.round(talkRatio),
      pitch: Math.round(avgPitch),
      clarity: Math.round(clarity),
      fillerWords: this.fillerWordCount,
      interruptions: this.interruptionCount,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateConfidence(metrics: VoiceMetrics): number {
    let confidence = 50;

    // Positive factors
    if (metrics.tone === 'confident') confidence += 20;
    if (metrics.pace === 'normal') confidence += 10;
    if (metrics.clarity > 70) confidence += 10;
    if (metrics.talkRatio >= 40 && metrics.talkRatio <= 60) confidence += 10;

    // Negative factors
    if (metrics.tone === 'nervous') confidence -= 20;
    if (metrics.tone === 'uncertain') confidence -= 15;
    if (metrics.pace === 'fast') confidence -= 10;
    if (metrics.fillerWords > 5) confidence -= 10;
    if (metrics.interruptions > 5) confidence -= 5;

    return Math.max(0, Math.min(100, confidence));
  }

  private calculateSentiment(metrics: VoiceMetrics, pitch: number): number {
    // Simplified sentiment calculation based on voice characteristics
    let sentiment = 0;

    if (metrics.tone === 'confident') sentiment += 0.3;
    if (metrics.tone === 'aggressive') sentiment -= 0.2;
    if (metrics.tone === 'nervous') sentiment -= 0.3;

    // Higher pitch often indicates positive emotion
    if (pitch > 180) sentiment += 0.1;
    if (pitch < 120) sentiment -= 0.1;

    // Normal pace is positive
    if (metrics.pace === 'normal') sentiment += 0.2;

    return Math.max(-1, Math.min(1, sentiment));
  }

  private generateWarnings(metrics: VoiceMetrics): string[] {
    const warnings: string[] = [];

    if (metrics.pace === 'fast') {
      warnings.push('Speaking too fast - slow down');
    }
    if (metrics.tone === 'nervous') {
      warnings.push('Nervousness detected - take a breath');
    }
    if (metrics.tone === 'aggressive') {
      warnings.push('Tone too aggressive - soften approach');
    }
    if (metrics.volume > 80) {
      warnings.push('Volume too high');
    }
    if (metrics.volume < 20) {
      warnings.push('Speaking too softly');
    }
    if (metrics.talkRatio > 70) {
      warnings.push('Talking too much - let them speak');
    }
    if (metrics.talkRatio < 30) {
      warnings.push('Not talking enough - engage more');
    }
    if (metrics.fillerWords > 5) {
      warnings.push('Too many filler words');
    }

    return warnings;
  }

  onAnalysis(callback: (analysis: VoiceAnalysisResult) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(analysis: VoiceAnalysisResult): void {
    this.callbacks.forEach((cb) => cb(analysis));
  }

  // Process speech-to-text results for filler words
  processSpeechText(text: string): void {
    const lowerText = text.toLowerCase();
    this.FILLER_WORDS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        this.fillerWordCount += matches.length;
      }
    });
  }

  reset(): void {
    this.talkingHistory = [];
    this.pitchHistory = [];
    this.volumeHistory = [];
    this.fillerWordCount = 0;
    this.interruptionCount = 0;
    this.lastSpeechTime = 0;
  }

  stop(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.reset();
  }
}

export const voiceMetricsService = new VoiceMetricsService();
