# RepConnect Conversational Agents - End-to-End Implementation Plan

## Overview

Enable 47 RepConnect agents to support both text chat AND voice conversations, with a unified interface and real-time sales coaching capabilities.

## Current Status ✅

- **WebSocket Service**: Created and integrated for real-time chat
- **Chat Modal**: Updated to use WebSocket with connection status and typing indicators
- **Agent Launcher**: Modified to show chat/voice buttons directly on agent cards
- **Backend**: WebSocket server ready at `/agents-ws`, voice endpoints at `/api/repconnect/agents/:id/start-voice-session`

## Phase 1: Text Chat (COMPLETED) ✅

### 1.1 WebSocket Service Implementation ✅

- Created `websocketChatService.ts` with real-time messaging
- Automatic reconnection with exponential backoff
- Streaming message support with chunk handlers
- Typing indicators and connection status

### 1.2 Chat Modal Updates ✅

- Integrated WebSocket for real-time responses
- Added connection status indicator (Live/Offline)
- Shows typing indicators when agent is responding
- Fallback to REST API when WebSocket unavailable

### 1.3 Agent Launcher UI ✅

- Direct chat/voice buttons on each agent card
- Hover to reveal action buttons
- Immediate mode selection without intermediate screen

## Phase 2: Voice Conversations (IN PROGRESS) 🚧

### 2.1 Fix SimpleVoiceModal WebRTC Integration

```typescript
// Key improvements needed:
1. Proper WebRTC initialization with STUN/TURN servers
2. ElevenLabs voice integration for agent responses
3. Deepgram integration for user speech-to-text
4. Connection state management and error recovery
```

### 2.2 Voice Session Flow

```typescript
// 1. Start voice session
POST /api/repconnect/agents/:agentId/start-voice-session

// 2. Establish WebRTC connection
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// 3. Handle audio streams
- User microphone → Deepgram STT → Backend
- Backend response → ElevenLabs TTS → User speakers
```

### 2.3 Voice UI Components

- Microphone permission handling
- Visual audio level indicators
- Call timer and controls
- Graceful disconnection

## Phase 3: Whisper Feature (FUTURE) 🔮

### 3.1 Real-Time Sales Coaching

```typescript
interface WhisperConfig {
  twilioPhoneNumber: string; // User's provisioned number
  coachingAgentId: string; // AI coach listening to call
  whisperOnly: boolean; // Coach only audible to rep
}
```

### 3.2 Twilio Integration

- Monitor active calls via Twilio webhook
- Real-time transcription of both parties
- AI coach analyzes conversation and provides tips
- Whisper audio channel only to sales rep

### 3.3 Whisper UI

- Floating coach widget during calls
- Real-time coaching suggestions
- Conversation analysis metrics
- Post-call summary and improvements

## Implementation Timeline

### Week 1: Voice Infrastructure ⏳

- [ ] Fix WebRTC connection in SimpleVoiceModal
- [ ] Integrate ElevenLabs for agent voices
- [ ] Add Deepgram for speech recognition
- [ ] Test with multiple agents

### Week 2: Polish & Testing 🧪

- [ ] Add visual feedback for voice calls
- [ ] Implement connection recovery
- [ ] Test across different browsers
- [ ] Performance optimization

### Week 3: Whisper Feature 🎯

- [ ] Design whisper architecture
- [ ] Implement Twilio call monitoring
- [ ] Create coaching interface
- [ ] Beta test with select users

## Technical Architecture

### Frontend Components

```
src/components/
├── ChatbotLauncher/
│   ├── SimpleChatbotLauncher.tsx  ✅ (Updated with dual buttons)
│   ├── SimpleChatModal.tsx        ✅ (WebSocket integrated)
│   └── SimpleVoiceModal.tsx       🚧 (Needs WebRTC fixes)
├── WhisperCoach/                  🔮 (To be created)
│   ├── WhisperInterface.tsx
│   └── CoachingWidget.tsx
└── services/
    ├── websocketChatService.ts    ✅ (Real-time chat)
    ├── webrtcVoiceService.ts      🚧 (Voice calls)
    └── whisperCoachService.ts     🔮 (Coaching)
```

### Backend Endpoints

```
# Chat (WebSocket)
/agents-ws                         ✅ Real-time chat

# Voice (REST + WebRTC)
/api/repconnect/agents/:id/start-voice-session  ✅ Initiate call
/api/repconnect/voice/ice-candidates            🚧 WebRTC signaling

# Whisper (Future)
/api/repconnect/whisper/monitor     🔮 Start call monitoring
/api/repconnect/whisper/coach       🔮 Get coaching advice
```

## Key Decisions

1. **Unified Agent Experience**: Same agents, same personalities, choice of text or voice
2. **Progressive Enhancement**: Text chat works immediately, voice requires permissions
3. **Graceful Fallbacks**: WebSocket → REST API, Voice → Text suggestions
4. **Real-Time Priority**: WebSocket for chat, WebRTC for voice, minimal latency

## Success Metrics

- [ ] All 47 agents support both text and voice
- [ ] < 100ms message latency for text chat
- [ ] < 500ms voice response time
- [ ] 95%+ connection success rate
- [ ] Whisper coaching improves call outcomes by 20%+

## Next Steps

1. **Immediate**: Test current text chat implementation thoroughly
2. **Tomorrow**: Begin WebRTC fixes in SimpleVoiceModal
3. **This Week**: Complete voice integration with ElevenLabs
4. **Next Week**: Design and prototype whisper feature

## Notes for Development

- Always test with both authenticated and guest users
- Monitor WebSocket connection health
- Handle browser permissions gracefully
- Provide clear feedback for all user actions
- Keep latency under 500ms for real-time feel
