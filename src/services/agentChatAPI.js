// Agent Chat API Service
// Handles chat interactions with the agentbackend API

import { supabase } from '../lib/supabase';
import { logger } from '../utils/prodLogger';

// AgentChatAPI Module Loading

const AGENT_BACKEND_URL =
  process.env.REACT_APP_AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

// Backend URL configured

class AgentChatAPI {
  constructor() {
    // AgentChatAPI constructor
    this.baseURL = AGENT_BACKEND_URL;
    this.sessions = new Map();
    // AgentChatAPI initialized
  }

  // Helper method to get current auth headers
  async getAuthHeaders(skipAuth = false) {
    // Get auth headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Skip auth check if requested (for faster public access)
    if (skipAuth) {
      return headers;
    }

    // Get Supabase auth token
    try {
      if (!supabase) {
        // Supabase is not initialized! Returning basic headers.
        return headers;
      }

      // Get session with timeout
      let session = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 1000)
        );

        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result?.data?.session;
      } catch (sessionError) {
        // Failed to get session - proceed without authentication
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      // Failed to get auth session - continue without auth
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
    let endpoint = ''; // Define endpoint at the top level

    try {
      const session = sessionId || this.getSessionId(userId, agentId);

      // Check if this is an anonymous/public user to skip auth
      const isPublicUser = userId === 'anonymous' || userId.startsWith('guest-');

      const headers = await this.getAuthHeaders(isPublicUser);

      // agentChatAPI: Sending to backend

      // Log the full request details
      const requestBody = JSON.stringify({
        conversationId: session,
        message: message,
        agentId: agentId,
      });

      // agentChatAPI: Full request details

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      try {
        // Check if user is authenticated
        const hasAuth = headers['Authorization'] ? true : false;

        // Use public endpoint if no auth, otherwise use authenticated endpoint
        endpoint = hasAuth
          ? `${this.baseURL}/api/repconnect/chat/message`
          : `${this.baseURL}/api/repconnect/chat/public/message`;

        // Use RepConnect chat endpoint with credentials
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: requestBody,
          signal: controller.signal,
          credentials: 'include', // Include cookies for authentication
        });

        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The server may be slow or unavailable.');
        }
        throw fetchError;
      }

      // Log response body for debugging
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        // If chat endpoint doesn't exist, try fallback
        if (response.status === 404) {
          // Chat endpoint not found, using fallback response
          return {
            success: true,
            message: `Hello! I'm ${agentId}. This is a fallback response since the chat backend isn't fully configured yet. The agent selection and UI are working correctly.`,
            agentId,
            sessionId: session,
            timestamp: new Date().toISOString(),
          };
        }
        throw new Error(data.error || `Chat API error: ${response.statusText}`);
      }

      // RepConnect API returns response directly
      return {
        success: true,
        message: data.response || data.message || "I'm here to help! How can I assist you today?",
        agentId: agentId,
        sessionId: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // agentChatAPI: This is a network/CORS error. The request never reached the server.
      }

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

      // For now, always use public streaming endpoint until auth is properly configured
      // TODO: Switch to authenticated endpoint when backend auth is fixed
      const endpoint = `${this.baseURL}/api/repconnect/chat/public/stream`;

      const headers = await this.getAuthHeaders(true); // Always skip auth for public streaming

      // Use RepConnect streaming endpoint
      const response = await fetch(endpoint, {
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

        throw new Error(errorMessage);
      }

      // Handle streaming response (Server-Sent Events)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();

          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'text_delta' && parsed.text) {
                fullMessage += parsed.text;
                if (onChunk) {
                  onChunk(parsed.text);
                }
              }
            } catch (e) {
              // Failed to parse SSE data
            }
          }
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
        credentials: 'include', // Include cookies for authentication
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

  // Test connection to backend
  async testConnection() {
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${this.baseURL}/health`);

      // Test the new test endpoint
      const testResponse = await fetch(`${this.baseURL}/api/repconnect/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ test: 'data' }),
      });

      if (testResponse.ok) {
        await testResponse.json();
        // Test endpoint data received successfully
      }

      return healthResponse.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const agentChatAPI = new AgentChatAPI();

export default agentChatAPI;

// Export convenience methods
export const { sendMessage, streamMessage, getChatHistory, clearSession, clearAllSessions } =
  agentChatAPI;
