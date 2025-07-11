import { getSupabaseClient, withRetry, getPoolStats } from '../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Database Service
 * Provides a high-level abstraction for database operations with connection pooling
 */
class DatabaseService {
  constructor() {
    this.client = null;
  }

  /**
   * Initialize the database service
   */
  async initialize() {
    try {
      this.client = await getSupabaseClient();
      logger.info('Database service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  /**
   * Get a database client instance
   */
  async getClient() {
    if (!this.client) {
      await this.initialize();
    }
    return this.client;
  }

  /**
   * Execute a query with automatic retry logic
   */
  async query(tableName, queryBuilder) {
    return withRetry(async (client) => {
      const table = client.from(tableName);
      return queryBuilder(table);
    }, `Query on table ${tableName}`);
  }

  /**
   * Find records by criteria
   */
  async find(tableName, criteria = {}, options = {}) {
    return this.query(tableName, (table) => {
      let query = table.select(options.select || '*');

      // Apply filters
      Object.entries(criteria).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply options
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending !== false });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      return query;
    });
  }

  /**
   * Find a single record
   */
  async findOne(tableName, criteria = {}, options = {}) {
    const result = await this.find(tableName, criteria, { ...options, limit: 1 });
    if (result.error) {
      throw result.error;
    }
    return { data: result.data?.[0] || null, error: null };
  }

  /**
   * Insert records
   */
  async insert(tableName, data, options = {}) {
    return this.query(tableName, (table) => {
      let query = table.insert(data);

      if (options.returning !== false) {
        query = query.select();
      }

      if (options.onConflict) {
        query = query.onConflict(options.onConflict);
      }

      return query;
    });
  }

  /**
   * Update records
   */
  async update(tableName, criteria, updates, options = {}) {
    return this.query(tableName, (table) => {
      let query = table.update(updates);

      // Apply filters
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (options.returning !== false) {
        query = query.select();
      }

      return query;
    });
  }

  /**
   * Delete records
   */
  async delete(tableName, criteria, options = {}) {
    return this.query(tableName, (table) => {
      let query = table.delete();

      // Apply filters
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (options.returning !== false) {
        query = query.select();
      }

      return query;
    });
  }

  /**
   * Upsert records (insert or update)
   */
  async upsert(tableName, data, options = {}) {
    return this.query(tableName, (table) => {
      let query = table.upsert(data, {
        onConflict: options.onConflict || 'id',
        ignoreDuplicates: options.ignoreDuplicates || false,
      });

      if (options.returning !== false) {
        query = query.select();
      }

      return query;
    });
  }

  /**
   * Execute a transaction
   */
  async transaction(operations) {
    const client = await this.getClient();
    const results = [];

    try {
      for (const operation of operations) {
        const result = await operation(client);
        results.push(result);

        if (result.error) {
          throw result.error;
        }
      }

      return { data: results, error: null };
    } catch (error) {
      logger.error('Transaction failed:', error);
      return { data: null, error };
    }
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    return getPoolStats();
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const { error } = await this.query('representatives', (table) => table.select('id').limit(1));

      if (error) {
        throw error;
      }

      const responseTime = Date.now() - startTime;
      const stats = this.getStats();

      return {
        status: 'healthy',
        responseTime,
        poolStats: {
          activeConnections: stats.activeConnections,
          idleConnections: stats.idleConnections,
          totalConnections: stats.totalConnections,
          connectionErrors: stats.connectionErrors,
          isHealthy: stats.isHealthy,
          lastHealthCheck: stats.lastHealthCheck,
        },
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        poolStats: this.getStats(),
      };
    }
  }

  /**
   * Subscribe to real-time changes
   */
  async subscribe(tableName, filter = {}, callback) {
    const client = await this.getClient();

    let subscription = client
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: Object.entries(filter)
            .map(([key, value]) => `${key}=eq.${value}`)
            .join(','),
        },
        callback
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time changes
   */
  async unsubscribe(subscription) {
    if (subscription) {
      await subscription.unsubscribe();
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export specific table services for convenience
export const tables = {
  representatives: {
    find: (criteria, options) => databaseService.find('representatives', criteria, options),
    findOne: (criteria, options) => databaseService.findOne('representatives', criteria, options),
    insert: (data, options) => databaseService.insert('representatives', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('representatives', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('representatives', criteria, options),
    upsert: (data, options) => databaseService.upsert('representatives', data, options),
  },
  contacts: {
    find: (criteria, options) => databaseService.find('contacts', criteria, options),
    findOne: (criteria, options) => databaseService.findOne('contacts', criteria, options),
    insert: (data, options) => databaseService.insert('contacts', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('contacts', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('contacts', criteria, options),
    upsert: (data, options) => databaseService.upsert('contacts', data, options),
  },
  calls: {
    find: (criteria, options) => databaseService.find('calls', criteria, options),
    findOne: (criteria, options) => databaseService.findOne('calls', criteria, options),
    insert: (data, options) => databaseService.insert('calls', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('calls', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('calls', criteria, options),
    upsert: (data, options) => databaseService.upsert('calls', data, options),
  },
  call_summaries: {
    find: (criteria, options) => databaseService.find('call_summaries', criteria, options),
    findOne: (criteria, options) => databaseService.findOne('call_summaries', criteria, options),
    insert: (data, options) => databaseService.insert('call_summaries', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('call_summaries', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('call_summaries', criteria, options),
    upsert: (data, options) => databaseService.upsert('call_summaries', data, options),
  },
  harvey_sessions: {
    find: (criteria, options) => databaseService.find('harvey_sessions', criteria, options),
    findOne: (criteria, options) => databaseService.findOne('harvey_sessions', criteria, options),
    insert: (data, options) => databaseService.insert('harvey_sessions', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('harvey_sessions', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('harvey_sessions', criteria, options),
    upsert: (data, options) => databaseService.upsert('harvey_sessions', data, options),
  },
  harvey_battles: {
    find: (criteria, options) => databaseService.find('harvey_battles', criteria, options),
    findOne: (criteria, options) => databaseService.findOne('harvey_battles', criteria, options),
    insert: (data, options) => databaseService.insert('harvey_battles', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('harvey_battles', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('harvey_battles', criteria, options),
    upsert: (data, options) => databaseService.upsert('harvey_battles', data, options),
  },
  coaching_analytics: {
    find: (criteria, options) => databaseService.find('coaching_analytics', criteria, options),
    findOne: (criteria, options) =>
      databaseService.findOne('coaching_analytics', criteria, options),
    insert: (data, options) => databaseService.insert('coaching_analytics', data, options),
    update: (criteria, updates, options) =>
      databaseService.update('coaching_analytics', criteria, updates, options),
    delete: (criteria, options) => databaseService.delete('coaching_analytics', criteria, options),
    upsert: (data, options) => databaseService.upsert('coaching_analytics', data, options),
  },
};
