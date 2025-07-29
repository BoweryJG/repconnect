# Required Environment Variables

This document lists all environment variables that need to be configured for the application to work properly. All hardcoded tokens and API keys have been removed from the codebase.

## Backend Configuration

- `REACT_APP_BACKEND_URL` - Backend API URL (e.g., https://your-backend-url.com)
- `REACT_APP_AGENT_BACKEND_URL` - Agent Backend API URL (default: https://agentbackend-2932.onrender.com)

## Twilio Configuration

- `REACT_APP_TWILIO_PHONE_NUMBER` - Your Twilio phone number (e.g., +1234567890)

## Harvey Configuration

- `HARVEY_PERSONALITY_MODE` - Harvey's personality mode (aggressive/moderate/friendly)
- `HARVEY_INTERVENTION_THRESHOLD` - Intervention threshold (high/medium/low)
- `HARVEY_VOICE_ENABLED` - Enable voice features (true/false)

## Deepgram Configuration

- `REACT_APP_DEEPGRAM_API_URL` - Deepgram WebSocket URL (default: wss://api.deepgram.com/v1/listen)
- `REACT_APP_DEEPGRAM_API_KEY` - Your Deepgram API key
- `REACT_APP_USE_DEEPGRAM` - Enable Deepgram integration (true/false)

## Moshi Configuration

- `REACT_APP_MOSHI_API_URL` - Moshi API URL (default: wss://api.piapi.ai/moshi/v1/stream)
- `REACT_APP_MOSHI_API_KEY` - Your Moshi API key

## OpenAI Configuration

- `OPENAI_API_KEY` - Your OpenAI API key

## Supabase Configuration

- `REACT_APP_SUPABASE_URL` - Your Supabase project URL (default: https://cbopynuvhcymbumjnvay.supabase.co)
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anonymous key (required)
- `SUPABASE_URL` - Your Supabase project URL (for server-side usage)
- `SUPABASE_SERVICE_KEY` - Your Supabase service key (for server-side usage)

## WebRTC TURN Server Configuration (Optional)

### Generic TURN Server

- `REACT_APP_TURN_URL` - TURN server URL
- `REACT_APP_TURN_USERNAME` - TURN server username
- `REACT_APP_TURN_CREDENTIAL` - TURN server password

### Metered.ca TURN Server

- `REACT_APP_METERED_TURN_USERNAME` - Metered TURN username
- `REACT_APP_METERED_TURN_CREDENTIAL` - Metered TURN credential

### Twilio TURN Server

- `REACT_APP_TWILIO_TURN_ENABLED` - Enable Twilio TURN (true/false)
- `REACT_APP_TWILIO_TURN_URL` - Twilio TURN URL
- `REACT_APP_TWILIO_TURN_USERNAME` - Twilio TURN username
- `REACT_APP_TWILIO_TURN_CREDENTIAL` - Twilio TURN credential

### Xirsys TURN Server

- `REACT_APP_XIRSYS_ENABLED` - Enable Xirsys TURN (true/false)
- `REACT_APP_XIRSYS_TURN_URL` - Xirsys TURN URL
- `REACT_APP_XIRSYS_USERNAME` - Xirsys username
- `REACT_APP_XIRSYS_CREDENTIAL` - Xirsys credential

### CoTURN Server

- `REACT_APP_COTURN_ENABLED` - Enable CoTURN (true/false)
- `REACT_APP_COTURN_URL` - CoTURN URL
- `REACT_APP_COTURN_USERNAME` - CoTURN username
- `REACT_APP_COTURN_CREDENTIAL` - CoTURN credential

## Multi-Rep Configuration (Optional)

### Rep 1

- `TWILIO_REP1_NUMBER` - Twilio number for Rep 1
- `REP1_NAME` - Rep 1 name
- `REP1_FORWARD_TO` - Phone number to forward to
- `REP1_HARVEY_STYLE` - Harvey style for Rep 1
- `REP1_MESSAGE` - Personal message for Rep 1

### Rep 2

- `TWILIO_REP2_NUMBER` - Twilio number for Rep 2
- `REP2_NAME` - Rep 2 name
- `REP2_FORWARD_TO` - Phone number to forward to
- `REP2_HARVEY_STYLE` - Harvey style for Rep 2
- `REP2_MESSAGE` - Personal message for Rep 2

### Rep 3

- `TWILIO_REP3_NUMBER` - Twilio number for Rep 3
- `REP3_NAME` - Rep 3 name
- `REP3_FORWARD_TO` - Phone number to forward to
- `REP3_HARVEY_STYLE` - Harvey style for Rep 3
- `REP3_MESSAGE` - Personal message for Rep 3

## Test Configuration (Optional)

- `TEST_AUTH_TOKEN` - Authentication token for test WebSocket connections

## Security Notes

1. Never commit actual API keys or tokens to the repository
2. Use a `.env` file for local development (already in .gitignore)
3. Set these variables in your deployment platform's environment configuration
4. Rotate API keys regularly
5. Use different API keys for development and production environments
