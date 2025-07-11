import { captureSentryMetric, performanceMonitoring } from '../config/sentryFrontend';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'navigation' | 'resource' | 'measure' | 'mark';
  metadata?: Record<string, any>;
}

interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

/**
 * Frontend Performance Monitor
 */
export class FrontendPerformanceMonitor {
  private observers: Map<string, PerformanceObserver> = new Map();
  private metrics: Map<string, number[]> = new Map();
  private webVitals: WebVitalsMetrics = {};
  private resourceTimings: Map<string, PerformanceEntry[]> = new Map();

  constructor() {
    this.initializeObservers();
    this.trackWebVitals();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        // Observe navigation entries
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);

        // Observe resource timings
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);

        // Observe user timings
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processMeasureEntry(entry);
          }
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);
      } catch (error) {
        console.error('Failed to initialize performance observers:', error);
      }
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackWebVitals(): void {
    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.webVitals.FCP = entry.startTime;
              this.reportMetric('web_vitals.fcp', entry.startTime);
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', fcpObserver);
      } catch (error) {
        console.error('Failed to track FCP:', error);
      }
    }

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.webVitals.LCP = lastEntry.startTime;
          this.reportMetric('web_vitals.lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.error('Failed to track LCP:', error);
      }
    }

    // First Input Delay (FID) - using a polyfill approach
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-input') {
              const fid = entry.processingStart - entry.startTime;
              this.webVitals.FID = fid;
              this.reportMetric('web_vitals.fid', fid);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('first-input', fidObserver);
      } catch (error) {
        // Fallback for browsers that don't support first-input
        this.trackFirstInputDelay();
      }
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        let clsEntries: any[] = [];

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          }
          this.webVitals.CLS = clsValue;
          this.reportMetric('web_vitals.cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', clsObserver);
      } catch (error) {
        console.error('Failed to track CLS:', error);
      }
    }
  }

  /**
   * Fallback method to track First Input Delay
   */
  private trackFirstInputDelay(): void {
    let firstInputDetected = false;

    const listener = (event: Event) => {
      if (firstInputDetected) return;

      const now = performance.now();
      const eventTime = event.timeStamp;

      if (eventTime < now) {
        const fid = now - eventTime;
        this.webVitals.FID = fid;
        this.reportMetric('web_vitals.fid', fid);
        firstInputDetected = true;

        // Remove listeners
        ['click', 'keydown', 'mousedown', 'touchstart'].forEach((type) => {
          window.removeEventListener(type, listener, true);
        });
      }
    };

    ['click', 'keydown', 'mousedown', 'touchstart'].forEach((type) => {
      window.addEventListener(type, listener, true);
    });
  }

  /**
   * Process navigation timing entry
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.fetchStart,
      download: entry.responseEnd - entry.responseStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      domComplete: entry.domComplete - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart,
    };

    this.webVitals.TTFB = metrics.ttfb;

    // Report metrics
    Object.entries(metrics).forEach(([key, value]) => {
      this.reportMetric(`navigation.${key}`, value);
    });
  }

  /**
   * Process resource timing entry
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);

    if (!this.resourceTimings.has(resourceType)) {
      this.resourceTimings.set(resourceType, []);
    }

    this.resourceTimings.get(resourceType)!.push({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      type: 'resource',
      metadata: {
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      },
    });

    // Report aggregate metrics
    this.reportMetric(`resource.${resourceType}.duration`, entry.duration);
    this.reportMetric(`resource.${resourceType}.size`, entry.transferSize);
  }

  /**
   * Process measure entry
   */
  private processMeasureEntry(entry: PerformanceEntry): void {
    this.reportMetric(`measure.${entry.name}`, entry.duration);

    // Track in Sentry
    performanceMonitoring.startSpan('measure', entry.name)?.finish();
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (url.match(/\.(css|scss|sass)$/)) return 'style';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Report metric to monitoring system
   */
  private reportMetric(name: string, value: number): void {
    // Store locally
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Report to Sentry
    captureSentryMetric(name, value, 'millisecond');
  }

  /**
   * Mark a custom timing
   */
  mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): void {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
    } catch (error) {
      console.error('Failed to create measure:', error);
    }
  }

  /**
   * Get current Web Vitals
   */
  getWebVitals(): WebVitalsMetrics {
    return { ...this.webVitals };
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {
      webVitals: this.getWebVitals(),
      resources: {},
      metrics: {},
    };

    // Aggregate resource timings
    for (const [type, entries] of this.resourceTimings.entries()) {
      const durations = entries.map((e) => e.duration);
      summary.resources[type] = {
        count: entries.length,
        totalDuration: durations.reduce((a, b) => a + b, 0),
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
      };
    }

    // Aggregate custom metrics
    for (const [name, values] of this.metrics.entries()) {
      summary.metrics[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95),
      };
    }

    return summary;
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics.clear();
    this.resourceTimings.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new FrontendPerformanceMonitor();

/**
 * React component performance tracking hook
 */
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startMark = `${componentName}-mount-start`;
    const endMark = `${componentName}-mount-end`;

    performanceMonitor.mark(startMark);

    return () => {
      performanceMonitor.mark(endMark);
      performanceMonitor.measure(`${componentName}-mount`, startMark, endMark);
    };
  }, [componentName]);
}

/**
 * Track interaction performance
 */
export function trackInteractionPerformance(
  interactionName: string,
  callback: () => void | Promise<void>
): void {
  const startMark = `${interactionName}-start`;
  const endMark = `${interactionName}-end`;

  performanceMonitor.mark(startMark);

  const result = callback();

  if (result instanceof Promise) {
    result.finally(() => {
      performanceMonitor.mark(endMark);
      performanceMonitor.measure(interactionName, startMark, endMark);
    });
  } else {
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(interactionName, startMark, endMark);
  }
}

// Import React hooks (these should be imported at the top of your component files)
declare const useEffect: any;

export default {
  FrontendPerformanceMonitor,
  performanceMonitor,
  usePerformanceTracking,
  trackInteractionPerformance,
};
