// Service Configuration Validation
// This file ensures all services use production endpoints

export const SERVICE_CONFIG = {
  backend: {
    url: process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com',
    healthCheck: '/health'
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co',
    anonKey: process.env.SUPABASE_SERVICE_KEY || ''
  },
  deepgram: {
    url: process.env.REACT_APP_DEEPGRAM_API_URL || 'wss://api.deepgram.com/v1/listen',
    key: process.env.REACT_APP_DEEPGRAM_API_KEY || ''
  },
  twilio: {
    phoneNumber: process.env.REACT_APP_TWILIO_PHONE_NUMBER || ''
  }
};

// Validate all services are using production URLs
export function validateServiceConfig() {
  const checks = {
    backend: SERVICE_CONFIG.backend.url.includes('osbackend-zl1h'),
    supabase: SERVICE_CONFIG.supabase.url.includes('supabase.co'),
    deepgram: SERVICE_CONFIG.deepgram.url.includes('deepgram.com')
  };
  
  return {
    allValid: Object.values(checks).every(v => v),
    checks
  };
}
