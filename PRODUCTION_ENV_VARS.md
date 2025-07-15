# Production Environment Variables

## Frontend (Netlify or Vercel)

```bash
# Backend API
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com

# Harvey Service (when deployed separately)
REACT_APP_HARVEY_URL=https://harvey-coach.onrender.com

# Voice AI Services
REACT_APP_DEEPGRAM_API_URL=wss://api.deepgram.com/v1/listen
REACT_APP_DEEPGRAM_API_KEY=4beb44e547c8ef520a575d343315b9d0dae38549
REACT_APP_USE_DEEPGRAM=true

# Moshi Configuration (Secondary)
REACT_APP_MOSHI_API_URL=wss://api.piapi.ai/moshi/v1/stream
REACT_APP_MOSHI_API_KEY=4beb44e547c8ef520a575d343315b9d0dae38549

# Twilio
REACT_APP_TWILIO_PHONE_NUMBER=+18454090692

# Supabase
REACT_APP_SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Backend (Render - Main Service)

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# OpenAI (for call summaries)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+18454090692
FORWARD_TO_PHONE=+1234567890  # Your personal phone

# Self Reference
BACKEND_URL=https://osbackend-zl1h.onrender.com

# CORS
ALLOWED_ORIGINS=https://repconnect.netlify.app,http://localhost:3000
```

## Harvey Service (Render - Background Worker)

```bash
# Server Configuration
HARVEY_PORT=3001
NODE_ENV=production

# Harvey Configuration
HARVEY_PERSONALITY_MODE=aggressive
HARVEY_INTERVENTION_THRESHOLD=medium
HARVEY_VOICE_ENABLED=true

# OpenAI (for Harvey's brain)
OPENAI_API_KEY=your_openai_api_key_here

# Voice AI
DEEPGRAM_API_KEY=4beb44e547c8ef520a575d343315b9d0dae38549
MOSHI_API_KEY=4beb44e547c8ef520a575d343315b9d0dae38549
MOSHI_API_URL=wss://api.piapi.ai/moshi/v1/stream

# Supabase
SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Notes

1. **API Keys**: 
   - Generate new Deepgram/Moshi keys (current ones are exposed)
   - Use different OpenAI keys for different services
   - Rotate keys regularly

2. **Supabase Keys**:
   - `ANON_KEY`: Public key for frontend (safe to expose)
   - `SERVICE_KEY`: Private key for backend (keep secret)

3. **Twilio**:
   - Enable webhook validation in production
   - Use separate test/prod phone numbers

4. **CORS**:
   - Update ALLOWED_ORIGINS with your production domain

## Deployment Order

1. Deploy Backend first (with new routes)
2. Update Twilio webhooks
3. Deploy Harvey service
4. Update frontend with backend URLs
5. Test end-to-end