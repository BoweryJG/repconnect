// Comprehensive error handling utilities

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode?: number,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Error handler for API responses
export const handleApiError = (error: any): AppError => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return new AppError(
          data.message || 'Invalid request',
          ErrorType.VALIDATION,
          status,
          data
        );
      case 401:
        return new AppError(
          'Please log in to continue',
          ErrorType.AUTHENTICATION,
          status
        );
      case 403:
        return new AppError(
          'You do not have permission to perform this action',
          ErrorType.AUTHORIZATION,
          status
        );
      case 404:
        return new AppError(
          'Resource not found',
          ErrorType.NOT_FOUND,
          status
        );
      case 429:
        return new AppError(
          'Too many requests. Please try again later',
          ErrorType.RATE_LIMIT,
          status
        );
      case 500:
      case 502:
      case 503:
        return new AppError(
          'Server error. Please try again later',
          ErrorType.SERVER,
          status
        );
      default:
        return new AppError(
          data.message || 'An error occurred',
          ErrorType.UNKNOWN,
          status,
          data
        );
    }
  } else if (error.request) {
    // Request made but no response received
    if (error.code === 'ECONNABORTED') {
      return new AppError(
        'Request timeout. Please check your connection',
        ErrorType.TIMEOUT
      );
    }
    return new AppError(
      'Network error. Please check your connection',
      ErrorType.NETWORK
    );
  } else {
    // Something else happened
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorType.UNKNOWN
    );
  }
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  window.addEventListener('unhandledrejection', (event) => {
    const error = new AppError(
      'Unhandled promise rejection',
      ErrorType.UNKNOWN,
      undefined,
      { reason: event.reason },
      false
    );
    
    logError(error);
    event.preventDefault();
  });
  
  window.addEventListener('error', (event) => {
    const error = new AppError(
      event.message || 'Unknown error',
      ErrorType.UNKNOWN,
      undefined,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      false
    );
    
    logError(error);
  });
};

// Error logging service
const logError = (error: AppError | Error) => {
  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error logged:', error);
    return;
  }
  
  // In production, send to error tracking service
  const errorData = {
    message: error.message,
    stack: error.stack,
    type: error instanceof AppError ? error.type : ErrorType.UNKNOWN,
    statusCode: error instanceof AppError ? error.statusCode : undefined,
    details: error instanceof AppError ? error.details : undefined,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  // Send to error tracking endpoint
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData),
  }).catch(() => {
    // Fail silently
  });
};

// Retry logic for failed operations
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> => {
  const {
    retries = 3,
    delay = 1000,
    backoff = true,
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError!;
};

// Circuit breaker pattern for external service calls
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          'Service temporarily unavailable',
          ErrorType.SERVER
        );
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = undefined;
  }
}

// User-friendly error messages
export const getUserFriendlyMessage = (error: Error | AppError): string => {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Connection problem. Please check your internet and try again.';
      case ErrorType.VALIDATION:
        return error.message || 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to do that.';
      case ErrorType.NOT_FOUND:
        return 'We couldn\'t find what you\'re looking for.';
      case ErrorType.RATE_LIMIT:
        return 'Too many attempts. Please wait a moment and try again.';
      case ErrorType.TIMEOUT:
        return 'The request took too long. Please try again.';
      case ErrorType.SERVER:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};