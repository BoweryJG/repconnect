import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentAvatar?: string;
  agentRole?: string;
}

interface TranscriptionLine {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export default function VoiceModal({
  isOpen,
  onClose,
  agentName = 'AI Assistant',
  agentAvatar = '/agent-avatar.jpg',
  agentRole = 'Your Personal AI Concierge'
}: VoiceModalProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionLine[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set up audio analysis for voice activity detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Handle remote stream
      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        setConnectionStatus('connected');
      };

      // Mock connection for demo
      setTimeout(() => {
        setConnectionStatus('connected');
        setIsCallActive(true);
        startVoiceActivityDetection();
      }, 1500);

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Voice Activity Detection
  const startVoiceActivityDetection = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!isCallActive) return;

      analyserRef.current!.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Simple threshold for voice detection
      setIsUserSpeaking(average > 30);

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [isCallActive]);

  // Mock agent speaking animation
  useEffect(() => {
    if (!isCallActive) return;

    const interval = setInterval(() => {
      setIsAgentSpeaking(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Mock transcription
  useEffect(() => {
    if (!isCallActive) return;

    const mockTranscriptions = [
      { speaker: 'agent', text: 'Hello! How may I assist you today?' },
      { speaker: 'user', text: 'I need help with my account settings.' },
      { speaker: 'agent', text: 'I\'d be happy to help you with your account settings. What specific aspect would you like to modify?' },
      { speaker: 'user', text: 'I want to update my notification preferences.' },
      { speaker: 'agent', text: 'Certainly! I can guide you through updating your notification preferences. Would you like to adjust email notifications, push notifications, or both?' }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < mockTranscriptions.length) {
        const { speaker, text } = mockTranscriptions[index];
        setTranscription(prev => [...prev, {
          id: Date.now().toString(),
          speaker: speaker as 'user' | 'agent',
          text,
          timestamp: new Date()
        }]);
        index++;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Auto-scroll transcription
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  const startCall = () => {
    initializeWebRTC();
  };

  const endCall = () => {
    // Clean up WebRTC
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    audioContextRef.current?.close();
    
    setIsCallActive(false);
    setConnectionStatus('idle');
    setTranscription([]);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4">
        {/* Glass morphism container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-light text-white mb-1">Voice Assistant</h2>
              <p className="text-white/60 text-sm">{agentRole}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Agent Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                {/* Avatar with speaking animation */}
                <div className={`relative w-32 h-32 rounded-full overflow-hidden transition-all duration-300 ${
                  isAgentSpeaking ? 'ring-4 ring-emerald-400/50 ring-offset-4 ring-offset-transparent' : ''
                }`}>
                  <img
                    src={agentAvatar}
                    alt={agentName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback gradient avatar
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    }}
                  />
                  {/* Voice activity overlay */}
                  {isAgentSpeaking && (
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/20 to-transparent animate-pulse" />
                  )}
                </div>
                
                {/* Speaking indicator */}
                {isCallActive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                      {isAgentSpeaking ? (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-400" />
                          <div className="flex gap-0.5">
                            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse delay-75" />
                            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse delay-150" />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-white/60">Listening...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl text-white mt-4">{agentName}</h3>
              
              {/* Connection Status */}
              <div className="mt-2">
                {connectionStatus === 'connecting' && (
                  <span className="text-sm text-yellow-400">Connecting...</span>
                )}
                {connectionStatus === 'connected' && (
                  <span className="text-sm text-emerald-400">Connected</span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-sm text-red-400">Connection Error</span>
                )}
              </div>
            </div>

            {/* Transcription Display */}
            {isCallActive && (
              <div className="mb-6">
                <div className="bg-black/20 rounded-2xl p-4 h-48 overflow-y-auto">
                  <div className="space-y-3">
                    {transcription.map((line) => (
                      <div
                        key={line.id}
                        className={`flex gap-3 ${
                          line.speaker === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            line.speaker === 'user'
                              ? 'bg-blue-500/20 text-blue-100'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="text-sm">{line.text}</p>
                          <span className="text-xs opacity-60 mt-1 block">
                            {line.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptionEndRef} />
                  </div>
                </div>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex justify-center gap-4">
              {!isCallActive ? (
                <button
                  onClick={startCall}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Phone className="w-5 h-5" />
                  Start Voice Call
                </button>
              ) : (
                <>
                  {/* Mute Button */}
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all duration-300 ${
                      isMuted
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  
                  {/* End Call Button */}
                  <button
                    onClick={endCall}
                    className="flex items-center gap-3 px-8 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full font-medium transition-all duration-300 border border-red-500/30"
                  >
                    <PhoneOff className="w-5 h-5" />
                    End Call
                  </button>
                </>
              )}
            </div>

            {/* User Speaking Indicator */}
            {isCallActive && isUserSpeaking && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-white/60">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse" />
                    <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse delay-150" />
                  </div>
                  You're speaking
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}