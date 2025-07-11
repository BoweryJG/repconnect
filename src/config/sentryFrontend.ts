import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';

/**
 * Initialize Sentry for the React frontend
 */
export function initializeSentryFrontend() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      // Browser tracing for performance monitoring
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', process.env.REACT_APP_BACKEND_URL || '', /^\//],
        // Track interactions
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      // Capture console errors
      new CaptureConsole({
        levels: ['error', 'warn'],
      }),
      // React error boundary integration
      new Sentry.ErrorBoundary({
        showDialog: false,
        dialogOptions: {
          title: "We're sorry, but something went wrong",
          subtitle: 'Our team has been notified.',
        },
      }),
      // Session replay for debugging
      new Sentry.Replay({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        // Sample rate for session replays
        sessionSampleRate: environment === 'production' ? 0.1 : 1.0,
        errorSampleRate: 1.0,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session tracking
    autoSessionTracking: true,

    // Release tracking
    release: process.env.REACT_APP_SENTRY_RELEASE || 'repconnect-frontend@1.0.0',

    // Environment-specific settings
    debug: environment === 'development',

    // Filter out certain errors
    beforeSend: (event, hint) => {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;

        // Don't send certain expected errors
        const ignoredErrors = [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
          'Network request failed',
          'Load failed',
          'Script error',
          'ChunkLoadError',
        ];

        const errorMessage = error?.message || '';
        if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
          return null;
        }
      }

      // Remove sensitive data
      if (event.request) {
        // Remove auth headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-supabase-auth'];
        }

        // Remove sensitive data from URLs
        if (event.request.url) {
          event.request.url = event.request.url
            .replace(/api_key=[^&]+/g, 'api_key=***')
            .replace(/token=[^&]+/g, 'token=***')
            .replace(/auth=[^&]+/g, 'auth=***');
        }
      }

      // Remove sensitive user data
      if (event.user) {
        event.user = {
          id: event.user.id,
          email: event.user.email?.replace(/^(.{3}).*(@.*)$/, '$1***$2'),
        };
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb: (breadcrumb) => {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }

      // Filter out certain navigation breadcrumbs
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to?.includes('/api/')) {
        return null;
      }

      // Sanitize fetch/xhr breadcrumbs
      if (['fetch', 'xhr'].includes(breadcrumb.category || '')) {
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = breadcrumb.data.url
            .replace(/api_key=[^&]+/g, 'api_key=***')
            .replace(/token=[^&]+/g, 'token=***');
        }
      }

      return breadcrumb;
    },

    // Ignore certain transactions
    ignoreTransactions: ['GET /health', 'GET /api/health', 'GET /favicon.ico', 'OPTIONS'],
  });
}

/**
 * Set user context in Sentry
 */
export function setSentryUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context in Sentry
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom context to Sentry
 */
export function setSentryContext(key: string, context: any) {
  Sentry.setContext(key, context);
}

/**
 * Capture custom metrics
 */
export function captureSentryMetric(
  name: string,
  value: number,
  unit: string = 'none',
  tags: Record<string, string> = {}
) {
  try {
    // Add frontend-specific tags
    const enhancedTags = {
      ...tags,
      platform: 'frontend',
      browser: navigator.userAgent.includes('Chrome')
        ? 'chrome'
        : navigator.userAgent.includes('Firefox')
          ? 'firefox'
          : navigator.userAgent.includes('Safari')
            ? 'safari'
            : 'other',
    };

    Sentry.metrics.gauge(name, value, unit, enhancedTags);
  } catch (error) {
    console.error('Failed to capture metric:', error);
  }
}

/**
 * Track user interactions
 */
export function trackInteraction(action: string, category: string, label?: string, value?: number) {
  Sentry.addBreadcrumb({
    message: `User ${action}`,
    category: 'ui.interaction',
    level: 'info',
    data: {
      action,
      category,
      label,
      value,
    },
  });
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitoring = {
  // Start a transaction
  startTransaction: (name: string, op: string = 'navigation') => {
    return Sentry.startTransaction({ name, op });
  },

  // Mark a span within current transaction
  startSpan: (op: string, description: string) => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    return transaction?.startChild({ op, description });
  },

  // Measure component render time
  measureRender: (componentName: string, callback: () => void) => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'react.render',
      description: `Render ${componentName}`,
    });

    try {
      callback();
    } finally {
      span?.finish();
    }
  },

  // Track API call performance
  trackApiCall: async (url: string, method: string, callback: () => Promise<any>) => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'http.client',
      description: `${method} ${url}`,
    });

    try {
      const result = await callback();
      span?.setStatus('ok');
      return result;
    } catch (error) {
      span?.setStatus('internal_error');
      throw error;
    } finally {
      span?.finish();
    }
  },
};

/**
 * Custom error boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler component for performance monitoring
 */
export const SentryProfiler = Sentry.Profiler;

// Import React Router dependencies (these should be imported at the top of your main app file)
declare const React: any;
declare const useLocation: any;
declare const useNavigationType: any;
declare const createRoutesFromChildren: any;
declare const matchRoutes: any;
