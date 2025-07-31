import { logger } from './prodLogger';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultConfig: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  factor: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx status codes
    if (!error.response) return true; // Network error
    const status = error.response?.status || error.status;
    return status >= 500 && status < 600;
  },
};

export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, factor, shouldRetry } = {
    ...defaultConfig,
    ...config,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        logger.error(
          'API call failed after retries',
          {
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : error,
          },
          'apiRetry'
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);

      logger.info(
        `Retrying API call (attempt ${attempt + 1}/${maxRetries})`,
        {
          delay,
          error: error instanceof Error ? error.message : error,
        },
        'apiRetry'
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Convenience wrapper for fetch with retry
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    // Throw error for non-ok responses so retry logic can handle them
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = response;
      (error as any).status = response.status;
      throw error;
    }

    return response;
  }, retryConfig);
}
