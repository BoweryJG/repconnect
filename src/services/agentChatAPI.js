// Agent Chat API Service
// Handles chat interactions with the agentbackend API

import { supabase } from '../lib/supabase';

const AGENT_BACKEND_URL =
  process.env.REACT_APP_AGENT_BACKEND_URL || 'https://agentbackend-2932.onrender.com';

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

      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          agentId,
          userId,
          sessionId: session,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message,
        agentId: data.agentId,
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

      const response = await fetch(`${this.baseURL}/api/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          agentId,
          userId,
          sessionId: session,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
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
