import { Device } from 'mediasoup-client';
import { Transport, Producer, Consumer } from 'mediasoup-client/lib/types';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

export interface WebRTCConfig {
  backendUrl: string;
  agentId: string;
  userId: string;
  authToken?: string; // Optional auth token
}

export class WebRTCClient {
  socket: Socket | null = null; // Made public for event handling
  private device: Device | null = null;
  private producerTransport: Transport | null = null;
  private consumerTransport: Transport | null = null;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private localStream: MediaStream | null = null;
  private roomId: string | null = null;
  private sessionId: string | null = null;
  private authSubscription: any = null;
  private isReconnecting = false;

  constructor(private _config: WebRTCConfig) {
    // Config stored for WebRTC connection
    this.setupAuthListener();
  }

  private setupAuthListener() {
    // Listen for auth state changes
    this.authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        // Update auth token in config
        this._config.authToken = session.access_token;

        // If connected, send updated token to server
        if (this.socket?.connected) {
          this.socket.emit('auth:update', { token: session.access_token });
        }
      } else if (event === 'SIGNED_OUT') {
        // Clean disconnect on sign out
        this.disconnect();
      }
    });
  }

  async connect(): Promise<void> {
    // Get current auth token if not provided
    let authToken = this._config.authToken;
    if (!authToken) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        authToken = session?.access_token;
      } catch (error) {
        // Auth session not available, will proceed without token
      }
    }

    // Connect to Socket.IO for signaling
    this.socket = io(`${this._config.backendUrl}/voice-agents`, {
      path: '/agents-ws',
      transports: ['websocket', 'polling'],
      auth: {
        userId: this._config.userId,
        agentId: this._config.agentId,
        token: authToken, // Include auth token
      },
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      this.socket!.on('connect', () => {
        // WebRTC signaling connected
        resolve();
      });

      this.socket!.on('connect_error', (error: any) => {
        let detailedError = new Error('WebSocket connection failed');

        if (error.message && error.message.includes('xhr poll error')) {
          detailedError = new Error(
            'Cannot connect to voice server. Please check your internet connection.'
          );
        } else if (error.message && error.message.includes('websocket error')) {
          detailedError = new Error(
            'WebSocket connection blocked. Please check firewall settings.'
          );
        } else if (error.type === 'TransportError') {
          detailedError = new Error('Network error. The voice server may be unavailable.');
        }

        reject(detailedError);
      });

      // Add reconnection logic
      this.socket!.on('disconnect', (reason) => {
        // WebSocket disconnected
        if (reason === 'io server disconnect') {
          // Server disconnected, attempt reconnection
          setTimeout(() => {
            // Attempting to reconnect
            this.socket!.connect();
          }, 2000);
        }
      });

      setTimeout(
        () => reject(new Error('Connection timeout - voice server did not respond')),
        10000
      );
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  async joinRoom(roomId: string): Promise<void> {
    this.roomId = roomId;

    // Join room
    this.socket!.emit('join-room', {
      roomId,
      agentId: this._config.agentId,
      userId: this._config.userId,
    });

    // Wait for room joined confirmation
    await new Promise<void>((resolve) => {
      this.socket!.once('room-joined', (data) => {
        this.sessionId = data.sessionId;
        // Joined room successfully
        resolve();
      });
    });

    // Get router RTP capabilities
    const { rtpCapabilities } = await this.sendRequest('get-router-rtp-capabilities', {});

    // Create device
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });

    // Create transports
    await this.createTransports();
  }

  async startAudio(): Promise<void> {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });

      // Create producer
      const audioTrack = this.localStream.getAudioTracks()[0];

      if (this.producerTransport && this.device && audioTrack) {
        this.producer = await this.producerTransport.produce({
          track: audioTrack,
          codecOptions: {
            opusStereo: false,
            opusDtx: true,
          },
        });

        // Audio producer created successfully
      }
    } catch (error) {
      throw error;
    }
  }

  async stopAudio(): Promise<void> {
    if (this.producer) {
      this.producer.close();
      this.producer = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  private async createTransports(): Promise<void> {
    // Create send transport
    const sendTransportData = await this.sendRequest('create-transport', { direction: 'send' });
    this.producerTransport = this.device!.createSendTransport(sendTransportData.transportData);

    // Create receive transport
    const recvTransportData = await this.sendRequest('create-transport', { direction: 'recv' });
    this.consumerTransport = this.device!.createRecvTransport(recvTransportData.transportData);

    // Set up transport events
    this.setupTransportEvents();
  }

  private setupTransportEvents(): void {
    // Producer transport events
    this.producerTransport!.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.sendRequest('connect-transport', {
          transportId: this.producerTransport!.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error as Error);
      }
    });

    this.producerTransport!.on(
      'produce',
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const { id } = await this.sendRequest('produce', {
            transportId: this.producerTransport!.id,
            kind,
            rtpParameters,
            appData,
          });
          callback({ id });
        } catch (error) {
          errback(error as Error);
        }
      }
    );

    // Consumer transport events
    this.consumerTransport!.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.sendRequest('connect-transport', {
          transportId: this.consumerTransport!.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      // WebRTC signaling disconnected
      this.cleanup();
    });

    this.socket.on('error', (error: any) => {
      // WebRTC errors are handled by error event listeners
      if (error.type === 'UnauthorizedError' || error.code === 'invalid_token') {
        this.handleAuthError();
      }
    });

    this.socket.on('unauthorized', (_error: any) => {
      // Handle unauthorized errors
      this.handleAuthError();
    });

    // Handle new consumer (when agent sends audio back)
    this.socket.on('new-consumer', async ({ producerId }) => {
      await this.consume(producerId);
    });
  }

  private async handleAuthError(): Promise<void> {
    if (this.isReconnecting) return;

    try {
      this.isReconnecting = true;

      // Try to refresh the session
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !session) {
        // Session expired, disconnect
        this.disconnect();
        return;
      }

      // Update auth token
      this._config.authToken = session.access_token;

      // Reconnect with new token
      this.disconnect();
      await this.connect();
    } catch (error) {
      console.error('WebRTC: Error handling auth error:', error);
      this.disconnect();
    } finally {
      this.isReconnecting = false;
    }
  }

  private async consume(producerId: string): Promise<void> {
    if (!this.device || !this.consumerTransport) return;

    // Consuming audio from producer

    const consumer = await this.sendRequest('consume', {
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
    });

    const newConsumer = await this.consumerTransport.consume({
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });

    this.consumers.set(newConsumer.id, newConsumer);

    // Resume consumer if paused
    await this.sendRequest('resume-consumer', { consumerId: consumer.id });

    // Play the audio with proper error handling
    const audio = new Audio();
    audio.autoplay = true;
    const stream = new MediaStream([newConsumer.track]);
    audio.srcObject = stream;

    // Store audio element for cleanup
    (newConsumer as any).audioElement = audio;

    // Handle autoplay policy
    audio.play().catch((error) => {
      // Retry with user interaction if needed
      if (error.name === 'NotAllowedError') {
        // Audio playback requires user interaction. Click to enable audio.
        // Try again on next user interaction
        document.addEventListener(
          'click',
          () => {
            audio.play().catch((_e) => {
              // Still cannot play audio, but error is expected
            });
          },
          { once: true }
        );
      }
    });

    // Audio consumer created and playing
  }

  private async sendRequest(method: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(method, data, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = null;
    }
  }

  private cleanup(): void {
    this.stopAudio();

    this.consumers.forEach((consumer) => consumer.close());
    this.consumers.clear();

    if (this.producerTransport) {
      this.producerTransport.close();
      this.producerTransport = null;
    }

    if (this.consumerTransport) {
      this.consumerTransport.close();
      this.consumerTransport = null;
    }

    this.device = null;
  }
}
