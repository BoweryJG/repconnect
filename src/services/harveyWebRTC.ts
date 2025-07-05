// Harvey WebRTC Service - Real-time audio connection to Harvey
// This handles all WebRTC connections for Harvey's voice features

interface HarveyWebRTCConfig {
  userId: string;
  onConnectionChange?: (connected: boolean) => void;
  onAudioReceived?: (audioData: string) => void;
  onVoiceAnalysis?: (analysis: VoiceAnalysis) => void;
}

interface VoiceAnalysis {
  confidence: number; // 0-100
  pace: 'slow' | 'normal' | 'fast';
  tone: 'nervous' | 'confident' | 'aggressive' | 'uncertain';
  volume: number; // 0-100
  sentiment: number; // -1 to 1 (negative to positive)
}

class HarveyWebRTC {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private websocket: WebSocket | null = null;
  private config: HarveyWebRTCConfig | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isMuted = false;
  private voiceAnalysisInterval: NodeJS.Timeout | null = null;

  private readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN servers for production
  ];

  async connect(config: HarveyWebRTCConfig): Promise<void> {
    this.config = config;
    
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Get user media (microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Set up WebRTC connection
      await this.setupPeerConnection();
      
      // Connect to signaling server
      await this.connectWebSocket();
      
      // Start voice analysis
      this.startVoiceAnalysis();
      
    } catch (error) {
      console.error('Failed to connect Harvey WebRTC:', error);
      this.handleConnectionError(error);
    }
  }

  private async setupPeerConnection(): Promise<void> {
    this.pc = new RTCPeerConnection({ iceServers: this.ICE_SERVERS });
    
    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }
    
    // Handle remote stream
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.playRemoteAudio();
      }
    };
    
    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log('Harvey WebRTC connection state:', state);
      
      if (state === 'connected') {
        this.isConnected = true;
        this.config?.onConnectionChange?.(true);
      } else if (state === 'disconnected' || state === 'failed') {
        this.isConnected = false;
        this.config?.onConnectionChange?.(false);
        this.attemptReconnect();
      }
    };
    
    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
        }));
      }
    };
  }

  private async connectWebSocket(): Promise<void> {
    const wsUrl = process.env.REACT_APP_HARVEY_WS_URL || 'ws://localhost:3001/harvey-ws';
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = async () => {
      console.log('Connected to Harvey signaling server');
      
      // Send initial handshake
      this.websocket!.send(JSON.stringify({
        type: 'join',
        userId: this.config?.userId,
        role: 'rep',
      }));
      
      // Create and send offer
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      
      this.websocket!.send(JSON.stringify({
        type: 'offer',
        offer: offer,
      }));
    };
    
    this.websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'answer':
          await this.pc!.setRemoteDescription(new RTCSessionDescription(data.answer));
          break;
          
        case 'ice-candidate':
          await this.pc!.addIceCandidate(new RTCIceCandidate(data.candidate));
          break;
          
        case 'harvey-message':
          this.handleHarveyMessage(data.message);
          break;
          
        case 'battle-mode':
          this.handleBattleMode(data);
          break;
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('Harvey WebSocket error:', error);
    };
    
    this.websocket.onclose = () => {
      console.log('Disconnected from Harvey signaling server');
      this.attemptReconnect();
    };
  }

  private playRemoteAudio(): void {
    if (!this.remoteStream || !this.audioContext) return;
    
    // Create audio element for remote stream
    const audio = new Audio();
    audio.srcObject = this.remoteStream;
    audio.autoplay = true;
    
    // Apply audio processing
    const source = this.audioContext.createMediaStreamSource(this.remoteStream);
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.isMuted ? 0 : 1;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
  }

  private startVoiceAnalysis(): void {
    if (!this.localStream || !this.audioContext) return;
    
    // Create analyser node
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
    
    // Start analysis loop
    this.voiceAnalysisInterval = setInterval(() => {
      if (!this.analyser) return;
      
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);
      
      // Analyze voice characteristics
      const analysis = this.analyzeVoice(dataArray);
      this.config?.onVoiceAnalysis?.(analysis);
      
      // Send to Harvey for real-time coaching
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'voice-analysis',
          analysis: analysis,
        }));
      }
    }, 100); // Analyze 10 times per second
  }

  private analyzeVoice(dataArray: Uint8Array): VoiceAnalysis {
    // Calculate volume
    const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    
    // Analyze frequency distribution for tone
    const lowFreq = dataArray.slice(0, dataArray.length / 4).reduce((sum, val) => sum + val, 0);
    const midFreq = dataArray.slice(dataArray.length / 4, dataArray.length / 2).reduce((sum, val) => sum + val, 0);
    const highFreq = dataArray.slice(dataArray.length / 2).reduce((sum, val) => sum + val, 0);
    
    // Determine tone based on frequency distribution
    let tone: VoiceAnalysis['tone'] = 'normal';
    if (highFreq > midFreq * 1.5) tone = 'nervous';
    else if (lowFreq > midFreq * 1.5) tone = 'confident';
    else if (volume < 20) tone = 'uncertain';
    
    // Calculate pace (would need more sophisticated analysis in production)
    const pace = volume > 60 ? 'fast' : volume < 30 ? 'slow' : 'normal';
    
    // Calculate confidence score
    const confidence = Math.min(100, Math.max(0, 
      50 + (lowFreq / midFreq * 20) - (highFreq / midFreq * 20) + (volume / 2)
    ));
    
    // Calculate sentiment (simplified)
    const sentiment = (confidence / 100) * 2 - 1;
    
    return {
      confidence: Math.round(confidence),
      pace,
      tone,
      volume: Math.round(volume / 255 * 100),
      sentiment: parseFloat(sentiment.toFixed(2)),
    };
  }

  private handleHarveyMessage(message: any): void {
    // Handle different types of Harvey messages
    switch (message.type) {
      case 'whisper':
        // Harvey's tactical advice during calls
        this.playHarveyWhisper(message.audio);
        break;
        
      case 'verdict':
        // Post-call analysis
        this.config?.onAudioReceived?.(message.audio);
        break;
        
      case 'coaching':
        // Real-time coaching feedback
        this.handleCoachingFeedback(message);
        break;
    }
  }

  private playHarveyWhisper(audioData: string): void {
    // Play Harvey's whisper only to the rep (not the caller)
    const audio = new Audio(audioData);
    audio.volume = 0.3; // Whisper volume
    audio.play();
  }

  private handleCoachingFeedback(feedback: any): void {
    // Visual or haptic feedback for real-time coaching
    if (feedback.urgent) {
      // Trigger visual alert or vibration
      navigator.vibrate?.([200, 100, 200]);
    }
  }

  private handleBattleMode(data: any): void {
    // Handle battle mode setup for competitive calling
    console.log('Battle mode activated:', data);
    // Implementation for split-screen battle mode
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log('Attempting to reconnect to Harvey...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.config) {
        this.connect(this.config);
      }
    }, 5000);
  }

  private handleConnectionError(error: any): void {
    console.error('Harvey connection error:', error);
    this.config?.onConnectionChange?.(false);
  }

  async startListening(): Promise<void> {
    // Start actively listening to Harvey
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'start-listening',
      }));
    }
  }

  stopListening(): void {
    // Stop listening to Harvey
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'stop-listening',
      }));
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    // Mute/unmute remote audio
    if (this.audioContext) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = muted ? 0 : 1;
    }
  }

  sendVoiceCommand(command: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'voice-command',
        command: command,
      }));
    }
  }

  async enterBattleMode(opponentId: string): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'enter-battle',
        opponentId: opponentId,
      }));
    }
  }

  disconnect(): void {
    // Clean up connections
    if (this.voiceAnalysisInterval) {
      clearInterval(this.voiceAnalysisInterval);
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.pc) {
      this.pc.close();
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.isConnected = false;
    this.config?.onConnectionChange?.(false);
  }
}

export const harveyWebRTC = new HarveyWebRTC();