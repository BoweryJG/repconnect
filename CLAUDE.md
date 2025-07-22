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

### 5. Authentication Flow Pattern

```typescript
// AuthCallback.tsx pattern for OAuth handling
const { data, error } = await supabase.auth.getSession();
if (data.session) {
  // Give AuthContext time to process
  setTimeout(() => navigate('/'), 500);
}
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

## Agent System (19 Total)

### Agent Categories

- **Elite Closers** (2): Harvey Specter, Victoria Sterling
- **Coaches** (5): Coach Alex (exclusive), Alexis Rivera, David Park, Marcus Chen, Sarah Mitchell
- **Strategists** (4): Hunter, Closer, Educator, Strategist
- **Medical Specialists** (6): Dr. Foster, Dr. Stern, Dr. Martinez, Dr. Chen, Jake Thompson, Marcus Rodriguez
- **Voice Representatives** (2 exclusive): Marcus, Sarah

### Loading Agents Pattern

```javascript
// Initialize agents for all users (no auth check)
useEffect(() => {
  const loadAgents = async () => {
    await initializeAgents(['sales', 'coaching']);
    setAgents(await api.get('/api/repconnect/agents'));
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

### 2. Sign-Out Not Obvious to Users

```typescript
// UserAvatar.tsx pattern
if (onClick) {
  return (
    <Tooltip title="Click to sign out" placement="bottom">
      {avatarContent}
    </Tooltip>
  );
}
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

## Key Files to Understand

1. **src/config/api.ts** - Backend integration configuration
2. **src/components/ChatbotLauncher/ChatbotIntegration.tsx** - Main agent interface
3. **src/components/UserAvatar.tsx** - User profile with sign-out
4. **src/pages/AuthCallback.tsx** - OAuth callback handling
5. **src/components/HarveyWarRoom.tsx** - 3D battle visualization
6. **src/services/agentBackendAPI.js** - Agent API integration
7. **public/index.html** - Favicon and meta tag configuration
8. **netlify.toml** - Deployment configuration
