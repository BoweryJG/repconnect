/**
 * Production-safe logging utility
 * Replaces console.log with environment-aware logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
}

class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private log(level: LogLevel, message: string, data?: any, component?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component,
    };

    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      // eslint-disable-next-line no-console
      console[level](message, data);
    }

    // In development, log everything
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console[level === 'debug' ? 'log' : level](message, data);
    }

    // Buffer logs for potential error reporting
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, data?: any, component?: string) {
    this.log('debug', message, data, component);
  }

  info(message: string, data?: any, component?: string) {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string) {
    this.log('warn', message, data, component);
  }

  error(message: string, error?: any, component?: string) {
    this.log('error', message, error, component);

    // In production, could send to error tracking service
    if (!this.isDevelopment && error instanceof Error) {
      // TODO: Send to Sentry, LogRocket, etc.
      // window.Sentry?.captureException(error);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  // Clear log buffer
  clearLogs() {
    this.logBuffer = [];
  }
}

export const logger = new ProductionLogger();
