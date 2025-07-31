import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

interface MessageChunk {
  conversationId: string;
  chunk: string;
  chunkId: number;
}

interface MessageComplete {
  conversationId: string;
  messageId: string;
}

interface AgentTyping {
  isTyping: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentId?: string;
}

class WebSocketChatService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers = new Map<string, (_message: ChatMessage) => void>();
  private chunkHandlers = new Map<string, (_chunk: string) => void>();
  private typingHandlers = new Map<string, (_isTyping: boolean) => void>();
  private authSubscription: any = null;
  private currentSession: any = null;

  constructor() {
    this.setupAuthListener();
    this.connect();
  }

  private setupAuthListener() {
    // Listen for auth state changes
    this.authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('WebSocket: Auth state changed:', event);

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          this.currentSession = session;
          // Reconnect with new session
          if (this.socket?.connected) {
            this.disconnect();
          }
          await this.connect();
          break;

        case 'SIGNED_OUT':
          this.currentSession = null;
          this.disconnect();
          break;

        case 'USER_UPDATED':
          // Session might have changed, reconnect
          if (session?.access_token !== this.currentSession?.access_token) {
            this.currentSession = session;
            this.reconnect();
          }
          break;
      }
    });
  }

  private async handleAuthError() {
    try {
      // Try to refresh the session
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        console.error('WebSocket: Failed to refresh session:', error);
        // Session expired, user needs to log in again
        this.currentSession = null;
        this.disconnect();
        return;
      }

      if (session) {
        // console.log('WebSocket: Session refreshed successfully');
        this.currentSession = session;
        await this.reconnect();
      }
    } catch (error) {
      console.error('WebSocket: Error handling auth error:', error);
      this.disconnect();
    }
  }

  private async connect() {
    try {
      // Use stored session or get current session
      let session = this.currentSession;
      if (!session) {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        session = currentSession;
        this.currentSession = currentSession;
      }

      if (!session?.access_token) {
        console.warn('WebSocket: No auth token available, skipping connection');
        return;
      }

      const baseURL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

      this.socket = io(baseURL, {
        path: '/agents-ws',
        auth: {
          token: session.access_token,
          appName: 'repconnect',
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket: Connection error:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // console.log('WebSocket: Connected to agent chat');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      // console.log('WebSocket: Disconnected from agent chat');
      this.isConnected = false;
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket: Error:', error);

      // Handle authentication errors
      if (error.type === 'UnauthorizedError' || error.code === 'invalid_token') {
        console.error('WebSocket: Authentication error, refreshing session...');
        this.handleAuthError();
      }
    });

    // Handle authentication errors from server
    this.socket.on('unauthorized', (error: any) => {
      console.error('WebSocket: Unauthorized:', error);
      this.handleAuthError();
    });

    // Handle message chunks for streaming
    this.socket.on('agent:message:chunk', (data: MessageChunk) => {
      const handler = this.chunkHandlers.get(data.conversationId);
      if (handler) {
        handler(data.chunk);
      }
    });

    // Handle message completion
    this.socket.on('agent:message:complete', (data: MessageComplete) => {
      const handler = this.messageHandlers.get(data.conversationId);
      if (handler) {
        handler({
          id: data.messageId,
          content: '', // Content was streamed via chunks
          role: 'assistant',
          timestamp: new Date(),
        });
      }
    });

    // Handle typing indicators
    this.socket.on('agent:typing', (data: AgentTyping) => {
      this.typingHandlers.forEach((handler) => handler(data.isTyping));
    });

    // Handle reconnection
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      // console.log(`WebSocket: Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket: Failed to reconnect after maximum attempts');
    });
  }

  public async sendMessage(
    conversationId: string,
    message: string,
    agentId: string,
    onChunk?: (_chunk: string) => void,
    onComplete?: (_message: ChatMessage) => void,
    onTyping?: (_isTyping: boolean) => void
  ) {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    // Register handlers
    if (onChunk) {
      this.chunkHandlers.set(conversationId, onChunk);
    }
    if (onComplete) {
      this.messageHandlers.set(conversationId, onComplete);
    }
    if (onTyping) {
      this.typingHandlers.set(conversationId, onTyping);
    }

    // Send message
    this.socket.emit('message', {
      conversationId,
      message,
      agentId,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'repconnect-chat',
      },
    });
  }

  public async createConversation(agentId: string, title?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('conversation:new', { agentId, title });

      const handleCreated = (conversation: any) => {
        this.socket?.off('conversation:created', handleCreated);
        this.socket?.off('error', handleError);
        resolve(conversation.id);
      };

      const handleError = (error: any) => {
        this.socket?.off('conversation:created', handleCreated);
        this.socket?.off('error', handleError);
        reject(new Error(error.message || 'Failed to create conversation'));
      };

      this.socket.once('conversation:created', handleCreated);
      this.socket.once('error', handleError);
    });
  }

  public async listAgents(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('agent:list');

      const handleList = (agents: any[]) => {
        this.socket?.off('agent:list', handleList);
        this.socket?.off('error', handleError);
        resolve(agents);
      };

      const handleError = (error: any) => {
        this.socket?.off('agent:list', handleList);
        this.socket?.off('error', handleError);
        reject(new Error(error.message || 'Failed to list agents'));
      };

      this.socket.once('agent:list', handleList);
      this.socket.once('error', handleError);
    });
  }

  public startTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', conversationId);
    }
  }

  public stopTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', conversationId);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.messageHandlers.clear();
    this.chunkHandlers.clear();
    this.typingHandlers.clear();
  }

  // Clean up auth subscription when service is destroyed
  public destroy() {
    this.disconnect();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = null;
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public async reconnect() {
    // console.log('WebSocket: Reconnecting...');
    this.disconnect();

    // Small delay to ensure clean disconnect
    await new Promise((resolve) => setTimeout(resolve, 100));

    await this.connect();
  }

  // Cleanup handlers for a specific conversation
  public cleanupConversation(conversationId: string) {
    this.messageHandlers.delete(conversationId);
    this.chunkHandlers.delete(conversationId);
    this.typingHandlers.delete(conversationId);
  }
}

// Create singleton instance
const websocketChatService = new WebSocketChatService();

export default websocketChatService;
