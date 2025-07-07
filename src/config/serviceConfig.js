// Service Configuration Validation
// This file ensures all services use production endpoints

export const SERVICE_CONFIG = {
  backend: {
    url: 'https://osbackend-zl1h.onrender.com',
    healthCheck: '/health'
  },
  supabase: {
    url: 'https://cbopynuvhcymbumjnvay.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU'
  },
  deepgram: {
    url: 'wss://api.deepgram.com/v1/listen',
    key: '4beb44e547c8ef520a575d343315b9d0dae38549'
  },
  twilio: {
    phoneNumber: '+18454090692'
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
