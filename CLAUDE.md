# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build for production (disables sourcemaps, ignores warnings)
npm run build

# Run tests
npm test

# Run specific test file
npm test -- src/components/ComponentName.test.tsx

# Run tests with coverage
npm test -- --coverage
```

### Harvey AI Service

```bash
# Deploy Harvey service to production
npm run harvey:deploy

# Initialize Harvey for all representatives
npm run harvey:init

# Start Harvey in production mode
npm run harvey:start

# Monitor Harvey service health
npm run harvey:monitor

# Test Harvey coach functionality
npm run harvey:test
```

### Backend Server

```bash
# Start backend server (runs on PORT env var, default 3001)
node server.js

# Check production readiness
./check-production.sh

# Security audit for hardcoded secrets
./check-for-secrets.sh
```

## Architecture Overview

### Application Structure

This is a **multi-application CRM platform** with distinct frontends:

- **Main CRM** (`/`) - Contact management and pipeline
- **Harvey Syndicate** (`/harvey`) - AI performance coaching theater
- **Harvey War Room** (`/harvey/warroom`) - Live call monitoring and battles
- **Lead Enrichment** (`/enrich`) - AI-powered lead intelligence

### Frontend Stack

- **React 18** with TypeScript, configured with Create React App
- **Material-UI v5** as the primary component library
- **Zustand** for state management (stores in `src/store/`)
- **React Router v6** for client-side routing
- **Three.js/React Three Fiber** for 3D visualizations (War Room spheres)
- **Framer Motion** for animations throughout the app

### Backend Architecture

The backend (`server.js`) is an Express.js server with:

- **Sentry** integration for error tracking and performance monitoring
- **Rate limiting** with different tiers (default: 100/min, API: 300/min, auth: 5/min)
- **Health monitoring** endpoints at `/health`, `/api/health`, `/health/metrics`
- **WebSocket support** via Socket.IO for real-time features
- **Cookie-based authentication** with httpOnly cookies and CSRF protection

### External Services Integration

- **Supabase**: PostgreSQL database with RLS policies, authentication
- **Twilio**: Voice calling, phone number management, call forwarding
- **Deepgram**: Real-time voice transcription via WebRTC
- **OpenAI GPT-4**: Powers Harvey AI coaching personality
- **ElevenLabs**: Text-to-speech for Harvey's voice
- **Moshi**: Alternative voice service integration

### Real-time Communication Flow

```
User Browser <-> WebRTC <-> Backend <-> Twilio/Deepgram
                   |
                Socket.IO <-> Harvey AI Service
```

### Database Schema

All tables in Supabase have Row Level Security (RLS) enabled:

- `representatives` - Sales rep profiles with Harvey configuration
- `contacts` - Lead/customer data with enrichment fields
- `calls` - Call history, recordings, transcripts
- `call_summaries` - AI-generated call summaries
- `harvey_sessions` - Coaching session data
- `harvey_battles` - Head-to-head call competitions
- `coaching_analytics` - Performance metrics

## Critical Implementation Details

### Authentication Flow

1. User logs in via Supabase Auth
2. JWT stored in httpOnly cookie (not localStorage)
3. CSRF token required for state-changing requests
4. Session timeout: 30 minutes with 5-minute warning
5. Automatic refresh every 15 minutes

### Harvey AI Integration

Harvey components follow a specific pattern:

- Frontend components: `src/components/Harvey*.tsx`
- Service layer: `src/services/harvey*.{js,ts}`
- API routes: `src/api/harveyRoutes.js`, `harveyMultiAgentRoutes.js`
- WebRTC integration: `src/services/harveyWebRTC.ts`
- Voice metrics: `src/services/voiceMetricsService.ts`

### Multi-Rep Support

Each sales rep has dedicated configuration:

- Environment vars: `TWILIO_REP{N}_NUMBER`, `REP{N}_FORWARD_TO`
- Harvey instances: One per rep with unique personality
- Call routing: Based on rep's assigned Twilio number

### Performance Optimizations

- Lazy loading for heavy components (3D visualizations)
- Virtualized lists for large contact grids
- Adaptive rendering based on device capabilities
- Thermal management for intensive operations
- Build optimizations: No source maps, tree shaking enabled

## Environment Variables

### Required Frontend Variables

```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_BACKEND_URL
REACT_APP_HARVEY_API_URL
REACT_APP_HARVEY_WS_URL
REACT_APP_TWILIO_PHONE_NUMBER
REACT_APP_DEEPGRAM_API_KEY
REACT_APP_MOSHI_API_URL
REACT_APP_ELEVENLABS_API_KEY
REACT_APP_METERED_TURN_USERNAME
REACT_APP_METERED_TURN_CREDENTIAL
```

### Required Backend Variables

```
NODE_ENV=production
PORT
SUPABASE_URL
SUPABASE_SERVICE_KEY
OPENAI_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
DEEPGRAM_API_KEY
SENTRY_DSN
BACKEND_URL
FORWARD_TO_PHONE
HARVEY_PHONE_NUMBER
```

## Deployment Configuration

### Frontend (Netlify)

- Build command: `CI=false GENERATE_SOURCEMAP=false npm run build`
- Publish directory: `build`
- Redirects configured in `netlify.toml` for SPA routing

### Backend (Render)

- Start command: `node server.js`
- Health check URL: `/health`
- Environment: All backend variables must be set

### Post-Deployment Verification

1. Check `/health` endpoint returns 200
2. Verify `/api/harvey/status` shows all reps initialized
3. Test WebRTC connection at `/harvey/warroom`
4. Confirm Twilio webhooks reach `/api/twilio/voice`

## Known Issues and Workarounds

- ESLint warnings about unused variables (non-critical)
- Bundle size warning (613KB gzipped) - consider code splitting
- Mediapipe source map warning - ignore in production
- Table name inconsistency: use `calls` not `call_logs`
