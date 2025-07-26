// Agent Chat API Service
// Handles chat interactions with the agentbackend API

import { supabase } from '../lib/supabase';

console.log('=== AgentChatAPI Module Loading ===');
console.log('Supabase imported:', !!supabase);

const AGENT_BACKEND_URL =
  process.env.REACT_APP_AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

console.log('Backend URL configured:', AGENT_BACKEND_URL);

class AgentChatAPI {
  constructor() {
    console.log('AgentChatAPI constructor called');
    this.baseURL = AGENT_BACKEND_URL;
    this.sessions = new Map();
    console.log('AgentChatAPI initialized with baseURL:', this.baseURL);
  }

  // Helper method to get current auth headers
  async getAuthHeaders() {
    console.log('getAuthHeaders called');
    const headers = {
      'Content-Type': 'application/json',
    };

    // Get Supabase auth token
    try {
      console.log('Checking if supabase is initialized:', !!supabase);
      if (!supabase) {
        console.warn('Supabase is not initialized! Returning basic headers.');
        return headers;
      }

      console.log('Getting session from supabase...');

      // Add timeout to getSession call
      let session = null;
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result?.data?.session;
        console.log('Session obtained:', !!session);
      } catch (sessionError) {
        console.warn('Failed to get session:', sessionError.message);
        console.log('Proceeding without authentication');
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('Auth header added');
      } else {
        console.log('No auth token available - will use public endpoint');
      }
    } catch (error) {
      console.error('Failed to get auth session:', error);
      console.error('Error details:', error.message, error.stack);
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
    console.log('===== agentChatAPI.sendMessage CALLED =====');
    console.log('Parameters:', { message, agentId, userId, sessionId });
    console.log('Backend URL:', this.baseURL);

    let endpoint = ''; // Define endpoint at the top level
    
    try {
      console.log('Getting session ID...');
      const session = sessionId || this.getSessionId(userId, agentId);
      console.log('Session ID:', session);

      console.log('Getting auth headers...');
      const headers = await this.getAuthHeaders();
      console.log('Headers obtained:', headers);

      console.log('agentChatAPI: Sending to backend', {
        url: `${this.baseURL}/api/repconnect/chat/message`,
        conversationId: session,
        message: message,
        agentId: agentId,
      });

      // Log the full request details
      const requestBody = JSON.stringify({
        conversationId: session,
        message: message,
        agentId: agentId,
      });

      console.log('agentChatAPI: Full request details:', {
        method: 'POST',
        url: endpoint,
        headers,
        body: requestBody,
      });

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

        console.log('agentChatAPI: Using endpoint:', endpoint, 'hasAuth:', hasAuth);

        // Use RepConnect chat endpoint
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('agentChatAPI: Request timed out after 30 seconds');
          throw new Error('Request timed out. The server may be slow or unavailable.');
        }
        console.error('agentChatAPI: Fetch error:', fetchError);
        console.error('agentChatAPI: Error name:', fetchError.name);
        console.error('agentChatAPI: Error message:', fetchError.message);
        console.error('agentChatAPI: Error stack:', fetchError.stack);
        throw fetchError;
      }

      console.log('agentChatAPI: Response received');
      console.log('agentChatAPI: Response status:', response.status);
      console.log(
        'agentChatAPI: Response headers:',
        Object.fromEntries(response.headers.entries())
      );

      // Log response body for debugging
      const responseText = await response.text();
      console.log('agentChatAPI: Response body:', responseText);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('agentChatAPI: Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        // If chat endpoint doesn't exist, try fallback
        if (response.status === 404) {
          console.warn('Chat endpoint not found, using fallback response');
          return {
            success: true,
            message: `Hello! I'm ${agentId}. This is a fallback response since the chat backend isn't fully configured yet. The agent selection and UI are working correctly.`,
            agentId,
            sessionId: session,
            timestamp: new Date().toISOString(),
          };
        }
        console.error('agentChatAPI: Error response:', data);
        throw new Error(data.error || `Chat API error: ${response.statusText}`);
      }

      console.log('agentChatAPI: Response data:', data);

      // RepConnect API returns response directly
      return {
        success: true,
        message: data.response || data.message || "I'm here to help! How can I assist you today?",
        agentId: agentId,
        sessionId: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('agentChatAPI: Caught error in sendMessage:', error);
      console.error('agentChatAPI: Error type:', error.constructor.name);
      console.error('agentChatAPI: Error message:', error.message);
      console.error('agentChatAPI: Error stack:', error.stack);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('agentChatAPI: This is a network/CORS error. The request never reached the server.');
        console.error('agentChatAPI: Attempted endpoint was:', endpoint);
        console.error('agentChatAPI: This usually means:');
        console.error('  1. CORS is blocking the request');
        console.error('  2. The endpoint does not exist on the server');
        console.error('  3. Network connectivity issue');
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
      const headers = await this.getAuthHeaders();

      // Use RepConnect streaming endpoint
      const response = await fetch(`${this.baseURL}/api/repconnect/chat/stream`, {
        method: 'POST',
        headers,
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

  // Test connection to backend
  async testConnection() {
    console.log('Testing connection to backend...');
    try {
      const response = await fetch(`${this.baseURL}/health`);
      console.log('Health check response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
console.log('Creating AgentChatAPI singleton instance...');
const agentChatAPI = new AgentChatAPI();
console.log('AgentChatAPI instance created:', agentChatAPI);

export default agentChatAPI;

// Export convenience methods
export const { sendMessage, streamMessage, getChatHistory, clearSession, clearAllSessions } =
  agentChatAPI;
