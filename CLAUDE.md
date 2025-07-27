# CLAUDE.md

This file provides essential guidance to Claude Code when working with the RepConnect codebase.

## Project Overview

RepConnect is an AI-powered sales CRM platform featuring:

- **19 AI agents** for sales coaching and assistance
- **Harvey Specter elite coaching** with 3D battle visualization
- **Multi-modal communication** (WebSocket, REST API, WebRTC)
- **Voice integration** with ElevenLabs, Deepgram, and Twilio
- **Real-time performance analytics** and gamification

## Essential Commands

### Development & Quality Checks

```bash
npm start              # Start development server
npm run build          # Production build (CI=false GENERATE_SOURCEMAP=false)
npm test               # Run tests
npm run lint           # ESLint checks
npm run typecheck      # TypeScript type checking (if configured)
```

## Architecture Patterns

### 1. Backend Integration Pattern

The application uses a unified backend at `osbackend-zl1h.onrender.com` with automatic fallback:

```typescript
// src/config/api.ts pattern
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';
```

**Key Integration Points:**

- Agent management via `/api/repconnect/agents`
- Chat streaming via WebSocket `/agents-ws` and REST `/api/repconnect/chat/*`
- Voice sessions via `/api/repconnect/agents/:id/start-voice-session`
- Harvey coaching via dedicated WebSocket connection

### 2. Multi-Modal Communication Pattern

The app supports three communication modes that work together:

```typescript
// WebSocket for real-time chat
const socket = io(API_BASE_URL, {
  path: '/agents-ws',
  auth: { token, appName: 'repconnect' },
});

// REST API for structured requests
const response = await api.post('/api/repconnect/chat/message', data);

// WebRTC for voice conversations
const session = await startVoiceSession(agentId);
```

### 3. State Management Pattern

- **Zustand** for global agent state and chat history
- **React Context** for authentication and user preferences
- **Local hooks** for component-specific state
- **Session storage** for temporary voice session data

### 4. Component Organization Pattern

**Feature-Based Structure:**

```
src/components/
├── ChatbotLauncher/     # Main agent interface (chatbot launcher returns null check)
├── Harvey*/             # Harvey-specific components (War Room, Battle Mode)
├── Voice*/              # Voice interaction components
├── WebRTC*/             # WebRTC communication
└── UserAvatar.tsx       # User profile with sign-out tooltip
```

**Key Component Behaviors:**

- ChatbotLauncher loads agents for ALL users (no auth requirement)
- UserAvatar shows "Click to sign out" tooltip when clickable
- Harvey components use Three.js for 3D visualization
- Voice components handle both ElevenLabs TTS and Deepgram STT

### 5. Authentication Flow Pattern (Updated 2025-01-27)

```typescript
// AuthCallback.tsx pattern for OAuth handling
const { data, error } = await supabase.auth.getSession();
if (data.session) {
  // Give AuthContext time to process
  setTimeout(() => navigate('/'), 500);
}

// AuthContext.tsx improvements
// 1. Reduced session timeout for faster auth checks
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Session fetch timeout')), 1000)
);

// 2. Proper auth state change handling
onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    setUser(null);
    setSession(null);
    setProfile(null);
  } else if (session?.user) {
    setSession(session);
    setUser(session.user);
    const userProfile = await createOrUpdateProfile(session.user);
    if (userProfile) setProfile(userProfile);
  }
});

// 3. Public vs Authenticated endpoints
// Public users (guest-*, anonymous) skip auth and use public endpoints
const isPublicUser = userId === 'anonymous' || userId.startsWith('guest-');
const endpoint = hasAuth ? '/api/repconnect/chat/message' : '/api/repconnect/chat/public/message';
```

## Critical Implementation Details

### 1. Favicon Configuration (Cross-Platform)

```html
<!-- public/index.html pattern for Apple device support -->
<!-- PNG fallbacks required - Apple devices don't support SVG favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/logo192.png?v=7" />
<link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png?v=6" />
```

**public/manifest.json** prioritizes PNG icons for compatibility:

```json
{
  "icons": [
    { "src": "logo192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "logo512.png", "type": "image/png", "sizes": "512x512" }
  ]
}
```

### 2. Build Configuration (Netlify)

```toml
# netlify.toml - Disable secrets scanning for client-side env vars
[build.environment]
  SECRETS_SCAN_ENABLED = "false"
```

Build command: `CI=false GENERATE_SOURCEMAP=false npm run build`

### 3. Error Handling Patterns

- **Loading States**: Never return null during auth loading (causes UI flicker)
- **Session Recovery**: AuthCallback includes retry logic and timing delays
- **WebSocket Reconnection**: Automatic reconnection with exponential backoff
- **Voice Session Recovery**: Graceful handling of connection drops

## Agent System (35 Total Agents, 6 B2B Knowledge Domains)

### Agent Categories

- **Elite Closers** (2): Harvey Specter, Victoria Sterling
- **Coaches** (5): Coach Alex (exclusive), Alexis Rivera, David Park, Marcus Chen, Sarah Mitchell
- **Strategists** (4): Hunter, Closer, Educator, Strategist
- **Medical Specialists** (6): Dr. Foster, Dr. Stern, Dr. Martinez, Dr. Chen, Jake Thompson, Marcus Rodriguez
- **Voice Representatives** (2 exclusive): Marcus, Sarah
- **Procedure Experts** (13): Toxi, Fillmore, Dewey, Blazer, Chilly, Steely, Straightz, Shimmer, and others
- **General** (3): Harvey AI, Victor, Diana

### B2B Medical Device Sales Knowledge Domains

The system includes 6 comprehensive B2B sales knowledge domains for training sales reps on selling medical devices TO doctors (not patient-facing):

1. **Neurotoxin Sales** (Botox/Dysport/Daxxify) - 19 agents
2. **All-on-4 Dental Implants** - 18 agents
3. **Fraxel Laser Systems** - 19 agents
4. **RF Microneedling** (Morpheus8, Vivace, Secret) - 18 agents
5. **Body Contouring** (CoolSculpting, EmSculpt) - 23 agents
6. **Yomi Robotic Dental Surgery** ($220K system, $4-6K/month membership) - 9 agents

Each domain includes:

- Socratic discovery questions
- ROI models and pricing strategies
- Objection handling frameworks
- 2025 market data and trends
- Consultative, non-pushy challenger approach

### Loading Agents Pattern

```javascript
// Agents now load from osbackend with knowledge domains
useEffect(() => {
  const loadAgents = async () => {
    // All agents come from osbackend - no local definitions
    await initializeAgents(['sales', 'coaching']);
    const response = await api.get('/api/repconnect/agents');
    // Each agent includes knowledge_domains array
    setAgents(response.agents);
  };
  loadAgents();
}, []);
```

## Environment Variables

```env
# Required
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
REACT_APP_SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_key

# Voice Features
REACT_APP_ELEVENLABS_API_KEY=your_key
REACT_APP_DEEPGRAM_API_KEY=your_key
REACT_APP_TWILIO_PHONE_NUMBER=+18454090692

# Harvey System
REACT_APP_HARVEY_API_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_WS_URL=wss://osbackend-zl1h.onrender.com/harvey-ws
```

## Tech Stack Highlights

- **React 18** with TypeScript
- **Material-UI v5** for components
- **Three.js** for 3D Harvey War Room
- **Zustand** for state management
- **Socket.IO** for real-time communication
- **Framer Motion** for animations
- **Supabase** for auth and database

## Common Tasks & Solutions

### 1. Chatbot Launcher Disappearing on Auth State Change

```typescript
// ❌ Wrong - causes UI flicker
if (isLoading) return null;

// ✅ Correct - maintain UI during loading
if (isLoading) return <LoadingSpinner />;
```

### 2. Sign-Out Not Obvious to Users (FIXED 2025-01-27)

```typescript
// UserAvatar.tsx pattern
if (onClick) {
  return (
    <Tooltip title="Click to sign out" placement="bottom">
      {avatarContent}
    </Tooltip>
  );
}

// AuthContext.tsx - proper SIGNED_OUT handling
onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    setUser(null);
    setSession(null);
    setProfile(null);
  }
});
```

### 3. Authentication Callback Issues

```typescript
// AuthCallback.tsx - proper session handling
const { data } = await supabase.auth.getSession();
if (data.session) {
  // Give AuthContext time to process
  setTimeout(() => navigate('/'), 500);
}
```

### 4. Netlify Build Failures (Secrets Scanning)

```toml
# netlify.toml
[build.environment]
  SECRETS_SCAN_ENABLED = "false"
```

### 5. Voice Session Management

```javascript
// Proper cleanup on unmount
useEffect(() => {
  return () => {
    if (voiceSession) {
      voiceSession.disconnect();
    }
  };
}, [voiceSession]);
```

### 6. Chat Response Streaming (Updated 2025-01-27)

```javascript
// agentChatAPI.js - Always use public streaming endpoint
async streamMessage({ message, agentId, userId, sessionId, onChunk }) {
  // IMPORTANT: Always use public endpoint until backend auth is fixed
  const endpoint = `${this.baseURL}/api/repconnect/chat/public/stream`;
  const headers = await this.getAuthHeaders(true); // Skip auth for public

  // Fallback to regular message if streaming fails
  if (!response.ok) {
    return this.sendMessage({ message, agentId, userId, sessionId });
  }
}

// Reduced auth timeout for faster responses
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Session fetch timeout')), 1000) // Was 5000ms
);
```

### 7. Agent ID Format (Important!)

```javascript
// Agents use UUIDs, not slug names
// ❌ Wrong
agentId: 'harvey-specter';

// ✅ Correct
agentId: '00ed4a18-12f9-4ab0-9c94-2915ad94a9b1'; // Harvey Specter

// Get agent IDs from API
const response = await fetch('/api/repconnect/agents');
const agents = response.data.agents;
```

## Troubleshooting Guide

### Backend Connection Issues

**Problem**: Chat responses taking 8+ seconds

- **Cause**: Auth session timeout was set to 5 seconds
- **Solution**: Reduced to 1 second in `agentChatAPI.js:50`

**Problem**: Streaming returns 401 Unauthorized

- **Cause**: Public users being sent to authenticated endpoint
- **Solution**: Always use `/api/repconnect/chat/public/stream` for now

**Problem**: Backend returns 502 Bad Gateway

- **Cause**: Backend streaming endpoint not fully implemented
- **Solution**: Frontend falls back to regular message endpoint automatically

### Authentication Issues

**Problem**: Can't log out / keeps returning to signed-in state

- **Cause**: AuthContext not handling SIGNED_OUT event
- **Solution**: Added proper event handling in `AuthContext.tsx:176-180`

**Problem**: Auth state flickers during loading

- **Cause**: Components returning null during auth checks
- **Solution**: Return loading spinner instead of null

### Agent Selection Issues

**Problem**: "Invalid input syntax for type uuid"

- **Cause**: Using agent name instead of UUID
- **Solution**: Use actual agent IDs from `/api/repconnect/agents`
- **Example**: Harvey Specter = `00ed4a18-12f9-4ab0-9c94-2915ad94a9b1`

## Key Files to Understand

1. **src/config/api.ts** - Backend integration configuration
2. **src/components/ChatbotLauncher/ChatbotIntegration.tsx** - Main agent interface
3. **src/components/UserAvatar.tsx** - User profile with sign-out
4. **src/pages/AuthCallback.tsx** - OAuth callback handling
5. **src/components/HarveyWarRoom.tsx** - 3D battle visualization
6. **src/services/agentBackendAPI.js** - Agent API integration
7. **src/services/agentChatAPI.js** - Chat API with streaming support
8. **src/auth/AuthContext.tsx** - Authentication state management
9. **public/index.html** - Favicon and meta tag configuration
10. **netlify.toml** - Deployment configuration
