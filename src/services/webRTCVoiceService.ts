import { EventEmitter } from 'events';
import { getIceServers, webRTCConfig as defaultConfig } from '../config/webrtc.config';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
  audioConstraints: MediaStreamConstraints;
  signalingUrl: string;
}

interface VoiceSession {
  id: string;
  peerConnection: RTCPeerConnection;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  dataChannel: RTCDataChannel | null;
  audioContext: AudioContext | null;
  audioProcessor: ScriptProcessorNode | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export class WebRTCVoiceService extends EventEmitter {
  private config: WebRTCConfig;
  private sessions: Map<string, VoiceSession> = new Map();
  private signalingConnection: WebSocket | null = null;

  constructor() {
    super();
    this.config = {
      iceServers: getIceServers(),
      audioConstraints: defaultConfig.audioConstraints,
      signalingUrl: 'socket.io://integrated' // Will be handled by webRTCSignalingService
    };
  }

  async initialize(): Promise<void> {
    try {
      // Test for WebRTC support
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC is not supported in this browser');
      }

      // Test for getUserMedia support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Connect to signaling server
      await this.connectSignaling();
      
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async connectSignaling(): Promise<void> {
    // When using socket.io integration, skip WebSocket connection
    if (this.config.signalingUrl === 'socket.io://integrated') {
      console.log('Using integrated Socket.io signaling');
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      this.signalingConnection = new WebSocket(this.config.signalingUrl);

      this.signalingConnection.onopen = () => {
        console.log('Connected to signaling server');
        resolve();
      };

      this.signalingConnection.onerror = (error) => {
        console.error('Signaling connection error:', error);
        reject(error);
      };

      this.signalingConnection.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      };

      this.signalingConnection.onclose = () => {
        console.log('Disconnected from signaling server');
        this.emit('signaling-disconnected');
      };
    });
  }

  async startVoiceSession(sessionId: string): Promise<VoiceSession> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    const session: VoiceSession = {
      id: sessionId,
      peerConnection: new RTCPeerConnection({ iceServers: this.config.iceServers }),
      localStream: null,
      remoteStream: null,
      dataChannel: null,
      audioContext: null,
      audioProcessor: null,
      status: 'connecting'
    };

    this.sessions.set(sessionId, session);

    try {
      // Get user media
      session.localStream = await navigator.mediaDevices.getUserMedia(this.config.audioConstraints);
      
      // Add local stream to peer connection
      session.localStream.getTracks().forEach(track => {
        session.peerConnection.addTrack(track, session.localStream!);
      });

      // Set up audio processing for Moshi integration
      await this.setupAudioProcessing(session);

      // Set up peer connection handlers
      this.setupPeerConnectionHandlers(session);

      // Create data channel for metadata
      session.dataChannel = session.peerConnection.createDataChannel('voice-metadata', {
        ordered: true
      });
      this.setupDataChannelHandlers(session);

      // Create offer
      const offer = await session.peerConnection.createOffer();
      await session.peerConnection.setLocalDescription(offer);

      // Send offer through signaling
      this.sendSignalingMessage({
        type: 'offer',
        sessionId,
        offer: offer
      });

      this.emit('session-started', sessionId);
      return session;
    } catch (error) {
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  private async setupAudioProcessing(session: VoiceSession): Promise<void> {
    if (!session.localStream) return;

    // Create audio context for processing
    session.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000
    });

    const source = session.audioContext.createMediaStreamSource(session.localStream);
    
    // Create script processor for raw audio access (for Moshi)
    // Note: ScriptProcessorNode is deprecated but still widely supported
    // Consider migrating to AudioWorklet in the future
    session.audioProcessor = session.audioContext.createScriptProcessor(4096, 1, 1);

    session.audioProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      
      // Convert Float32Array to Int16Array for Moshi
      const int16Data = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }

      // Emit audio data for Moshi processing
      this.emit('audio-data', {
        sessionId: session.id,
        audio: int16Data,
        sampleRate: session.audioContext!.sampleRate,
        timestamp: Date.now()
      });
    };

    // Connect the audio graph
    source.connect(session.audioProcessor);
    session.audioProcessor.connect(session.audioContext.destination);
  }

  private setupPeerConnectionHandlers(session: VoiceSession): void {
    session.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          sessionId: session.id,
          candidate: event.candidate
        });
      }
    };

    session.peerConnection.ontrack = (event) => {
      session.remoteStream = event.streams[0];
      this.emit('remote-stream', {
        sessionId: session.id,
        stream: session.remoteStream
      });
    };

    session.peerConnection.onconnectionstatechange = () => {
      const state = session.peerConnection.connectionState;
      console.log(`Peer connection state: ${state}`);
      
      switch (state) {
        case 'connected':
          session.status = 'connected';
          this.emit('session-connected', session.id);
          break;
        case 'disconnected':
        case 'failed':
          session.status = 'disconnected';
          this.emit('session-disconnected', session.id);
          this.endVoiceSession(session.id);
          break;
      }
    };
  }

  private setupDataChannelHandlers(session: VoiceSession): void {
    if (!session.dataChannel) return;

    session.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.emit('data-channel-open', session.id);
    };

    session.dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit('metadata', {
        sessionId: session.id,
        data
      });
    };

    session.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  async handleSignalingMessage(message: any): Promise<void> {
    const { type, sessionId } = message;
    const session = this.sessions.get(sessionId);

    if (!session && type !== 'offer') {
      console.warn(`No session found for ${sessionId}`);
      return;
    }

    switch (type) {
      case 'offer':
        // Handle incoming call
        await this.handleIncomingCall(message);
        break;

      case 'answer':
        if (session) {
          await session.peerConnection.setRemoteDescription(message.answer);
        }
        break;

      case 'ice-candidate':
        if (session) {
          await session.peerConnection.addIceCandidate(message.candidate);
        }
        break;

      case 'end-session':
        this.endVoiceSession(sessionId);
        break;
    }
  }

  private async handleIncomingCall(message: any): Promise<void> {
    const { sessionId, offer } = message;

    // Create new session for incoming call
    const session: VoiceSession = {
      id: sessionId,
      peerConnection: new RTCPeerConnection({ iceServers: this.config.iceServers }),
      localStream: null,
      remoteStream: null,
      dataChannel: null,
      audioContext: null,
      audioProcessor: null,
      status: 'connecting'
    };

    this.sessions.set(sessionId, session);

    try {
      // Get user media
      session.localStream = await navigator.mediaDevices.getUserMedia(this.config.audioConstraints);
      
      // Add local stream
      session.localStream.getTracks().forEach(track => {
        session.peerConnection.addTrack(track, session.localStream!);
      });

      // Set up handlers
      this.setupPeerConnectionHandlers(session);
      await this.setupAudioProcessing(session);

      // Set remote description
      await session.peerConnection.setRemoteDescription(offer);

      // Create answer
      const answer = await session.peerConnection.createAnswer();
      await session.peerConnection.setLocalDescription(answer);

      // Send answer
      this.sendSignalingMessage({
        type: 'answer',
        sessionId,
        answer
      });

      this.emit('incoming-call', sessionId);
    } catch (error) {
      this.sessions.delete(sessionId);
      console.error('Error handling incoming call:', error);
    }
  }

  sendMetadata(sessionId: string, data: any): void {
    const session = this.sessions.get(sessionId);
    if (session?.dataChannel?.readyState === 'open') {
      session.dataChannel.send(JSON.stringify(data));
    }
  }

  sendSignalingMessage(message: any): void {
    if (this.config.signalingUrl === 'socket.io://integrated') {
      // This will be overridden by webRTCSignalingService
      console.warn('Signaling message sent before Socket.io integration ready');
      return;
    }
    
    if (this.signalingConnection?.readyState === WebSocket.OPEN) {
      this.signalingConnection.send(JSON.stringify(message));
    }
  }

  async endVoiceSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Stop local stream
    session.localStream?.getTracks().forEach(track => track.stop());

    // Close audio processing
    if (session.audioProcessor) {
      session.audioProcessor.disconnect();
    }
    if (session.audioContext) {
      await session.audioContext.close();
    }

    // Close data channel
    session.dataChannel?.close();

    // Close peer connection
    session.peerConnection.close();

    // Remove session
    this.sessions.delete(sessionId);

    // Notify signaling server
    this.sendSignalingMessage({
      type: 'end-session',
      sessionId
    });

    this.emit('session-ended', sessionId);
  }

  async endAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    await Promise.all(sessionIds.map(id => this.endVoiceSession(id)));
  }

  disconnect(): void {
    this.endAllSessions();
    if (this.signalingConnection) {
      this.signalingConnection.close();
      this.signalingConnection = null;
    }
  }

  getSession(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): VoiceSession[] {
    return Array.from(this.sessions.values());
  }

  // Audio control methods
  async setMuted(sessionId: string, muted: boolean): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session?.localStream) {
      session.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      this.emit('mute-changed', { sessionId, muted });
    }
  }

  async setVolume(sessionId: string, volume: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session?.remoteStream) {
      const audioElement = document.querySelector(`audio[data-session="${sessionId}"]`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.volume = Math.max(0, Math.min(1, volume));
      }
    }
  }

  getConnectionStats(sessionId: string): Promise<RTCStatsReport> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session.peerConnection.getStats();
  }
}

export default new WebRTCVoiceService();