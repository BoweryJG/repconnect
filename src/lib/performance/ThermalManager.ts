import { performanceMonitor } from './PerformanceMonitor';
import { adaptiveRenderer } from './AdaptiveRenderer';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export class ThermalManager {
  private batteryLevel: number = 1;
  private isCharging: boolean = false;
  private networkType: 'slow' | 'fast' | 'offline' = 'fast';
  private callbacks: Set<(state: ThermalState) => void> = new Set();
  private performanceUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initBatteryMonitoring();
    this.initNetworkMonitoring();
    this.initPerformanceMonitoring();
  }

  private async initBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery!();
        this.batteryLevel = battery.level;
        this.isCharging = battery.charging;

        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.notifyCallbacks();
        });

        battery.addEventListener('chargingchange', () => {
          this.isCharging = battery.charging;
          this.notifyCallbacks();
        });
      } catch (error) {
        console.warn('Battery API not available');
      }
    }
  }

  private initNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkType = () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g' || effectiveType === '5g') {
          this.networkType = 'fast';
        } else if (effectiveType === '3g' || effectiveType === '2g') {
          this.networkType = 'slow';
        } else {
          this.networkType = 'offline';
        }
        this.notifyCallbacks();
      };

      updateNetworkType();
      connection.addEventListener('change', updateNetworkType);
    }

    // Fallback: monitor online/offline
    window.addEventListener('online', () => {
      this.networkType = 'fast';
      this.notifyCallbacks();
    });

    window.addEventListener('offline', () => {
      this.networkType = 'offline';
      this.notifyCallbacks();
    });
  }

  private initPerformanceMonitoring() {
    let lastPowerSavingTime = 0;
    this.performanceUnsubscribe = performanceMonitor.subscribe((metrics) => {
      // Auto-adjust based on temperature with debouncing
      const now = Date.now();
      if (metrics.temperature === 'critical' && !this.isCharging && now - lastPowerSavingTime > 10000) {
        this.enablePowerSaving();
        lastPowerSavingTime = now;
      }
    });
  }

  private enablePowerSaving() {
    // Quality will be automatically reduced by AdaptiveRenderer
    // based on the temperature metrics from PerformanceMonitor
    console.log('Power saving mode enabled due to thermal conditions');
  }

  public getState(): ThermalState {
    const metrics = performanceMonitor.getMetrics();
    
    // Determine power mode based on multiple factors
    let powerMode: PowerMode = 'balanced';
    
    if (this.batteryLevel < 0.2 && !this.isCharging) {
      powerMode = 'battery-saver';
    } else if (this.batteryLevel > 0.5 && this.isCharging) {
      powerMode = 'performance';
    } else if (metrics.temperature === 'critical') {
      powerMode = 'battery-saver';
    } else if (metrics.temperature === 'cool' && this.networkType === 'fast') {
      powerMode = 'performance';
    }

    return {
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging,
      temperature: metrics.temperature,
      networkType: this.networkType,
      powerMode,
      recommendations: this.getRecommendations(powerMode, metrics.temperature)
    };
  }

  private getRecommendations(powerMode: PowerMode, temperature: string): string[] {
    const recommendations: string[] = [];

    if (powerMode === 'battery-saver') {
      recommendations.push('Reduced visual effects to save battery');
      recommendations.push('Consider plugging in your device');
    }

    if (temperature === 'hot' || temperature === 'critical') {
      recommendations.push('Device is warming up - some effects reduced');
      recommendations.push('Close other apps to improve performance');
    }

    if (this.networkType === 'slow') {
      recommendations.push('Slow network detected - caching enabled');
    }

    return recommendations;
  }

  public subscribe(callback: (state: ThermalState) => void) {
    this.callbacks.add(callback);
    callback(this.getState()); // Initial state
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks() {
    const state = this.getState();
    this.callbacks.forEach(cb => cb(state));
  }

  public destroy() {
    if (this.performanceUnsubscribe) {
      this.performanceUnsubscribe();
    }
    this.callbacks.clear();
  }
}

export interface ThermalState {
  batteryLevel: number;
  isCharging: boolean;
  temperature: 'cool' | 'warm' | 'hot' | 'critical';
  networkType: 'slow' | 'fast' | 'offline';
  powerMode: PowerMode;
  recommendations: string[];
}

export type PowerMode = 'performance' | 'balanced' | 'battery-saver';

export const thermalManager = new ThermalManager();