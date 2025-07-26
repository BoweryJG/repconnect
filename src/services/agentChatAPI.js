// Agent Chat API Service
// Handles chat interactions with the agentbackend API

import { supabase } from '../lib/supabase';

const AGENT_BACKEND_URL =
  process.env.REACT_APP_AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

class AgentChatAPI {
  constructor() {
    this.baseURL = AGENT_BACKEND_URL;
    this.sessions = new Map();
  }

  // Helper method to get current auth headers
  async getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Get Supabase auth token
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Failed to get auth session:', error);
    }

    return headers;
  }

  // Create or get a chat session
  getSessionId(userId, agentId) {
    const key = `${userId}_${agentId}`;
    if (!this.sessions.has(key)) {
      this.sessions.set(key, `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    return this.sessions.get(key);
  }

  // Send a message to the chat API
  async sendMessage({ message, agentId, userId = 'anonymous', sessionId = null }) {
    try {
      const session = sessionId || this.getSessionId(userId, agentId);
      const headers = await this.getAuthHeaders();

      console.log('agentChatAPI: Sending to backend', {
        url: `${this.baseURL}/api/repconnect/chat/message`,
        conversationId: session,
        message: message,
        agentId: agentId,
      });

      // Use RepConnect chat endpoint instead of canvas endpoint
      const response = await fetch(`${this.baseURL}/api/repconnect/chat/message`, {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          conversationId: session,
          message: message,
          agentId: agentId,
        }),
      });

      console.log('agentChatAPI: Response status:', response.status);

      if (!response.ok) {
        // If canvas chat endpoint doesn't exist, try fallback
        if (response.status === 404) {
          console.warn('Canvas chat endpoint not found, using fallback response');
          return {
            success: true,
            message: `Hello! I'm ${agentId}. This is a fallback response since the chat backend isn't fully configured yet. The agent selection and UI are working correctly.`,
            agentId,
            sessionId: session,
            timestamp: new Date().toISOString(),
          };
        }
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const data = await response.json();

      // RepConnect API returns response directly
      return {
        success: true,
        message: data.response || data.message || "I'm here to help! How can I assist you today?",
        agentId: agentId,
        sessionId: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error sending message to agent:', error);
      return {
        success: false,
        error: error.message,
        message: "I'm having trouble connecting right now. Please try again.",
      };
    }
  }

  // Stream chat response (if supported by backend)
  async streamMessage({ message, agentId, userId = 'anonymous', sessionId = null, onChunk }) {
    try {
      const session = sessionId || this.getSessionId(userId, agentId);
      const headers = await this.getAuthHeaders();

      // Use RepConnect streaming endpoint
      const response = await fetch(`${this.baseURL}/api/repconnect/chat/stream`, {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          conversationId: session,
          message: message,
          agentId: agentId,
        }),
      });

      if (!response.ok) {
        // Enhanced error handling with specific messages
        let errorMessage = `Chat API error: ${response.statusText}`;

        if (response.status === 404) {
          errorMessage = 'Chat service endpoint not found. Please check if the backend is running.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please try logging in again.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. The backend service may be experiencing issues.';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
        }

        console.error(`Chat API Error (${response.status}):`, errorMessage);
        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullMessage += chunk;

        if (onChunk) {
          onChunk(chunk);
        }
      }

      return {
        success: true,
        message: fullMessage,
        agentId,
        sessionId: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error streaming message:', error);
      // Fallback to regular message
      return this.sendMessage({ message, agentId, userId, sessionId });
    }
  }

  // Get chat history
  async getChatHistory(sessionId) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/chat/history/${sessionId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        history: data.history || [],
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return {
        success: false,
        error: error.message,
        history: [],
      };
    }
  }

  // Clear session
  clearSession(userId, agentId) {
    const key = `${userId}_${agentId}`;
    this.sessions.delete(key);
  }

  // Clear all sessions
  clearAllSessions() {
    this.sessions.clear();
  }
}

// Create singleton instance
const agentChatAPI = new AgentChatAPI();

export default agentChatAPI;

// Export convenience methods
export const { sendMessage, streamMessage, getChatHistory, clearSession, clearAllSessions } =
  agentChatAPI;
