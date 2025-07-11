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

// MOCK MODE DISABLED - Real backend connection
const MOCK_MODE = false;

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
  private mockInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  private readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Public TURN servers for better connectivity
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
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
        },
      });

      if (MOCK_MODE) {
        // Simulate successful connection
        setTimeout(() => {
          this.isConnected = true;
          this.config?.onConnectionChange?.(true);
          this.startMockHarvey();
          this.playHarveyGreeting();
        }, 1500);

        // Start voice analysis even in mock mode
        this.startVoiceAnalysis();
        return;
      }

      // Set up WebRTC connection
      await this.setupPeerConnection();

      // Connect to signaling server
      await this.connectWebSocket();

      // Start voice analysis
      this.startVoiceAnalysis();
    } catch (error) {
      this.handleConnectionError(error);
      throw error; // Propagate error to caller
    }
  }

  private async setupPeerConnection(): Promise<void> {
    this.pc = new RTCPeerConnection({ iceServers: this.ICE_SERVERS });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
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
        this.websocket.send(
          JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
          })
        );
      }
    };
  }

  private async connectWebSocket(): Promise<void> {
    // Close existing websocket if any
    if (this.websocket) {
      this.websocket.close();
    }

    // Use the correct WebSocket URL
    const wsUrl =
      process.env.REACT_APP_HARVEY_WS_URL || 'wss://osbackend-zl1h.onrender.com/harvey-ws';

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(wsUrl);

        // Set timeout for connection
        const connectionTimeout = setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            this.websocket?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.websocket.onopen = async () => {
          clearTimeout(connectionTimeout);

          try {
            // Get auth token if available
            const authToken = localStorage.getItem('harvey_token');

            // Send initial handshake with authentication
            this.websocket!.send(
              JSON.stringify({
                type: 'join',
                userId: this.config?.userId || 'anonymous',
                role: 'rep',
                token: authToken || undefined,
              })
            );

            // Wait for server acknowledgment before sending offer
            // The server should respond with a 'joined' or 'ready' message

            // Start ping interval to keep connection alive
            this.startPingInterval();

            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;

            resolve();
          } catch (error) {
            reject(error);
          }
        };

        this.websocket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'answer':
                if (this.pc) {
                  await this.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                }
                break;

              case 'ice-candidate':
                if (this.pc && data.candidate) {
                  await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
                break;

              case 'harvey-message':
                this.handleHarveyMessage(data.message);
                break;

              case 'battle-mode':
                this.handleBattleMode(data);
                break;

              case 'error':
                break;

              case 'pong':
                // Server acknowledged our ping
                break;

              case 'connection-state':
                // Update connection state from server
                if (data.connected) {
                  this.isConnected = true;
                  this.config?.onConnectionChange?.(true);
                }
                break;

              case 'joined':
              case 'ready':
                // Server acknowledged our join, now send offer
                this.sendOffer();
                break;

              case 'welcome':
                // Alternative server acknowledgment
                if (data.canOffer !== false) {
                  this.sendOffer();
                }
                break;

              default:
                // Unhandled message type - silently ignore in production
                break;
            }
          } catch (error) {
            // Error processing WebSocket message - handle silently
            this.handleConnectionError(error);
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          reject(error);
        };

        this.websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);

          this.isConnected = false;
          this.config?.onConnectionChange?.(false);

          // Only attempt reconnect if it wasn't a manual close
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
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

    // Check if audio context is in a valid state
    if (this.audioContext.state === 'closed') {
      return;
    }

    try {
      // Create analyser node
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);
    } catch (error) {
      return;
    }

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
        this.websocket.send(
          JSON.stringify({
            type: 'voice-analysis',
            analysis: analysis,
          })
        );
      }
    }, 100); // Analyze 10 times per second
  }

  private analyzeVoice(dataArray: Uint8Array): VoiceAnalysis {
    // Check if dataArray is valid
    if (!dataArray || dataArray.length === 0) {
      return {
        confidence: 0,
        pace: 'normal',
        tone: 'uncertain',
        volume: 0,
        sentiment: 0,
      };
    }

    // Calculate volume
    const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

    // Analyze frequency distribution for tone
    const lowFreq = dataArray
      .slice(0, Math.floor(dataArray.length / 4))
      .reduce((sum, val) => sum + val, 0);
    const midFreq = dataArray
      .slice(Math.floor(dataArray.length / 4), Math.floor(dataArray.length / 2))
      .reduce((sum, val) => sum + val, 0);
    const highFreq = dataArray
      .slice(Math.floor(dataArray.length / 2))
      .reduce((sum, val) => sum + val, 0);

    // Determine tone based on frequency distribution
    let tone: VoiceAnalysis['tone'] = 'confident';
    if (highFreq > midFreq * 1.5) tone = 'nervous';
    else if (lowFreq > midFreq * 1.5) tone = 'confident';
    else if (volume < 20) tone = 'uncertain';
    else if (volume > 70) tone = 'aggressive';

    // Calculate pace (would need more sophisticated analysis in production)
    const pace = volume > 60 ? 'fast' : volume < 30 ? 'slow' : 'normal';

    // Calculate confidence score
    const confidence = Math.min(
      100,
      Math.max(0, 50 + (lowFreq / midFreq) * 20 - (highFreq / midFreq) * 20 + volume / 2)
    );

    // Calculate sentiment (simplified)
    const sentiment = (confidence / 100) * 2 - 1;

    return {
      confidence: Math.round(confidence),
      pace,
      tone,
      volume: Math.round((volume / 255) * 100),
      sentiment: parseFloat(sentiment.toFixed(2)),
    };
  }

  private handleHarveyMessage(message: any): void {
    // Handle different types of Harvey messages
    switch (message.type) {
      case 'whisper':
        // Harvey's tactical advice during calls
        if (MOCK_MODE) {
          this.playHarveyMessage(message.text);
          // Trigger visual feedback
          this.config?.onAudioReceived?.('mock-whisper');
        } else {
          this.playHarveyWhisper(message.audio);
        }
        break;

      case 'verdict':
        // Post-call analysis
        if (MOCK_MODE) {
          this.playHarveyMessage(message.text);
        }
        this.config?.onAudioReceived?.(message.audio || 'mock-verdict');
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
    // Implementation for split-screen battle mode
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer) return;

    // Don't reconnect if we're already connected or connecting
    if (
      this.websocket?.readyState === WebSocket.CONNECTING ||
      this.websocket?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    // Check max reconnect attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.config?.onConnectionChange?.(false);
      return;
    }

    this.reconnectAttempts++;
    const backoffDelay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000); // Exponential backoff up to 30s

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.config && (!this.websocket || this.websocket.readyState === WebSocket.CLOSED)) {
        try {
          // Re-setup peer connection if needed
          if (
            !this.pc ||
            this.pc.connectionState === 'failed' ||
            this.pc.connectionState === 'closed'
          ) {
            await this.setupPeerConnection();
          }

          // Attempt WebSocket reconnection
          await this.connectWebSocket();
        } catch (error) {
          // Try again
          this.attemptReconnect();
        }
      }
    }, backoffDelay);
  }

  private handleConnectionError(error: any): void {
    this.isConnected = false;
    this.config?.onConnectionChange?.(false);

    // Show user-friendly error message
    if (error.name === 'NotAllowedError') {
    } else if (error.name === 'NotFoundError') {
    } else if (error.message?.includes('WebSocket')) {
    }
  }

  async startListening(): Promise<void> {
    // Start actively listening to Harvey
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: 'start-listening',
        })
      );
    }
  }

  stopListening(): void {
    // Stop listening to Harvey
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: 'stop-listening',
        })
      );
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

  // Get connection status
  getConnectionStatus(): { isConnected: boolean; websocketState: number | null } {
    return {
      isConnected: this.isConnected,
      websocketState: this.websocket?.readyState || null,
    };
  }

  // Test connection (for debugging)
  async testConnection(): Promise<void> {
    try {
      await this.connect({
        userId: 'test-user',
        onConnectionChange: (connected) => {
          // Connection state changed
        },
        onAudioReceived: (audioData) => {
          // Audio received
        },
        onVoiceAnalysis: (analysis) => {
          // Voice analysis received
        },
      });
      // Connection test completed
    } catch (error) {
      // Connection test failed - handle error appropriately
      throw error;
    }
  }

  sendVoiceCommand(command: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: 'voice-command',
          command: command,
        })
      );
    }
  }

  async enterBattleMode(opponentId: string): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: 'enter-battle',
          opponentId: opponentId,
        })
      );
    }
  }

  // Bridge Twilio call audio to Harvey
  async bridgeTwilioCall(twilioStream: MediaStream): Promise<void> {
    if (!this.pc || !this.isConnected) {
      throw new Error('Harvey not connected');
    }

    try {
      // Add Twilio audio tracks to peer connection
      twilioStream.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          this.pc!.addTrack(track, twilioStream);
        }
      });

      // Notify Harvey that we're bridging a call
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(
          JSON.stringify({
            type: 'bridge-call',
            callType: 'twilio',
          })
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Send transcription data to Harvey for analysis
  sendTranscriptionToHarvey(transcription: string, speaker: 'agent' | 'customer'): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: 'transcription',
          text: transcription,
          speaker: speaker,
          timestamp: Date.now(),
        })
      );
    }

    // In mock mode, generate coaching based on transcription
    if (MOCK_MODE && this.isConnected) {
      this.generateMockCoaching(transcription, speaker);
    }
  }

  private generateMockCoaching(transcription: string, speaker: 'agent' | 'customer'): void {
    if (speaker === 'customer') {
      // Analyze customer sentiment
      const lowerText = transcription.toLowerCase();

      if (
        lowerText.includes('price') ||
        lowerText.includes('cost') ||
        lowerText.includes('expensive')
      ) {
        this.emitCoachingMessage('Price objection detected. Bridge to value.');
      } else if (lowerText.includes('think about') || lowerText.includes('not sure')) {
        this.emitCoachingMessage("They're hesitating. Create urgency now.");
      } else if (
        lowerText.includes('interested') ||
        lowerText.includes('like') ||
        lowerText.includes('good')
      ) {
        this.emitCoachingMessage('Positive signal! Push for next steps.');
      }
    }
  }

  private emitCoachingMessage(message: string): void {
    // Dispatch Harvey coaching message as a custom event
    window.dispatchEvent(
      new CustomEvent('harvey-coaching', {
        detail: {
          type: 'coaching',
          message: message,
          timestamp: Date.now(),
        },
      })
    );

    // Also play audio if enabled
    if (MOCK_MODE && !this.isMuted) {
      this.playHarveyMessage(message);
    }
  }

  private startMockHarvey(): void {
    if (!MOCK_MODE) return;

    // Send mock coaching messages periodically
    this.mockInterval = setInterval(() => {
      const messages = [
        { type: 'whisper', text: 'Good pace. Keep them engaged.' },
        { type: 'whisper', text: "They're interested. Push for commitment." },
        { type: 'whisper', text: 'Watch your talk ratio. Let them speak.' },
        { type: 'whisper', text: 'Perfect timing on that question.' },
        { type: 'whisper', text: 'Energy is dropping. Pick up the pace.' },
        { type: 'verdict', text: "Not bad, rookie. You're improving." },
      ];

      const message = messages[Math.floor(Math.random() * messages.length)];
      this.handleHarveyMessage(message);
    }, 15000); // Every 15 seconds
  }

  private playHarveyGreeting(): void {
    if (!MOCK_MODE) return;

    // Use browser's text-to-speech for Harvey's voice
    const utterance = new SpeechSynthesisUtterance("Harvey AI activated. Don't disappoint me.");
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 0.7;

    // Try to use a male voice
    const voices = speechSynthesis.getVoices();
    const maleVoice = voices.find(
      (voice) => voice.name.includes('Male') || voice.name.includes('David')
    );
    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    speechSynthesis.speak(utterance);

    // Send audio data to callback
    this.config?.onAudioReceived?.('mock-audio-greeting');
  }

  private playHarveyMessage(text: string): void {
    if (!MOCK_MODE || this.isMuted) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 0.5; // Quieter for whispers

    const voices = speechSynthesis.getVoices();
    const maleVoice = voices.find(
      (voice) => voice.name.includes('Male') || voice.name.includes('David')
    );
    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    speechSynthesis.speak(utterance);
  }

  private async sendOffer(): Promise<void> {
    if (!this.pc || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      // Cannot send offer: WebRTC or WebSocket not ready
      return;
    }

    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.websocket.send(
        JSON.stringify({
          type: 'offer',
          offer: offer,
        })
      );

      // Offer sent to Harvey
    } catch (error) {
      // Failed to send offer - handle error
      this.handleConnectionError(error);
    }
  }

  private startPingInterval(): void {
    // Clear existing ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    // Clean up connections
    if (this.voiceAnalysisInterval) {
      clearInterval(this.voiceAnalysisInterval);
    }

    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Stop ping interval
    this.stopPingInterval();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    if (this.pc) {
      this.pc.close();
    }

    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect'); // Normal closure
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    // Stop any ongoing speech
    if (MOCK_MODE) {
      speechSynthesis.cancel();
    }

    // Reset connection state
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.config?.onConnectionChange?.(false);
  }
}

export const harveyWebRTC = new HarveyWebRTC();
