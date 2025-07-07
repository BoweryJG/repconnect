/**
 * Production-ready logger utility
 * 
 * This logger checks NODE_ENV to determine logging behavior:
 * - In production: Only logs warnings and errors to minimize output
 * - In development: Logs all levels with colorful formatting
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// ANSI color codes for development
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Format log message with timestamp and level
 */
function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ') : '';
  
  return {
    timestamp,
    level,
    message: message + formattedArgs,
    raw: [message, ...args]
  };
}

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Log general information (only in development)
   */
  info: (message, ...args) => {
    if (!isProduction) {
      const formatted = formatMessage('INFO', message, ...args);
      console.log(
        `${colors.dim}[${formatted.timestamp}]${colors.reset} ${colors.cyan}INFO${colors.reset} ${formatted.message}`
      );
    }
  },

  /**
   * Log successful operations (only in development)
   */
  success: (message, ...args) => {
    if (!isProduction) {
      const formatted = formatMessage('SUCCESS', message, ...args);
      console.log(
        `${colors.dim}[${formatted.timestamp}]${colors.reset} ${colors.green}SUCCESS${colors.reset} ${formatted.message}`
      );
    }
  },

  /**
   * Log debug information (only in development)
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      const formatted = formatMessage('DEBUG', message, ...args);
      console.log(
        `${colors.dim}[${formatted.timestamp}]${colors.reset} ${colors.magenta}DEBUG${colors.reset} ${formatted.message}`
      );
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (message, ...args) => {
    const formatted = formatMessage('WARN', message, ...args);
    if (isProduction) {
      // In production, log as structured JSON
      console.warn(JSON.stringify({
        timestamp: formatted.timestamp,
        level: 'WARN',
        message: formatted.message
      }));
    } else {
      // In development, use colored output
      console.warn(
        `${colors.dim}[${formatted.timestamp}]${colors.reset} ${colors.yellow}WARN${colors.reset} ${formatted.message}`
      );
    }
  },

  /**
   * Log errors (always logged)
   */
  error: (message, ...args) => {
    const formatted = formatMessage('ERROR', message, ...args);
    
    // Extract error stack if present
    const errorObj = args.find(arg => arg instanceof Error);
    
    if (isProduction) {
      // In production, log as structured JSON
      console.error(JSON.stringify({
        timestamp: formatted.timestamp,
        level: 'ERROR',
        message: formatted.message,
        stack: errorObj?.stack
      }));
    } else {
      // In development, use colored output
      console.error(
        `${colors.dim}[${formatted.timestamp}]${colors.reset} ${colors.red}ERROR${colors.reset} ${formatted.message}`
      );
      if (errorObj?.stack) {
        console.error(colors.red + errorObj.stack + colors.reset);
      }
    }
  },

  /**
   * Log fatal errors (always logged)
   */
  fatal: (message, ...args) => {
    const formatted = formatMessage('FATAL', message, ...args);
    
    // Extract error stack if present
    const errorObj = args.find(arg => arg instanceof Error);
    
    if (isProduction) {
      // In production, log as structured JSON
      console.error(JSON.stringify({
        timestamp: formatted.timestamp,
        level: 'FATAL',
        message: formatted.message,
        stack: errorObj?.stack
      }));
    } else {
      // In development, use colored output with bright red
      console.error(
        `${colors.bright}${colors.red}[${formatted.timestamp}] FATAL ${formatted.message}${colors.reset}`
      );
      if (errorObj?.stack) {
        console.error(colors.bright + colors.red + errorObj.stack + colors.reset);
      }
    }
  },

  /**
   * Create a child logger with a specific context
   */
  child: (context) => {
    const prefix = `[${context}]`;
    return {
      info: (msg, ...args) => logger.info(`${prefix} ${msg}`, ...args),
      success: (msg, ...args) => logger.success(`${prefix} ${msg}`, ...args),
      debug: (msg, ...args) => logger.debug(`${prefix} ${msg}`, ...args),
      warn: (msg, ...args) => logger.warn(`${prefix} ${msg}`, ...args),
      error: (msg, ...args) => logger.error(`${prefix} ${msg}`, ...args),
      fatal: (msg, ...args) => logger.fatal(`${prefix} ${msg}`, ...args)
    };
  }
};

export default logger;