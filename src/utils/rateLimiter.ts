/**
 * Client-side rate limiting to match osbackend configuration
 * - General API: 100 requests per 15 minutes
 * - AI endpoints: 10 requests per 15 minutes
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  // Match osbackend rate limits
  private configs: Record<string, RateLimitConfig> = {
    general: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 15 minutes
    ai: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 15 minutes
  };

  /**
   * Check if request should be allowed
   * @param endpoint - The endpoint being called
   * @param isAI - Whether this is an AI endpoint
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(endpoint: string, isAI: boolean = false): boolean {
    const config = isAI ? this.configs.ai : this.configs.general;
    const key = isAI ? 'ai' : 'general';
    const now = Date.now();

    const entry = this.limits.get(key);

    // No entry or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Within window
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests and reset time
   * @param isAI - Whether checking AI endpoint limits
   */
  getStatus(isAI: boolean = false) {
    const config = isAI ? this.configs.ai : this.configs.general;
    const key = isAI ? 'ai' : 'general';
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      return {
        remaining: config.maxRequests,
        resetIn: 0,
        limit: config.maxRequests,
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetIn: Math.max(0, entry.resetTime - now),
      limit: config.maxRequests,
    };
  }

  /**
   * Parse rate limit headers from response
   * @param headers - Response headers
   */
  updateFromHeaders(headers: Headers) {
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    const limit = headers.get('X-RateLimit-Limit');

    if (remaining && reset) {
      // Server-side rate limit info available
      // This helps sync client-side tracking with server state
      console.debug('Rate limit headers:', { remaining, reset, limit });
    }
  }

  /**
   * Format time until reset for user display
   * @param resetIn - Milliseconds until reset
   */
  formatResetTime(resetIn: number): string {
    const minutes = Math.ceil(resetIn / 60000);
    if (minutes <= 1) return 'less than a minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0
      ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper to determine if endpoint is AI-related
export function isAIEndpoint(url: string): boolean {
  const aiPatterns = [
    '/chat/',
    '/agents/',
    '/coaching/',
    '/anthropic',
    '/perplexity',
    '/research',
    '/ai/',
  ];

  return aiPatterns.some((pattern) => url.includes(pattern));
}

// Rate limit error class
export class RateLimitError extends Error {
  public resetIn: number;
  public isAI: boolean;

  constructor(resetIn: number, isAI: boolean) {
    const resetTime = rateLimiter.formatResetTime(resetIn);
    const limit = isAI ? '10 requests per 15 minutes' : '100 requests per 15 minutes';
    super(`Rate limit exceeded (${limit}). Please try again in ${resetTime}.`);
    this.name = 'RateLimitError';
    this.resetIn = resetIn;
    this.isAI = isAI;
  }
}
