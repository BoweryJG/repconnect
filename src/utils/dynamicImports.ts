/**
 * Dynamic import utilities for code splitting optimization
 * These utilities help reduce the initial bundle size by deferring
 * the loading of heavy libraries until they're actually needed
 */

// Preload strategies for different libraries
export const preloadStrategies = {
  // Preload Three.js when user shows intent to access 3D features
  three: () => {
    return Promise.all([
      import(/* webpackPreload: true */ 'three'),
      import(/* webpackPreload: true */ '@react-three/fiber'),
      import(/* webpackPreload: true */ '@react-three/drei'),
    ]);
  },

  // Placeholder for AI features preloading
  // TensorFlow dependencies have been removed
  ai: () => {
    return Promise.resolve();
  },

  // Preload Harvey components when navigating to Harvey routes
  harvey: () => {
    return Promise.all([
      import(/* webpackPrefetch: true */ '../components/HarveySyndicate'),
      import(/* webpackPrefetch: true */ '../components/HarveyWarRoom'),
      import(/* webpackPrefetch: true */ '../components/HarveyMetricsDashboard'),
    ]);
  },
};

// Smart preloading based on user interaction patterns
export class SmartPreloader {
  private static preloadedLibraries = new Set<string>();

  static preloadOnHover(library: keyof typeof preloadStrategies) {
    if (!this.preloadedLibraries.has(library)) {
      // Use requestIdleCallback to preload during idle time
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          preloadStrategies[library]().then(() => {
            this.preloadedLibraries.add(library);
          });
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          preloadStrategies[library]().then(() => {
            this.preloadedLibraries.add(library);
          });
        }, 100);
      }
    }
  }

  static preloadOnRoute(route: string) {
    // Preload based on route patterns
    if (route.includes('/harvey')) {
      this.preloadOnHover('harvey');
    }

    // Preload Three.js for Mission Control
    if (route === '/' || route.includes('mission')) {
      this.preloadOnHover('three');
    }
  }

  static isPreloaded(library: string): boolean {
    return this.preloadedLibraries.has(library);
  }
}

// Route-based code splitting configuration
export const routeChunkNames = {
  '/': 'main-app',
  '/enrich': 'lead-enrichment',
  '/harvey': 'harvey-syndicate',
  '/harvey/warroom': 'harvey-warroom',
  '/harvey/metrics': 'harvey-metrics',
  '/harvey/battle': 'harvey-battle',
  '/harvey/queue': 'harvey-queue',
};

// Webpack magic comments for optimal chunk loading
export const chunkLoadingHints = {
  // Critical path components - preload
  critical: '/* webpackPreload: true */',

  // Likely to be used - prefetch
  likely: '/* webpackPrefetch: true */',

  // Named chunks for better caching
  namedChunk: (name: string) => `/* webpackChunkName: "${name}" */`,

  // Combine multiple imports into a single chunk
  groupedChunk: (group: string) => `/* webpackChunkName: "${group}", webpackMode: "lazy-once" */`,
};

// Performance monitoring for dynamic imports
export const monitorImportPerformance = (chunkName: string, importPromise: Promise<any>) => {
  const startTime = performance.now();

  return importPromise.then((module) => {
    const loadTime = performance.now() - startTime;

    // Log performance metrics
    if (window.performance && window.performance.measure) {
      window.performance.measure(`${chunkName}-load-time`, {
        start: startTime,
        duration: loadTime,
      });
    }

    // Performance logging removed for production

    return module;
  });
};
