import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

interface TranscriptionUpdate {
  callSid: string;
  text: string;
  isFinal: boolean;
  timestamp: Date;
  confidence?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  speaker?: 'agent' | 'customer';
}

interface TranscriptionSession {
  callSid: string;
  onUpdate: (update: TranscriptionUpdate) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

class TranscriptionService {
  private socket: Socket | null = null;
  private sessions: Map<string, TranscriptionSession> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    // Always attempt to connect to configured backend
    this.connect();
  }

  private async connect() {
    try {
      // Get the auth token - temporarily make it optional for testing
      const { data: { session } } = await supabase.auth.getSession();
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';
                  
      // Connect to the namespace within the Socket.IO server
      this.socket = io(`${backendUrl}/call-transcription-ws`, {
        path: '/agents-ws',  // This is the Socket.IO server path
        auth: {
          token: session?.access_token || ''  // Require auth token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupEventListeners();
    } catch (error) {
            this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
            this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-subscribe to active sessions
      this.sessions.forEach((session, callSid) => {
        this.socket?.emit('subscribe', { callSid });
      });
    });

    this.socket.on('disconnect', () => {
            this.isConnected = false;
    });

    this.socket.on('error', (error) => {
            this.sessions.forEach(session => {
        session.onError(new Error(error.message || 'Connection error'));
      });
    });

    this.socket.on('connect_error', (error: any) => {
      // Only log first connection error to avoid console spam
      if (this.reconnectAttempts === 0) {
              }
    });

    this.socket.on('transcription:update', (data: any) => {
            const session = this.sessions.get(data.callSid);
      if (session) {
        // Convert backend format to expected TranscriptionUpdate format
        const update: TranscriptionUpdate = {
          callSid: data.callSid,
          text: data.latest || data.transcription || '',
          isFinal: data.isFinal || false,
          timestamp: new Date(data.timestamp || Date.now()),
          confidence: data.confidence,
          sentiment: data.sentiment,
          speaker: data.speaker
        };
        session.onUpdate(update);
      } else {
              }
    });

    this.socket.on('transcription:complete', (data: { callSid: string }) => {
      const session = this.sessions.get(data.callSid);
      if (session) {
        session.onComplete();
        this.sessions.delete(data.callSid);
      }
    });

    this.socket.on('transcription:started', (data: any) => {
          });

    this.socket.on('transcription:error', (data: { callSid: string; error: string }) => {
            const session = this.sessions.get(data.callSid);
      if (session) {
        session.onError(new Error(data.error));
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    // Silent reconnection attempts
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public startTranscription(
    callSid: string,
    onUpdate: (update: TranscriptionUpdate) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ) {
            
    if (!this.socket || !this.isConnected) {
            onError(new Error('Not connected to transcription service'));
      return;
    }

    // Store the session
    this.sessions.set(callSid, {
      callSid,
      onUpdate,
      onError,
      onComplete
    });

    // Subscribe to transcription updates for this call
        this.socket.emit('subscribe:call', callSid);
  }

  public stopTranscription(callSid: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:call', callSid);
    }
    this.sessions.delete(callSid);
  }

  public async getTranscription(callSid: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('call_transcriptions')
        .select('*')
        .eq('call_sid', callSid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
            throw error;
    }
  }

  public async getSentimentAnalysis(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple sentiment analysis - in production, this would call an AI service
    const positiveWords = ['great', 'excellent', 'good', 'happy', 'pleased', 'satisfied', 'thank'];
    const negativeWords = ['bad', 'poor', 'unhappy', 'disappointed', 'frustrated', 'angry', 'problem'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  public disconnect() {
    this.sessions.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();