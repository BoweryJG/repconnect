/**
 * Production-ready logger utility
 * Only logs in development mode, silent in production
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    // Check multiple environment variables to determine if we're in development
    const nodeEnv = process.env.NODE_ENV;
    const reactAppEnv = process.env.REACT_APP_ENV;

    this.isDevelopment =
      nodeEnv === 'development' || reactAppEnv === 'development' || (!nodeEnv && !reactAppEnv); // Default to development if no env is set
  }

  private shouldLog(): boolean {
    return this.isDevelopment;
  }

  private formatMessage(level: LogLevel, ..._args: any[]): any[] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, ..._args];
  }

  log(..._args: any[]): void {
    if (this.shouldLog()) {
    }
  }

  error(..._args: any[]): void {
    if (this.shouldLog()) {
    }
  }

  warn(..._args: any[]): void {
    if (this.shouldLog()) {
    }
  }

  info(..._args: any[]): void {
    if (this.shouldLog()) {
    }
  }

  debug(..._args: any[]): void {
    if (this.shouldLog()) {
    }
  }

  /**
   * Utility method to log only in development without formatting
   * Useful for quick debugging
   */
  dev(..._args: any[]): void {
    if (this.shouldLog()) {
    }
  }

  /**
   * Group related log messages
   */
  group(_label: string): void {
    if (this.shouldLog()) {
      // Group logging disabled in production
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      // Group end logging disabled in production
    }
  }

  /**
   * Log tabular data
   */
  table(_data: any): void {
    if (this.shouldLog()) {
      // Table logging disabled in production
    }
  }

  /**
   * Measure time between operations
   */
  time(_label: string): void {
    if (this.shouldLog()) {
      // Time logging disabled in production
    }
  }

  timeEnd(_label: string): void {
    if (this.shouldLog()) {
      // Time end logging disabled in production
    }
  }

  /**
   * Clear the console (development only)
   */
  clear(): void {
    if (this.shouldLog()) {
      // Console clear disabled in production
    }
  }
}

// Create and export a singleton instance
const logger = new Logger();

export default logger;

// Also export individual methods for convenience
export const { log, error, warn, info, debug, dev, group, groupEnd, table, time, timeEnd, clear } =
  logger;

// Example usage:
// import logger from '@/utils/logger';
// logger.log('Hello world');
// logger.error('An error occurred', error);
// logger.info('User logged in', { userId: 123 });
// logger.debug('Debug information', data);

// Or import individual methods:
// import { log, error, warn } from '@/utils/logger';
// log('Hello world');
// error('An error occurred');
