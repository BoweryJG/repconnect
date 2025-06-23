export class PerformanceMonitor {
  private fps: number = 60;
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private memory: number = 0;
  private temperature: 'cool' | 'warm' | 'hot' | 'critical' = 'cool';
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private rafId: number | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    const measure = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      
      this.frameCount++;
      
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = now;
        
        this.updateMemory();
        this.updateTemperature();
        this.notifyCallbacks();
      }
      
      this.rafId = requestAnimationFrame(measure);
    };
    
    measure();
  }

  private updateMemory() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.memory = Math.round(memInfo.usedJSHeapSize / 1048576);
    }
  }

  private updateTemperature() {
    // Heuristic based on FPS and memory - adjusted to be less aggressive
    if (this.fps < 20 || this.memory > 500) {
      this.temperature = 'critical';
    } else if (this.fps < 30 || this.memory > 350) {
      this.temperature = 'hot';
    } else if (this.fps < 45 || this.memory > 250) {
      this.temperature = 'warm';
    } else {
      this.temperature = 'cool';
    }
  }

  private notifyCallbacks() {
    const metrics = this.getMetrics();
    this.callbacks.forEach(cb => cb(metrics));
  }

  public getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      memory: this.memory,
      temperature: this.temperature,
      timestamp: Date.now()
    };
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.callbacks.clear();
  }
}

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  temperature: 'cool' | 'warm' | 'hot' | 'critical';
  timestamp: number;
}

export const performanceMonitor = new PerformanceMonitor();