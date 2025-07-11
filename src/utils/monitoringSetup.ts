import { initializeSentryFrontend } from '../config/sentryFrontend';
import { performanceMonitor } from './performanceMonitor';
import { alertManager } from '../services/alertingService';

/**
 * Initialize all monitoring services for the frontend
 */
export function initializeMonitoring() {
  // Initialize Sentry
  initializeSentryFrontend();

  // Set up global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // Check if it's a critical error
    if (
      event.error?.name === 'ChunkLoadError' ||
      event.error?.message?.includes('Failed to fetch dynamically imported module')
    ) {
      // Alert user about loading issues
      alertManager.triggerAlert('chunkLoadError', 'frontend.chunk_load_error', 1, {
        error: event.error.message,
        filename: event.filename,
      });
    }
  });

  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // Monitor performance metrics
  if ('PerformanceObserver' in window) {
    // Report Web Vitals when page is about to unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const vitals = performanceMonitor.getWebVitals();
        const summary = performanceMonitor.getSummary();

        // Send beacon with performance data
        if (navigator.sendBeacon) {
          const data = JSON.stringify({
            webVitals: vitals,
            performanceSummary: summary,
            timestamp: new Date().toISOString(),
          });

          navigator.sendBeacon('/api/monitoring/performance', data);
        }
      }
    });
  }

  // Set up periodic health checks for frontend
  setInterval(async () => {
    try {
      const healthResponse = await fetch('/health');
      if (!healthResponse.ok) {
        console.error('Frontend health check failed:', healthResponse.status);
      }
    } catch (error) {
      console.error('Frontend health check error:', error);
    }
  }, 60000); // Check every minute

  // Monitor memory usage
  if ('performance' in window && 'memory' in (performance as any)) {
    setInterval(() => {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const jsHeapSizeLimit = memory.jsHeapSizeLimit;

      const heapUsagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      if (heapUsagePercent > 90) {
        console.warn('High memory usage detected:', heapUsagePercent.toFixed(2) + '%');
        alertManager.triggerAlert('highMemoryUsage', 'frontend.memory_usage', heapUsagePercent, {
          usedJSHeapSize,
          totalJSHeapSize,
          jsHeapSizeLimit,
        });
      }
    }, 30000); // Check every 30 seconds
  }

  console.log('Monitoring services initialized');
}

/**
 * Report custom metrics
 */
export function reportMetric(name: string, value: number, tags?: Record<string, string>) {
  try {
    // Report to performance monitor
    performanceMonitor.reportMetric(name, value);

    // Check against alert thresholds
    alertManager.checkMetric(name, value, tags);
  } catch (error) {
    console.error('Failed to report metric:', error);
  }
}

/**
 * Track user interactions for monitoring
 */
export function trackUserInteraction(
  action: string,
  category: string,
  metadata?: Record<string, any>
) {
  try {
    // Track in Sentry
    trackInteraction(action, category, metadata?.label, metadata?.value);

    // Track performance if it's a measurable interaction
    if (metadata?.measurePerformance) {
      trackInteractionPerformance(`${category}.${action}`, metadata.callback);
    }
  } catch (error) {
    console.error('Failed to track interaction:', error);
  }
}

/**
 * Monitor API calls
 */
export function monitorApiCall(
  url: string,
  method: string,
  startTime: number,
  endTime: number,
  status: number,
  error?: Error
) {
  const duration = endTime - startTime;
  const endpoint = new URL(url, window.location.origin).pathname;

  // Report metrics
  reportMetric(`api.${method.toLowerCase()}.duration`, duration, {
    endpoint,
    status: status.toString(),
  });

  // Check for slow responses
  if (duration > 2000) {
    alertManager.triggerAlert('slowApiResponse', 'api.response_time', duration, {
      endpoint,
      method,
      status,
    });
  }

  // Check for errors
  if (status >= 500 || error) {
    reportMetric('api.error_rate', 1, {
      endpoint,
      method,
      status: status.toString(),
      error: error?.message,
    });
  }
}

// Import dependencies (these should be imported at the top of your main app file)
declare const trackInteraction: any;
declare const trackInteractionPerformance: any;

export default {
  initializeMonitoring,
  reportMetric,
  trackUserInteraction,
  monitorApiCall,
};
