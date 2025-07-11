import { createClient } from '@supabase/supabase-js';
import logger from '../../utils/logger.js';

// Database connection pool configuration
const POOL_CONFIG = {
  // Connection pool size
  db: {
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20'), // Maximum number of connections in the pool
    poolMin: parseInt(process.env.DB_POOL_MIN || '2'), // Minimum number of connections to maintain
    poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'), // 30 seconds idle timeout
    poolAcquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000'), // 60 seconds to acquire connection
    poolEvictionInterval: parseInt(process.env.DB_POOL_EVICTION_INTERVAL || '10000'), // Check for idle connections every 10 seconds
    poolConnectionTimeout: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '30000'), // 30 seconds connection timeout
  },

  // Request retry configuration
  retry: {
    retries: parseInt(process.env.DB_RETRY_COUNT || '3'),
    factor: 2, // Exponential backoff factor
    minTimeout: 1000, // 1 second
    maxTimeout: 60000, // 60 seconds
    randomize: true,
  },

  // Health check configuration
  healthCheck: {
    interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
    timeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT || '10000'), // 10 seconds
  },
};

// Connection pool statistics
const poolStats = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  waitingRequests: 0,
  connectionErrors: 0,
  lastHealthCheck: null,
  isHealthy: true,
};

// Create Supabase client with enhanced configuration
const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('Missing required Supabase environment variables');
    throw new Error('Database configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  // Create client with connection pooling and retry logic
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      // Connection pooling headers for Supabase
      headers: {
        'x-connection-pool-size': POOL_CONFIG.db.poolSize.toString(),
        'x-pool-timeout': POOL_CONFIG.db.poolAcquireTimeout.toString(),
      },
      // Fetch options for connection management
      fetch: async (url, options = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, POOL_CONFIG.db.poolConnectionTimeout);

        try {
          // Add connection pooling headers
          options.headers = {
            ...options.headers,
            Connection: 'keep-alive',
            'Keep-Alive': `timeout=${Math.floor(POOL_CONFIG.db.poolIdleTimeout / 1000)}`,
          };

          // Track active connections
          poolStats.activeConnections++;
          poolStats.totalConnections++;

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          return response;
        } catch (error) {
          poolStats.connectionErrors++;
          throw error;
        } finally {
          clearTimeout(timeout);
          poolStats.activeConnections--;
          poolStats.idleConnections = Math.max(
            0,
            POOL_CONFIG.db.poolSize - poolStats.activeConnections
          );
        }
      },
    },
  });

  return client;
};

// Singleton instance with lazy initialization
let supabaseInstance = null;
let initializationPromise = null;

// Get or create the Supabase client instance
export const getSupabaseClient = async () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Prevent race conditions during initialization
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      supabaseInstance = createSupabaseClient();
      logger.info('Database connection pool initialized', {
        poolSize: POOL_CONFIG.db.poolSize,
        minConnections: POOL_CONFIG.db.poolMin,
        idleTimeout: POOL_CONFIG.db.poolIdleTimeout,
      });

      // Start health check monitoring
      startHealthCheckMonitoring();

      return supabaseInstance;
    } catch (error) {
      logger.error('Failed to initialize database connection pool:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

// Health check monitoring
let healthCheckInterval = null;

const startHealthCheckMonitoring = () => {
  if (healthCheckInterval) {
    return;
  }

  healthCheckInterval = setInterval(async () => {
    try {
      const client = await getSupabaseClient();
      const startTime = Date.now();

      // Simple health check query
      const { error } = await client
        .from('representatives')
        .select('id')
        .limit(1)
        .timeout(POOL_CONFIG.healthCheck.timeout);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      poolStats.isHealthy = true;
      poolStats.lastHealthCheck = new Date();

      logger.debug('Database health check passed', {
        responseTime,
        activeConnections: poolStats.activeConnections,
        idleConnections: poolStats.idleConnections,
      });
    } catch (error) {
      poolStats.isHealthy = false;
      poolStats.connectionErrors++;
      logger.error('Database health check failed:', error);
    }
  }, POOL_CONFIG.healthCheck.interval);
};

// Stop health check monitoring
const stopHealthCheckMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

// Get current pool statistics
export const getPoolStats = () => ({
  ...poolStats,
  config: POOL_CONFIG,
});

// Graceful shutdown
export const closeConnectionPool = async () => {
  try {
    logger.info('Closing database connection pool...');

    // Stop health checks
    stopHealthCheckMonitoring();

    // Wait for active connections to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (poolStats.activeConnections > 0 && Date.now() - startTime < shutdownTimeout) {
      logger.info(`Waiting for ${poolStats.activeConnections} active connections to complete...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (poolStats.activeConnections > 0) {
      logger.warn(`Force closing ${poolStats.activeConnections} remaining connections`);
    }

    // Clear the singleton instance
    supabaseInstance = null;
    initializationPromise = null;

    logger.info('Database connection pool closed successfully');
  } catch (error) {
    logger.error('Error closing database connection pool:', error);
    throw error;
  }
};

// Export a wrapper function for database operations with retry logic
export const withRetry = async (operation, operationName = 'database operation') => {
  const { retries, factor, minTimeout, maxTimeout, randomize } = POOL_CONFIG.retry;

  let lastError;
  let delay = minTimeout;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const client = await getSupabaseClient();
      return await operation(client);
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        logger.error(`${operationName} failed after ${retries + 1} attempts:`, error);
        throw error;
      }

      // Calculate next delay with exponential backoff
      if (randomize) {
        delay = Math.min(delay * factor * (0.5 + Math.random()), maxTimeout);
      } else {
        delay = Math.min(delay * factor, maxTimeout);
      }

      logger.warn(
        `${operationName} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Export configured pool settings for monitoring
export const poolConfig = POOL_CONFIG;
