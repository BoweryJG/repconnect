import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2, Clock, AlertCircle } from 'lucide-react';
import { WebRTCClient } from '../../services/webRTCClient';
import { useAuth } from '../../auth/useAuth';
import { trialVoiceService } from '../../services/trialVoiceService';

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

export default function VoiceModalWithTrial({
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
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes
  const [showTrialExpired, setShowTrialExpired] = useState(false);

  const webRTCClientRef = useRef<WebRTCClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const remainingTimeInterval = useRef<NodeJS.Timeout | null>(null);

  // Update remaining time display
  useEffect(() => {
    if (isTrialSession && isCallActive) {
      remainingTimeInterval.current = setInterval(() => {
        const remaining = trialVoiceService.getRemainingTime();
        setRemainingTime(remaining);

        if (remaining <= 0) {
          handleTrialExpired();
        }
      }, 1000);
    }

    return () => {
      if (remainingTimeInterval.current) {
        clearInterval(remainingTimeInterval.current);
      }
    };
  }, [isTrialSession, isCallActive]);

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Check if user is authenticated
      const isAuthenticated = !!user && !!session;

      if (!isAuthenticated && agentId) {
        // Start trial session
        const trialSession = await trialVoiceService.startTrialVoiceSession(
          agentId,
          handleTrialExpired
        );

        setIsTrialSession(true);
        setRemainingTime(trialSession.session.max_duration_seconds);

        // Add system message about trial
        addTranscriptionLine(
          'system',
          `Free 5-minute trial started. Sign up for unlimited access!`
        );
      }

      // Get backend URL
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
    } catch (error: any) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('error');

      if (error.message.includes('trial has been used')) {
        setShowTrialExpired(true);
        addTranscriptionLine(
          'system',
          'Your free trial has been used today. Please sign up for unlimited access.'
        );
      }
    }
  }, [agentName, user, session, agentId]);

  const handleTrialExpired = () => {
    setShowTrialExpired(true);
    endCall();
    addTranscriptionLine(
      'system',
      'Your 5-minute trial has ended. Sign up for unlimited voice calls!'
    );
  };

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

      // Resume audio context if suspended
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
    } catch (error: any) {
      console.error('Failed to start call:', error);
      handleCallError(error);
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

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // End trial session if active
    if (isTrialSession) {
      trialVoiceService.endSession();
    }

    setIsCallActive(false);
    setConnectionStatus('idle');
  };

  const handleCallError = (error: any) => {
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
  };

  const addTranscriptionLine = (speaker: TranscriptionLine['speaker'], text: string) => {
    const newLine: TranscriptionLine = {
      id: Date.now().toString(),
      speaker,
      text,
      timestamp: new Date(),
    };
    setTranscription((prev) => [...prev, newLine]);
  };

  const monitorAudioLevels = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      // Detect if user is speaking
      setIsUserSpeaking(average > 20);

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const toggleMute = () => {
    // For now, just update the UI state
    // The actual muting would need to be implemented in WebRTCClient
    setIsMuted(!isMuted);

    // You could also stop/start the audio stream
    if (isMuted && webRTCClientRef.current) {
      // Currently muted, so unmute by restarting audio
      webRTCClientRef.current.startAudio().catch(console.error);
    } else if (!isMuted && webRTCClientRef.current) {
      // Currently unmuted, so mute by stopping audio
      webRTCClientRef.current.stopAudio();
    }
  };

  // Auto-scroll transcription
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
      if (webRTCClientRef.current) {
        webRTCClientRef.current.disconnect();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={agentAvatar}
              alt={agentName}
              className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
            />
            <div>
              <h2 className="text-2xl font-bold">{agentName}</h2>
              <p className="text-white/90">{agentRole}</p>
            </div>
          </div>

          {/* Trial Timer */}
          {isTrialSession && isCallActive && (
            <div className="mt-4 bg-white/20 rounded-lg p-2 flex items-center gap-2">
              <Clock size={16} />
              <span className="text-sm font-medium">
                Trial Time Remaining: {formatTime(remainingTime)}
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Connection Status */}
          <div className="mb-4 flex items-center justify-center gap-2">
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

          {/* Trial Expired Message */}
          {showTrialExpired && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Trial Ended</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your free 5-minute trial has ended. Sign up for unlimited voice calls!
                  </p>
                  <button
                    onClick={() => (window.location.href = '/pricing')}
                    className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    View Pricing →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Area */}
          <div className="mb-6 h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
            {transcription.length === 0 ? (
              <p className="text-gray-500 text-center">
                Click the phone button to start the conversation
              </p>
            ) : (
              <div className="space-y-3">
                {transcription.map((line) => (
                  <div
                    key={line.id}
                    className={`flex gap-2 ${
                      line.speaker === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        line.speaker === 'user'
                          ? 'bg-blue-500 text-white'
                          : line.speaker === 'agent'
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800 text-sm'
                      }`}
                    >
                      <p className="text-sm">{line.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {line.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptionEndRef} />
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              disabled={!isCallActive}
              className={`p-4 rounded-full transition-colors ${
                !isCallActive
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isMuted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Call Button */}
            <button
              onClick={isCallActive ? endCall : startCall}
              disabled={connectionStatus === 'connecting' || showTrialExpired}
              className={`p-4 rounded-full transition-colors ${
                isCallActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : connectionStatus === 'connecting' || showTrialExpired
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isCallActive ? <PhoneOff size={24} /> : <Phone size={24} />}
            </button>

            {/* Volume Indicator */}
            <div
              className={`p-4 rounded-full ${
                isAgentSpeaking ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Volume2 size={24} />
            </div>
          </div>

          {/* Audio Level Indicators */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-blue-500' : 'bg-gray-300'}`}
              />
              <span>You're {isUserSpeaking ? 'speaking' : 'silent'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isAgentSpeaking ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
              <span>
                {agentName} is {isAgentSpeaking ? 'speaking' : 'listening'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
