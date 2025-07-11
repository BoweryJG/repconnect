import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import logger from '../../utils/logger.js';

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export function initializeSentry(app) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
        // Enable profiling
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Release tracking
      release: process.env.SENTRY_RELEASE || 'repconnect@1.0.0',
      // Filter out specific errors
      beforeSend: (event, hint) => {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException;

          // Don't send certain expected errors
          if (
            error?.message?.includes('ECONNREFUSED') ||
            error?.message?.includes('ETIMEDOUT') ||
            error?.message?.includes('Socket hang up')
          ) {
            return null;
          }
        }

        // Remove sensitive data
        if (event.request) {
          // Remove auth headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }

          // Remove sensitive query params
          if (event.request.query_string) {
            event.request.query_string = event.request.query_string
              .replace(/api_key=[^&]+/g, 'api_key=***')
              .replace(/token=[^&]+/g, 'token=***');
          }
        }

        return event;
      },
      // Breadcrumb filtering
      beforeBreadcrumb: (breadcrumb) => {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }

        // Sanitize data in breadcrumbs
        if (breadcrumb.data && typeof breadcrumb.data === 'object') {
          const sanitized = { ...breadcrumb.data };

          // Remove sensitive fields
          ['password', 'token', 'api_key', 'secret'].forEach((field) => {
            if (sanitized[field]) {
              sanitized[field] = '***';
            }
          });

          breadcrumb.data = sanitized;
        }

        return breadcrumb;
      },
    });

    // Add Sentry handlers to Express app
    if (app) {
      // The request handler must be the first middleware on the app
      app.use(Sentry.Handlers.requestHandler());

      // The tracing handler creates a trace for every incoming request
      app.use(Sentry.Handlers.tracingHandler());
    }

    logger.success('Sentry initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Sentry error handler middleware
 * This should be added after all other middleware and routes
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture 4xx and 5xx errors
    if (error.status >= 400) {
      return true;
    }
    return false;
  },
});

/**
 * Capture custom events and metrics
 */
export const captureMetric = (name, value, unit = 'none', tags = {}) => {
  try {
    Sentry.metrics.gauge(name, value, unit, tags);
  } catch (error) {
    logger.error('Failed to capture metric:', error);
  }
};

/**
 * Add user context to Sentry
 */
export const setUser = (user) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    // Don't include sensitive data
  });
};

/**
 * Clear user context
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Add custom context
 */
export const addContext = (key, context) => {
  Sentry.setContext(key, context);
};

/**
 * Capture custom exceptions
 */
export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture messages
 */
export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

export default {
  initializeSentry,
  sentryErrorHandler,
  captureMetric,
  setUser,
  clearUser,
  addContext,
  captureException,
  captureMessage,
};
