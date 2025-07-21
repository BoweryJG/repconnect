# RepConnect Frontend - Claude Code Context

This file provides guidance to Claude Code when working with the RepConnect frontend React application.

## Architecture Overview

### RepConnect Application

RepConnect is a **sales representative platform** that connects to the **unified agent system backend** for AI-powered sales coaching and voice conversations.

**Key Features:**

- 🎤 **Voice Conversations**: 19 ElevenLabs-powered agents
- 💬 **Text Chat**: Real-time streaming chat with AI agents
- 📊 **Performance Dashboards**: Harvey Specter coaching and battle mode
- 📞 **Call Management**: Twilio integration for voice calls
- 🎯 **Multi-Agent Support**: Access to 19 specialized sales agents

### Backend Integration

- **Primary Backend**: `https://osbackend-zl1h.onrender.com` (unified agent system)
- **Local Development**: `http://localhost:3001`
- **Agent API**: `/api/repconnect/*` endpoints
- **Chat API**: `/api/repconnect/chat/*` endpoints (NEW)
- **WebSocket**: `/agents-ws` with `appName: 'repconnect'`

## Unified Agent System Integration

### Available Agents (19 total)

RepConnect has access to these specialized agents via the unified backend:

#### 🏆 Elite Closers (2 agents)

- **Harvey Specter**: Legendary closer with maximum aggression
- **Victoria Sterling**: Elite negotiator with sophisticated approach

#### 👥 Coaches (5 agents)

- **Coach Alex**: Motivational sales coach (RepConnect exclusive)
- **Alexis Rivera**: Confidence and mindset coaching
- **David Park**: Strategic sales methodology
- **Marcus Chen**: Performance optimization
- **Sarah Mitchell**: Relationship building expertise

#### 🧠 Strategists (4 agents)

- **Hunter**: Prospecting and lead generation specialist
- **Closer**: Deal-making and negotiation expert
- **Educator**: Teaching-focused medical procedure expert
- **Strategist**: Market intelligence and competitive analysis

#### 🩺 Medical Specialists (6 agents)

- **Dr. Amanda Foster, Dr. Harvey Stern, Dr. Lisa Martinez**: Medical device experts
- **Dr. Sarah Chen, Jake Thompson, Marcus Rodriguez**: Specialized procedure experts

#### 🎤 Voice Representatives (2 RepConnect exclusive)

- **Marcus**: Professional analytical approach
- **Sarah**: Friendly empathetic communication

### API Endpoints

#### Agent Management

```
GET    /api/repconnect/agents                    # List all RepConnect agents (19)
GET    /api/repconnect/agents/voice-enabled      # Voice-enabled agents (19)
GET    /api/repconnect/agents/harvey             # Harvey Specter specific
GET    /api/repconnect/agents/categories         # Agent categories
GET    /api/repconnect/agents/:id                # Specific agent details
```

#### Chat Functionality (NEW)

```
POST   /api/repconnect/chat/stream               # Streaming chat (SSE)
POST   /api/repconnect/chat/message              # Standard chat messages
POST   /api/repconnect/chat/conversations        # Create conversation
GET    /api/repconnect/chat/conversations        # List conversations
GET    /api/repconnect/chat/conversations/:id    # Get conversation details
```

#### Voice Sessions

```
POST   /api/repconnect/agents/:id/start-voice-session  # Start voice session
```

### WebSocket Integration

RepConnect can use both WebSocket and REST for chat:

```javascript
// WebSocket Connection
const socket = io('https://osbackend-zl1h.onrender.com', {
  path: '/agents-ws',
  auth: {
    token: 'jwt-token',
    appName: 'repconnect', // IMPORTANT: Must specify 'repconnect'
  },
});

// Events
socket.emit('message', { conversationId, message, agentId });
socket.on('agent:message:chunk', (data) => {
  /* streaming response */
});
socket.on('agent:message:complete', (data) => {
  /* response complete */
});
```

## Frontend Architecture

### Tech Stack

- **React 18** with TypeScript
- **Material-UI v5** for components
- **Zustand** for state management
- **React Router v6** for routing
- **Three.js** for 3D visualizations (Harvey War Room)
- **Framer Motion** for animations
- **Socket.IO Client** for WebSocket connections

### Key Components

#### Agent Integration

- `src/components/ChatbotLauncher/` - Main agent interface
- `src/components/AgentSelector.tsx` - Agent selection UI
- `src/components/VoiceModal*.tsx` - Voice conversation interface
- `src/services/agentBackendAPI.js` - Backend API integration
- `src/services/agentChatAPI.js` - Chat functionality

#### Harvey Specific

- `src/components/Harvey*.tsx` - Harvey-specific components
- `src/services/harveyAPI.js` - Harvey backend integration
- `src/services/harveyWebRTC.ts` - Voice integration

#### Voice & WebRTC

- `src/services/webRTCVoiceService.ts` - WebRTC voice service
- `src/services/elevenLabsTTS.ts` - ElevenLabs integration
- `src/components/WebRTCVoiceInterface*.tsx` - Voice UI components

### Configuration Files

#### Environment Variables

```env
# Backend Integration
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_API_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_WS_URL=wss://osbackend-zl1h.onrender.com

# Supabase (for auth and data)
REACT_APP_SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Voice Services
REACT_APP_ELEVENLABS_API_KEY=your-elevenlabs-key
REACT_APP_DEEPGRAM_API_KEY=your-deepgram-key

# Twilio (for voice calls)
REACT_APP_TWILIO_PHONE_NUMBER=+18454090692
```

## Development Commands

### Core Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run specific test file
npm test -- src/components/ComponentName.test.tsx
```

### Agent Testing

```bash
# Test backend agent connections
node test-agent-connections.js

# Test all API endpoints
node test-all-apis.js

# Test production APIs
node test-production-apis.js

# Test Harvey WebSocket
node test-harvey-socket.js
```

### Backend Server (if running locally)

```bash
# Start backend server (runs on PORT env var, default 3001)
node server.js

# Check production readiness
./check-production.sh

# Security audit
./check-for-secrets.sh
```

## Database Integration

### Supabase Tables

- `representatives` - Sales rep profiles
- `contacts` - Lead/customer data
- `calls` - Call history and recordings
- `call_summaries` - AI-generated summaries
- `harvey_sessions` - Coaching sessions
- `coaching_analytics` - Performance metrics

### Authentication

- **Supabase Auth** with JWT tokens
- **Session management** with automatic refresh
- **Row Level Security (RLS)** on all tables

## Critical Implementation Notes

### Backend URL Configuration

Always ensure these services point to the correct backend:

```javascript
// In src/services/agentBackendAPI.js
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// In src/services/agentChatAPI.js
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
```

### Agent Loading Pattern

```javascript
// Correct way to load RepConnect agents
const loadRepConnectAgents = async () => {
  const response = await fetch(`${BACKEND_URL}/api/repconnect/agents`);
  const data = await response.json();
  return data.agents; // Should return 19 agents
};
```

### Chat Integration Pattern

```javascript
// Using REST API for chat
const sendChatMessage = async (agentId, message, conversationId) => {
  const response = await fetch(`${BACKEND_URL}/api/repconnect/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, message, conversationId }),
  });
  return response.json();
};

// Using WebSocket for chat
socket.emit('message', {
  conversationId,
  message,
  agentId,
  metadata: { appName: 'repconnect', userType: 'sales_rep' },
});
```

### Voice Session Pattern

```javascript
// Start voice session with agent
const startVoiceSession = async (agentId) => {
  const response = await fetch(
    `${BACKEND_URL}/api/repconnect/agents/${agentId}/start-voice-session`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider: 'webrtc' }),
    }
  );
  return response.json();
};
```

## Deployment Configuration

### Frontend (Netlify)

- **Build Command**: `CI=false GENERATE_SOURCEMAP=false npm run build`
- **Publish Directory**: `build`
- **Environment Variables**: Set all REACT*APP*\* variables

### Backend Integration Testing

After deployment, verify:

1. **Agent Loading**: Check `/api/repconnect/agents` returns 19 agents
2. **Chat Functionality**: Test `/api/repconnect/chat/message` endpoint
3. **WebSocket Connection**: Verify `/agents-ws` accepts RepConnect connections
4. **Voice Sessions**: Test voice session creation and ElevenLabs integration

## Common Issues & Solutions

### Agent Loading Issues

```bash
# Check if backend is responding
curl https://osbackend-zl1h.onrender.com/api/repconnect/agents

# Should return JSON with 19 agents
```

### WebSocket Connection Issues

```javascript
// Ensure correct appName is specified
const socket = io(BACKEND_URL, {
  path: '/agents-ws',
  auth: { token, appName: 'repconnect' }, // MUST be 'repconnect'
});
```

### Environment Variable Issues

```bash
# Check all required variables are set
echo $REACT_APP_BACKEND_URL
echo $REACT_APP_SUPABASE_URL
echo $REACT_APP_ELEVENLABS_API_KEY
```

## File Structure Overview

```
repconnect/
├── src/
│   ├── components/
│   │   ├── ChatbotLauncher/     # Main agent interface
│   │   ├── Harvey*.tsx          # Harvey-specific components
│   │   ├── Voice*.tsx           # Voice interface components
│   │   └── WebRTC*.tsx          # WebRTC components
│   ├── services/
│   │   ├── agentBackendAPI.js   # Backend integration
│   │   ├── agentChatAPI.js      # Chat functionality
│   │   ├── harveyAPI.js         # Harvey integration
│   │   └── webRTCVoiceService.ts # Voice services
│   └── config/
│       └── api.ts               # API configuration
├── backend-routes/              # Local backend routes (if any)
└── test-*.js                   # API testing scripts
```

This RepConnect frontend integrates with the unified agent system backend to provide comprehensive AI-powered sales coaching and voice conversation capabilities to sales representatives.
