import { performanceMonitor, PerformanceMetrics } from './PerformanceMonitor';

export interface QualitySettings {
  particleCount: number;
  blurQuality: 'high' | 'medium' | 'low';
  shadowResolution: number;
  animationFPS: 60 | 30;
  enableGlassEffects: boolean;
  enable3D: boolean;
  textureQuality: 'high' | 'medium' | 'low';
}

export class AdaptiveRenderer {
  private currentQuality: QualitySettings = {
    particleCount: 2500,
    blurQuality: 'medium',
    shadowResolution: 1024,
    animationFPS: 60,
    enableGlassEffects: true,
    enable3D: true,
    textureQuality: 'medium',
  };

  private qualityPresets = {
    ultra: {
      particleCount: 5000,
      blurQuality: 'high' as const,
      shadowResolution: 2048,
      animationFPS: 60 as const,
      enableGlassEffects: true,
      enable3D: true,
      textureQuality: 'high' as const,
    },
    high: {
      particleCount: 2500,
      blurQuality: 'medium' as const,
      shadowResolution: 1024,
      animationFPS: 60 as const,
      enableGlassEffects: true,
      enable3D: true,
      textureQuality: 'medium' as const,
    },
    medium: {
      particleCount: 1000,
      blurQuality: 'low' as const,
      shadowResolution: 512,
      animationFPS: 30 as const,
      enableGlassEffects: true,
      enable3D: true,
      textureQuality: 'low' as const,
    },
    low: {
      particleCount: 500,
      blurQuality: 'low' as const,
      shadowResolution: 256,
      animationFPS: 30 as const,
      enableGlassEffects: false,
      enable3D: false,
      textureQuality: 'low' as const,
    },
  };

  private callbacks: Set<(_settings: QualitySettings) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.startAdaptiveRendering();
  }

  private startAdaptiveRendering() {
    this.unsubscribe = performanceMonitor.subscribe((metrics) => {
      this.adjustQuality(metrics);
    });
  }

  private adjustQuality(metrics: PerformanceMetrics) {
    let newQuality: QualitySettings;

    switch (metrics.temperature) {
      case 'cool':
        newQuality = this.qualityPresets.ultra;
        break;
      case 'warm':
        newQuality = this.qualityPresets.high;
        break;
      case 'hot':
        newQuality = this.qualityPresets.medium;
        break;
      case 'critical':
        newQuality = this.qualityPresets.low;
        break;
    }

    // Additional FPS-based adjustments
    if (metrics.fps < 30) {
      newQuality.animationFPS = 30;
      newQuality.particleCount = Math.floor(newQuality.particleCount * 0.5);
    }

    if (JSON.stringify(newQuality) !== JSON.stringify(this.currentQuality)) {
      this.currentQuality = newQuality;
      this.notifyCallbacks();
    }
  }

  public getQuality(): QualitySettings {
    return { ...this.currentQuality };
  }

  public subscribe(callback: (_settings: QualitySettings) => void) {
    this.callbacks.add(callback);
    callback(this.currentQuality); // Initial state
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks() {
    this.callbacks.forEach((cb) => cb(this.currentQuality));
  }

  public destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.callbacks.clear();
  }
}

export const adaptiveRenderer = new AdaptiveRenderer();
