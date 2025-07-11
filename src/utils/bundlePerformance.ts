/**
 * Bundle Performance Monitoring
 * Tracks and reports on code splitting effectiveness
 */

interface ChunkLoadMetrics {
  chunkName: string;
  loadTime: number;
  size?: number;
  timestamp: number;
  route?: string;
}

class BundlePerformanceMonitor {
  private metrics: ChunkLoadMetrics[] = [];
  private initialLoadTime: number = 0;

  constructor() {
    // Track initial load time
    if (typeof window !== 'undefined' && window.performance) {
      this.initialLoadTime =
        window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    }
  }

  /**
   * Track chunk loading performance
   */
  trackChunkLoad(chunkName: string, loadTime: number, size?: number) {
    const metric: ChunkLoadMetrics = {
      chunkName,
      loadTime,
      size,
      timestamp: Date.now(),
      route: window.location.pathname,
    };

    this.metrics.push(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📦 Chunk loaded: ${chunkName} in ${loadTime.toFixed(2)}ms${size ? ` (${(size / 1024).toFixed(2)}KB)` : ''}`
      );
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', 'chunk_load', {
        event_category: 'Performance',
        event_label: chunkName,
        value: Math.round(loadTime),
        custom_map: {
          chunk_size: size,
        },
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const totalChunksLoaded = this.metrics.length;
    const totalLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
    const averageLoadTime = totalChunksLoaded > 0 ? totalLoadTime / totalChunksLoaded : 0;
    const totalSize = this.metrics.reduce((sum, m) => sum + (m.size || 0), 0);

    return {
      initialLoadTime: this.initialLoadTime,
      totalChunksLoaded,
      totalLoadTime,
      averageLoadTime,
      totalSize,
      chunks: this.metrics,
    };
  }

  /**
   * Monitor route changes and preload predictions
   */
  predictAndPreload(currentRoute: string) {
    // Analyze user navigation patterns
    const routePatterns: Record<string, string[]> = {
      '/': ['/harvey', '/enrich'], // From home, users often go to Harvey or Enrichment
      '/harvey': ['/harvey/warroom', '/harvey/metrics'], // Harvey users explore sub-features
      '/enrich': ['/enrich/results'], // Enrichment flow
    };

    const likelyNextRoutes = routePatterns[currentRoute] || [];

    // Return routes that should be preloaded
    return likelyNextRoutes;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();

    return `
Bundle Performance Report
========================
Initial Load Time: ${summary.initialLoadTime}ms
Total Chunks Loaded: ${summary.totalChunksLoaded}
Average Chunk Load Time: ${summary.averageLoadTime.toFixed(2)}ms
Total Size Downloaded: ${(summary.totalSize / 1024).toFixed(2)}KB

Chunk Details:
${summary.chunks
  .map(
    (chunk) =>
      `- ${chunk.chunkName}: ${chunk.loadTime.toFixed(2)}ms${chunk.size ? ` (${(chunk.size / 1024).toFixed(2)}KB)` : ''}`
  )
  .join('\n')}
    `.trim();
  }
}

// Export singleton instance
export const bundlePerformance = new BundlePerformanceMonitor();

// Hook into webpack's chunk loading mechanism
if (typeof window !== 'undefined' && window.__webpack_require__) {
  const originalEnsure = window.__webpack_require__.e;

  window.__webpack_require__.e = function (chunkId: string) {
    const startTime = performance.now();

    return originalEnsure.call(this, chunkId).then((result: any) => {
      const loadTime = performance.now() - startTime;
      bundlePerformance.trackChunkLoad(chunkId, loadTime);
      return result;
    });
  };
}

// Expose to window for debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).bundlePerformance = bundlePerformance;
}
