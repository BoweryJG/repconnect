# Agent Backend Migration Guide

This document outlines the changes made to integrate the remote agentbackend API into repconnect1.

## Overview

The repconnect1 application has been updated to load agent configurations from the remote agentbackend API (`https://agentbackend-2932.onrender.com`) instead of relying solely on local files.

## Changes Made

### 1. New Services Created

#### `/src/services/agentBackendAPI.js`
- Handles fetching agents from the remote API
- Provides caching for better performance
- Converts backend agent format to RepConnect format
- Categories supported: sales, coaching, aesthetic, dental, general

#### `/src/services/agentChatAPI.js`
- Manages chat interactions with the agentbackend
- Handles session management
- Provides fallback to the original backend if needed

#### `/src/services/serverAgentLoader.js`
- Server-side agent configuration loader
- Used by the WebSocket server for real-time chat
- Caches agent configurations for performance

### 2. Updated Components

#### `/src/components/ChatbotLauncher/agents/agentConfigs.ts`
- Now loads agents dynamically from the remote API
- Local agents serve as fallback
- Async functions: `initializeAgents()`, `getAllAgents()`, `getAgentConfig()`
- Added support for sales and coaching categories

#### `/src/components/ChatbotLauncher/agents/remoteAgentLoader.ts`
- Handles the conversion between backend and frontend agent formats
- Maps emojis to Lucide icons
- Generates appropriate conversation starters

#### `/src/components/ChatbotLauncher/ChatbotIntegration.tsx`
- Updated to load agents asynchronously on component mount
- Shows loading state while fetching agents
- Automatically requests sales and coaching agents

#### `/src/components/ChatbotLauncher/ChatModal.tsx`
- Uses the new `agentChatAPI` service for messaging
- Falls back to the original backend if agentbackend is unavailable
- Maintains session IDs for conversation continuity

#### `/server.js`
- Updated to load agent personalities from the remote API
- Falls back to local Harvey personality if remote agent not found

### 3. Environment Variables

Add these to your `.env` file:

```env
# Agent Backend Configuration
REACT_APP_AGENT_BACKEND_URL=https://agentbackend-2932.onrender.com
AGENT_BACKEND_URL=https://agentbackend-2932.onrender.com
REACT_APP_USE_REMOTE_AGENTS=true
```

### 4. API Endpoints Used

- `GET /api/agents` - Fetch all agents (with optional category filter)
- `GET /api/agents/:id` - Get specific agent by ID
- `POST /api/chat` - Send chat messages to agents

### 5. Categories Mapping

The system maps agents to categories:
- **Sales**: victor, maxwell, diana, marcus, sophia
- **Coaching**: Agents with coaching roles
- **Aesthetic**: botox, fillers, skincare, laser, bodycontouring
- **Dental**: implants, orthodontics, cosmetic
- **General**: harvey and other general-purpose agents

## Benefits

1. **Centralized Management**: All agent configurations can be managed from the agentbackend
2. **Dynamic Updates**: Changes to agents don't require redeploying repconnect1
3. **Scalability**: Easy to add new agents without modifying code
4. **Consistency**: Same agent configurations across all applications
5. **Fallback Support**: Local agents still work if the backend is unavailable

## Testing

1. Start the application with the new environment variables
2. Open the chatbot launcher - it should load agents from the remote API
3. Select an agent and start a conversation
4. Voice configurations should still work with remote agents
5. If the agentbackend is down, local agents should still function

## Rollback

To rollback to local-only agents:
1. Set `REACT_APP_USE_REMOTE_AGENTS=false` in your environment
2. The system will use only local agent configurations

## Future Enhancements

1. Add agent search functionality
2. Implement agent filtering by capabilities
3. Add real-time agent availability status
4. Support for agent-specific API keys or authentication
5. WebSocket support for streaming responses