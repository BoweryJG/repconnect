# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `npm start` - Start development server (React)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier

### Testing

- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ci` - Run tests in CI mode

## Architecture Overview

### Core Application Structure

RepConnect is a **sales representative platform** React application integrated with the unified agent system backend for AI-powered sales coaching and voice conversations.

### Key Architectural Patterns

#### 1. Backend Integration (`src/config/api.ts`)

Fully integrated with the unified backend:

- **Primary Backend**: `osbackend-zl1h.onrender.com`
- **Fallback URL**: Configurable via `REACT_APP_BACKEND_URL`
- **Agent System**: Complete integration with 19 AI agents
- **Authentication**: Supabase Auth with JWT tokens

#### 2. Unified Agent System Integration

**Multi-Agent Architecture** supporting 19 specialized agents:

- **Agent Management**: REST API endpoints via `/api/repconnect/agents`
- **Chat Functionality**: Both WebSocket and REST API support
- **Voice Sessions**: ElevenLabs integration for voice conversations
- **Real-time Communication**: Socket.IO for streaming responses

#### 3. Voice & Communication System

**Advanced Voice Integration**:

- **19 Voice-Enabled Agents**: ElevenLabs TTS integration
- **WebRTC Support**: Real-time voice conversations
- **Deepgram Integration**: Speech-to-text processing
- **Twilio Integration**: Traditional phone call support

#### 4. Harvey Specter Integration

**Elite Coaching System**:

- **Harvey War Room**: 3D visualization with Three.js
- **Battle Mode**: Competitive sales challenges
- **Performance Analytics**: Real-time coaching metrics
- **WebSocket Connection**: Direct Harvey backend communication

### Component Architecture

#### Agent Integration Components (`src/components/`)

- **ChatbotLauncher/**: Main agent interface with 19 agents
- **AgentSelector.tsx**: Agent selection and filtering UI
- **VoiceModal\*.tsx**: Voice conversation interface components
- **WebRTCVoiceInterface\*.tsx**: WebRTC voice communication

#### Harvey-Specific Components

- **Harvey\*.tsx**: Harvey Specter-specific interface components
- **HarveyWarRoom.tsx**: 3D battle environment
- **HarveyCoachingDashboard.tsx**: Performance metrics display

#### Voice & Communication

- **Voice\*.tsx**: Voice interaction components
- **WebRTC\*.tsx**: WebRTC communication components
- **ChatInterface.tsx**: Text-based agent communication

### Data Flow

#### 1. Agent Selection Flow

```
User Selection → Agent Filter → API Request → Agent Details → Chat/Voice Interface
```

#### 2. Chat Communication Flow

```
User Message → WebSocket/REST → Agent Processing → Streaming Response → UI Update
```

#### 3. Voice Session Flow

```
Agent Selection → Voice Session API → ElevenLabs TTS → WebRTC Stream → Audio Interface
```

### Integration Points

#### Backend Synchronization Status

**RepConnect ↔ osbackend-zl1h.onrender.com Integration**

**✅ FULLY SYNCHRONIZED ENDPOINTS:**

- `GET /api/repconnect/agents` - List all RepConnect agents (✅ 19 agents)
- `GET /api/repconnect/agents/voice-enabled` - Voice-enabled agents (✅ 19 agents)
- `GET /api/repconnect/agents/harvey` - Harvey Specter specific (✅ Working)
- `GET /api/repconnect/agents/categories` - Agent categories (✅ Working)
- `GET /api/repconnect/agents/:id` - Specific agent details (✅ Working)
- `POST /api/repconnect/chat/stream` - Streaming chat SSE (✅ Working)
- `POST /api/repconnect/chat/message` - Standard chat messages (✅ Working)
- `POST /api/repconnect/chat/conversations` - Create conversation (✅ Working)
- `GET /api/repconnect/chat/conversations` - List conversations (✅ Working)
- `GET /api/repconnect/chat/conversations/:id` - Get conversation details (✅ Working)
- `POST /api/repconnect/agents/:id/start-voice-session` - Start voice session (✅ Working)
- `GET /health` - Backend health check (✅ Working)

**🔧 FUNCTIONAL FEATURES:**

- **Agent System**: Complete access to 19 AI agents across all categories
- **Chat Functionality**: Full WebSocket and REST API support
- **Voice Integration**: ElevenLabs TTS with all 19 agents
- **Harvey Integration**: Elite coaching system with battle mode
- **Authentication**: Supabase Auth with automatic token refresh
- **Real-time Communication**: Socket.IO streaming responses
- **Performance Analytics**: Coaching metrics and progress tracking

#### Agent Categories Available

**🏆 Elite Closers (2 agents)**

- Harvey Specter: Legendary closer with maximum aggression
- Victoria Sterling: Elite negotiator with sophisticated approach

**👥 Coaches (5 agents)**

- Coach Alex: Motivational sales coach (RepConnect exclusive)
- Alexis Rivera: Confidence and mindset coaching
- David Park: Strategic sales methodology
- Marcus Chen: Performance optimization
- Sarah Mitchell: Relationship building expertise

**🧠 Strategists (4 agents)**

- Hunter: Prospecting and lead generation specialist
- Closer: Deal-making and negotiation expert
- Educator: Teaching-focused medical procedure expert
- Strategist: Market intelligence and competitive analysis

**🩺 Medical Specialists (6 agents)**

- Dr. Amanda Foster, Dr. Harvey Stern, Dr. Lisa Martinez: Medical device experts
- Dr. Sarah Chen, Jake Thompson, Marcus Rodriguez: Specialized procedure experts

**🎤 Voice Representatives (2 RepConnect exclusive)**

- Marcus: Professional analytical approach
- Sarah: Friendly empathetic communication

#### External Services

- **Supabase**: Authentication and user management (`cbopynuvhcymbumjnvay.supabase.co`)
- **ElevenLabs**: Voice synthesis for all 19 agents
- **Deepgram**: Speech-to-text processing
- **Twilio**: Traditional phone call integration
- **Sentry**: Error monitoring and performance tracking

### State Management

#### React State Usage

- **React Hooks**: useState, useEffect for local component state
- **Zustand**: Global state management for agent selections and chat history
- **Context API**: Authentication state and user preferences
- **Custom Hooks**: Agent management and voice session handling

#### Data Persistence

- **Supabase**: User profiles, agent conversations, performance metrics
- **Local Storage**: Agent preferences, UI settings
- **Session Storage**: Temporary chat state and voice session data

### Important Development Notes

#### Environment Variables

**Backend Connection:**

- `REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com` (unified backend)

**Required for full functionality:**

- `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` (authentication)
- `REACT_APP_ELEVENLABS_API_KEY` (voice synthesis)
- `REACT_APP_DEEPGRAM_API_KEY` (speech-to-text)
- `REACT_APP_TWILIO_PHONE_NUMBER` (phone integration)
- `REACT_APP_HARVEY_API_URL` and `REACT_APP_HARVEY_WS_URL` (Harvey integration)

#### Build Configuration

- **React 18**: Modern React with concurrent features
- **TypeScript**: Full type safety across the application
- **Material-UI v5**: Comprehensive component library
- **Three.js**: 3D visualization for Harvey War Room

#### Error Handling

- **Sentry Integration**: Comprehensive error monitoring
- **Graceful Degradation**: Fallbacks when agents are unavailable
- **Authentication Recovery**: Automatic session refresh
- **Voice Session Recovery**: Reconnection handling for voice calls

#### Performance Considerations

- **Code Splitting**: Lazy loading for agent components
- **Memory Management**: Proper cleanup for voice sessions
- **WebSocket Management**: Connection pooling and reconnection
- **3D Optimization**: Efficient Three.js rendering for Harvey components

#### Mobile Optimization

- **Responsive Design**: Mobile-first agent interfaces
- **Touch-Friendly**: Optimized for mobile sales scenarios
- **Progressive Web App**: Offline capabilities for core features
- **Voice Optimization**: Mobile microphone and speaker handling

### Testing Strategy

- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing with user interaction focus
- **API Testing**: Backend endpoint verification scripts
- **Voice Testing**: ElevenLabs and WebRTC connection testing

### Security Implementation

- **JWT Authentication**: Secure Supabase token management
- **API Security**: Automatic token refresh and validation
- **Environment Secrets**: Secure API key management
- **CORS Configuration**: Proper origin validation for agent communication

## Backend Synchronization Status

### Overview

RepConnect is fully synchronized with the unified osbackend-zl1h.onrender.com backend. All agent functionality, chat capabilities, and voice integration are operational.

### RepConnect Backend Sync Status - Complete ✅

#### Agent System Integration

```javascript
// All agents accessible via unified backend:

// Elite Closers (2)
Harvey Specter, Victoria Sterling

// Coaches (5)
Coach Alex (RepConnect exclusive), Alexis Rivera, David Park, Marcus Chen, Sarah Mitchell

// Strategists (4)
Hunter, Closer, Educator, Strategist

// Medical Specialists (6)
Dr. Amanda Foster, Dr. Harvey Stern, Dr. Lisa Martinez, Dr. Sarah Chen, Jake Thompson, Marcus Rodriguez

// Voice Representatives (2 RepConnect exclusive)
Marcus, Sarah
```

#### Implementation Details

- **Backend**: Full agent management via `unified_agents` table
- **Frontend**: Complete agent integration via `src/services/agentBackendAPI.js`
- **Architecture**: Multi-modal communication (WebSocket + REST)
- **Features**: Complete AI coaching system with voice and chat

#### Communication Channels

- **WebSocket**: Real-time streaming chat via `/agents-ws` endpoint
- **REST API**: Full chat functionality via `/api/repconnect/chat/*` endpoints
- **Voice Sessions**: ElevenLabs integration via `/api/repconnect/agents/:id/start-voice-session`
- **Harvey Integration**: Direct connection to Harvey coaching system

#### Current Capabilities

- **19 AI Agents**: Full access to all unified backend agents
- **Voice Conversations**: ElevenLabs TTS with all agents
- **Real-time Chat**: WebSocket and REST API streaming support
- **Harvey War Room**: 3D battle environment with elite coaching
- **Performance Analytics**: Real-time coaching metrics and progress tracking
- **Mobile Optimization**: Full mobile-responsive agent interfaces

### Environment Configuration

```env
# Frontend Environment Variables
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
REACT_APP_SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key
REACT_APP_DEEPGRAM_API_KEY=your_deepgram_api_key
REACT_APP_TWILIO_PHONE_NUMBER=+18454090692

# Backend Environment Variables (on Render)
SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Integration Status Summary

- **Backend Integration**: 100% Complete ✅
- **Agent System**: Fully Functional (19 agents) ✅
- **Chat Functionality**: WebSocket + REST ✅
- **Voice Integration**: ElevenLabs TTS ✅
- **Harvey System**: Battle Mode Operational ✅
- **Performance Analytics**: Real-time Metrics ✅

RepConnect is fully integrated with the unified osbackend system and provides complete AI-powered sales coaching capabilities with 19 specialized agents, voice conversations, and elite performance coaching.

## File Naming Conventions

When creating new files:

- **Agent components**: Include "agent" in filename (e.g., `AgentSelector.tsx`)
- **Voice components**: Include "voice" in filename (e.g., `VoiceModal.tsx`)
- **Harvey components**: Include "harvey" in filename (e.g., `HarveyWarRoom.tsx`)
- **Chat components**: Include "chat" in filename (e.g., `ChatInterface.tsx`)

## Agent Integration Patterns

### Loading Agents

```javascript
// Correct way to load RepConnect agents
const loadRepConnectAgents = async () => {
  const response = await api.get('/api/repconnect/agents');
  return response.data.agents; // Returns 19 agents
};
```

### Chat Integration

```javascript
// WebSocket chat
const socket = io(API_BASE_URL, {
  path: '/agents-ws',
  auth: { token, appName: 'repconnect' },
});

// REST API chat
const sendMessage = async (agentId, message, conversationId) => {
  return await api.post('/api/repconnect/chat/message', {
    agentId,
    message,
    conversationId,
  });
};
```

### Voice Sessions

```javascript
// Start voice session
const startVoiceSession = async (agentId) => {
  return await api.post(`/api/repconnect/agents/${agentId}/start-voice-session`, {
    provider: 'webrtc',
  });
};
```

## Important Notes

- **Always use unified backend** for all agent functionality
- **19 agents available** across all categories with voice capabilities
- **Multi-modal communication** via WebSocket and REST API
- **Harvey integration** provides elite coaching with 3D battle environment
- **Mobile-optimized** for sales representatives in the field
- **Complete authentication** with automatic session management

This application serves as a comprehensive AI-powered sales coaching platform with full integration to the unified agent backend system.
