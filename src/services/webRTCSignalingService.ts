import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import webRTCVoiceService from './webRTCVoiceService';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-session';
  sessionId: string;
  data?: any;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidate;
}

class WebRTCSignalingService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private sessionCallbacks: Map<string, (message: SignalingMessage) => void> = new Map();

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

      // Connect to voice agents WebRTC namespace
      this.socket = io(`${backendUrl}/voice-agents`, {
        path: '/socket.io',
        auth: {
          token: session?.access_token || '',
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
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

      // Notify WebRTC service that signaling is ready
      this.setupWebRTCIntegration();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {});

    // WebRTC signaling messages
    this.socket.on('webrtc:offer', (data: SignalingMessage) => {
      webRTCVoiceService.handleSignalingMessage(data);
    });

    this.socket.on('webrtc:answer', (data: SignalingMessage) => {
      webRTCVoiceService.handleSignalingMessage(data);
    });

    this.socket.on('webrtc:ice-candidate', (data: SignalingMessage) => {
      webRTCVoiceService.handleSignalingMessage(data);
    });

    this.socket.on('webrtc:end-session', (data: SignalingMessage) => {
      webRTCVoiceService.handleSignalingMessage(data);
    });

    // Room management for peer discovery
    this.socket.on('webrtc:peer-joined', (data: { sessionId: string; peerId: string }) => {});

    this.socket.on('webrtc:peer-left', (data: { sessionId: string; peerId: string }) => {});
  }

  private setupWebRTCIntegration() {
    // Override WebRTC service's signaling send method
    const originalSend = webRTCVoiceService.sendSignalingMessage;
    webRTCVoiceService.sendSignalingMessage = (message: SignalingMessage) => {
      this.sendSignalingMessage(message);
    };

    // Set signaling URL to use this service
    (webRTCVoiceService as any).config.signalingUrl = 'socket.io://integrated';
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public sendSignalingMessage(message: SignalingMessage) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    const eventMap: { [key: string]: string } = {
      offer: 'webrtc:offer',
      answer: 'webrtc:answer',
      'ice-candidate': 'webrtc:ice-candidate',
      'end-session': 'webrtc:end-session',
    };

    const event = eventMap[message.type];
    if (event) {
      this.socket.emit(event, message);
    }
  }

  public joinSession(sessionId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:join-session', { sessionId });
    }
  }

  public leaveSession(sessionId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc:leave-session', { sessionId });
    }
  }

  public async createVoiceRoom(metadata?: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to signaling service'));
        return;
      }

      this.socket.emit(
        'webrtc:create-room',
        metadata,
        (response: { success: boolean; roomId?: string; error?: string }) => {
          if (response.success && response.roomId) {
            resolve(response.roomId);
          } else {
            reject(new Error(response.error || 'Failed to create room'));
          }
        }
      );
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  public isReady(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const webRTCSignalingService = new WebRTCSignalingService();

// Also export for WebRTC service integration
export default webRTCSignalingService;
