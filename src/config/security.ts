// Security configuration for the application

export const SECURITY_CONFIG = {
  // CORS configuration
  cors: {
    allowedOrigins: process.env.REACT_APP_ALLOWED_ORIGINS?.split(',') || [
      'https://osbackend-zl1h.onrender.com',
      'https://cbopynuvhcymbumjnvay.supabase.co',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  // API rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      general: 100,
      auth: 5,
      upload: 10,
    },
  },
  
  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: Remove unsafe-inline and unsafe-eval in production
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://osbackend-zl1h.onrender.com',
        'wss://osbackend-zl1h.onrender.com',
        'https://cbopynuvhcymbumjnvay.supabase.co',
        'https://api.twilio.com',
      ],
      mediaSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },
  
  // Authentication settings
  auth: {
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  
  // Input validation limits
  validation: {
    maxNameLength: 100,
    maxEmailLength: 255,
    maxPhoneLength: 20,
    maxMessageLength: 5000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
    ],
  },
  
  // API security
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
};

// Helper function to apply security headers to fetch requests
export const secureHeaders = (headers: HeadersInit = {}): HeadersInit => {
  return {
    ...headers,
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': getCSRFToken(),
  };
};

// Get CSRF token (should be provided by backend)
const getCSRFToken = (): string => {
  // In production, this should be fetched from a meta tag or cookie
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || '';
};

// Create secure fetch wrapper
export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Validate URL
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }
  
  // Apply security headers
  const secureOptions: RequestInit = {
    ...options,
    headers: secureHeaders(options.headers),
    credentials: 'include', // Include cookies
  };
  
  // Add timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, SECURITY_CONFIG.api.timeout);
  
  try {
    const response = await fetch(url, {
      ...secureOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    // Check for security headers in response
    validateResponseHeaders(response);
    
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};

// Validate URL to prevent SSRF attacks
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Check for local/internal IPs (basic check)
    const hostname = urlObj.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      // Only allow in development
      return process.env.NODE_ENV === 'development';
    }
    
    return true;
  } catch {
    return false;
  }
};

// Validate response security headers
const validateResponseHeaders = (response: Response): void => {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
  ];
  
  if (process.env.NODE_ENV === 'production') {
    requiredHeaders.forEach(header => {
      if (!response.headers.has(header)) {
        console.warn(`Missing security header: ${header}`);
      }
    });
  }
};