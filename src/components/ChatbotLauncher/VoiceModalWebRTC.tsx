import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { WebRTCClient } from '../../services/webRTCClient';
import { useAuth } from '../../auth/useAuth';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentAvatar?: string;
  agentRole?: string;
  agentId?: string;
  voiceConfig?: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
}

interface TranscriptionLine {
  id: string;
  speaker: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
}

export default function VoiceModalWebRTC({
  isOpen,
  onClose,
  agentName = 'AI Assistant',
  agentAvatar = '/agent-avatar.jpg',
  agentRole = 'Your Personal AI Concierge',
  agentId,
  voiceConfig: _voiceConfig,
}: VoiceModalProps) {
  const { user, session } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionLine[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');

  const webRTCClientRef = useRef<WebRTCClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Get backend URL - use agent backend for voice agents
      const backendUrl =
        process.env.REACT_APP_AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

      // Create WebRTC client
      webRTCClientRef.current = new WebRTCClient({
        backendUrl,
        agentId: agentId || agentName.toLowerCase().replace(/\s+/g, '-'),
        userId: user?.id || 'guest-' + Date.now(),
        authToken: session?.access_token,
      });

      // Connect to signaling server
      await webRTCClientRef.current.connect();

      // Join room for this agent
      const roomId = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await webRTCClientRef.current.joinRoom(roomId);

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('error');
    }
  }, [agentName, user, session, agentId]);

  // Start the call
  const startCall = async () => {
    try {
      if (!webRTCClientRef.current) {
        await initializeWebRTC();
      }

      // Start audio transmission
      await webRTCClientRef.current!.startAudio();

      // Set up audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsCallActive(true);

      // Start audio level monitoring
      monitorAudioLevels();

      // Add initial greeting
      addTranscriptionLine('agent', `Hello! I'm ${agentName}. How can I help you today?`);

      // Listen for agent audio responses
      if (webRTCClientRef.current) {
        // Subscribe to agent's audio stream
        // Waiting for agent audio stream...
      }
    } catch (error: any) {
      console.error('Failed to start call:', error);

      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError') {
        addTranscriptionLine(
          'agent',
          'Microphone permission denied. Please allow microphone access and try again.'
        );
      } else if (error.name === 'NotFoundError') {
        addTranscriptionLine(
          'agent',
          'No microphone found. Please connect a microphone and try again.'
        );
      } else {
        addTranscriptionLine(
          'agent',
          'Failed to start voice call. Please check your connection and try again.'
        );
      }

      setConnectionStatus('error');
    }
  };

  // End the call
  const endCall = () => {
    if (webRTCClientRef.current) {
      webRTCClientRef.current.stopAudio();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsCallActive(false);
    setIsUserSpeaking(false);
    setIsAgentSpeaking(false);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, you would mute the actual audio track
  };

  // Monitor audio levels for visual feedback
  const monitorAudioLevels = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    // Update speaking state based on volume threshold
    setIsUserSpeaking(average > 30);

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevels);
  };

  // Add a transcription line
  const addTranscriptionLine = (speaker: 'user' | 'agent' | 'system', text: string) => {
    const newLine: TranscriptionLine = {
      id: Date.now().toString(),
      speaker,
      text,
      timestamp: new Date(),
    };

    setTranscription((prev) => [...prev, newLine]);

    // Simulate agent speaking
    if (speaker === 'agent') {
      setIsAgentSpeaking(true);
      setTimeout(() => setIsAgentSpeaking(false), 2000);
    }
  };

  // Scroll to bottom when new transcription is added
  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcription]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (webRTCClientRef.current) {
        webRTCClientRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <img
              src={agentAvatar}
              alt={agentName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <div>
              <h3 className="font-semibold">{agentName}</h3>
              <p className="text-sm text-gray-500">{agentRole}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Agent Avatar Section */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative">
              <img
                src={agentAvatar}
                alt={agentName}
                className={`w-32 h-32 rounded-full object-cover transition-all duration-300 ${
                  isAgentSpeaking ? 'ring-4 ring-green-400 ring-offset-4' : ''
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
              {isAgentSpeaking && (
                <Volume2 className="absolute -right-2 -bottom-2 text-green-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Transcription Area */}
          <div className="h-48 bg-gray-50 p-4 overflow-y-auto">
            {transcription.length === 0 ? (
              <p className="text-gray-500 text-center">
                {connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : connectionStatus === 'error'
                    ? 'Connection failed. Please try again.'
                    : 'Click the phone button to start'}
              </p>
            ) : (
              <div className="space-y-2">
                {transcription.map((line) => (
                  <div
                    key={line.id}
                    className={`flex ${line.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        line.speaker === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{line.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptionEndRef} />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t">
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                disabled={!isCallActive}
                className={`p-4 rounded-full transition-colors ${
                  isCallActive
                    ? isMuted
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={isCallActive ? endCall : startCall}
                disabled={connectionStatus === 'connecting'}
                className={`p-4 rounded-full transition-colors ${
                  isCallActive
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : connectionStatus === 'connecting'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isCallActive ? <PhoneOff size={24} /> : <Phone size={24} />}
              </button>
            </div>

            {/* Status Indicator */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500'
                      : connectionStatus === 'connecting'
                        ? 'bg-yellow-500 animate-pulse'
                        : connectionStatus === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected'
                    ? 'Connected'
                    : connectionStatus === 'connecting'
                      ? 'Connecting...'
                      : connectionStatus === 'error'
                        ? 'Connection Error'
                        : 'Not Connected'}
                </span>
              </div>
              {isUserSpeaking && (
                <p className="text-sm text-blue-500 mt-2 animate-pulse">You are speaking...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
