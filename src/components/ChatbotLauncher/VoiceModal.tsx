import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { WebRTCVoiceService } from '../../services/webRTCVoiceService';
import { ElevenLabsTTSService } from '../../services/elevenLabsTTS';
import { DeepgramBridge } from '../../services/deepgramBridge';
import { io, Socket } from 'socket.io-client';

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
  agentRole = 'Your Personal AI Concierge',
}: VoiceModalProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionLine[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // const remoteStreamRef = useRef<MediaStream | null>(null); // Not used with current implementation
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const webRTCServiceRef = useRef<WebRTCVoiceService | null>(null);
  const ttsServiceRef = useRef<ElevenLabsTTSService | null>(null);
  const deepgramRef = useRef<DeepgramBridge | null>(null);

  // Initialize WebRTC with real services
  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Initialize services
      webRTCServiceRef.current = new WebRTCVoiceService();
      ttsServiceRef.current = new ElevenLabsTTSService();
      deepgramRef.current = new DeepgramBridge();

      // Initialize TTS with agent voice
      await ttsServiceRef.current.initialize();
      const agentVoiceConfig = ttsServiceRef.current.getAgentVoiceConfig(agentName.toLowerCase());

      // Connect to backend via Socket.IO
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';
      socketRef.current = io(`${backendUrl}/harvey-ws`, {
        transports: ['websocket', 'polling'],
        auth: {
          agentId: agentName.toLowerCase(),
          agentRole: agentRole,
        },
      });

      socketRef.current.on('connect', () => {
        // Connected to Harvey WebSocket
      });

      // Initialize WebRTC voice service
      await webRTCServiceRef.current.initialize();

      // Start voice session
      const sessionId = Date.now().toString();
      await webRTCServiceRef.current.startVoiceSession(sessionId);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Initialize Deepgram for transcription
      deepgramRef.current.initialize({
        apiKey: process.env.REACT_APP_DEEPGRAM_API_KEY || '',
        language: 'en-US',
        model: 'nova-2',
        punctuate: true,
        interim_results: true,
      });

      // Connect Deepgram to handle transcriptions
      deepgramRef.current.on('transcription', (data: any) => {
        if (data.is_final && data.speech_final) {
          const transcriptionData: TranscriptionLine = {
            id: Date.now().toString(),
            speaker: 'user',
            text: data.channel.alternatives[0].transcript,
            timestamp: new Date(),
          };
          setTranscription((prev) => [...prev, transcriptionData]);

          // Send to backend for AI response
          socketRef.current?.emit('user-message', {
            text: data.channel.alternatives[0].transcript,
            sessionId,
            agentId: agentName.toLowerCase(),
          });
        }
      });

      // Handle AI responses
      socketRef.current.on('agent-response', async (data: any) => {
        const agentTranscription: TranscriptionLine = {
          id: Date.now().toString(),
          speaker: 'agent',
          text: data.text,
          timestamp: new Date(),
        };
        setTranscription((prev) => [...prev, agentTranscription]);

        // Convert text to speech using ElevenLabs
        if (agentVoiceConfig && ttsServiceRef.current) {
          await ttsServiceRef.current.streamTextToSpeech(data.text, agentVoiceConfig);
        }
      });

      // Start audio streaming to Deepgram
      await deepgramRef.current.startStreaming(stream);

      setConnectionStatus('connected');
      setIsCallActive(true);
      startVoiceActivityDetection();
    } catch (error) {
      // WebRTC initialization error
      setConnectionStatus('error');
    }
  }, [agentName, agentRole]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Handle agent speaking state from TTS service
  useEffect(() => {
    if (!ttsServiceRef.current) return;

    const handleSpeakingStart = () => setIsAgentSpeaking(true);
    const handleSpeakingEnd = () => setIsAgentSpeaking(false);

    ttsServiceRef.current.on('speaking-start', handleSpeakingStart);
    ttsServiceRef.current.on('speaking-end', handleSpeakingEnd);

    return () => {
      ttsServiceRef.current?.off('speaking-start', handleSpeakingStart);
      ttsServiceRef.current?.off('speaking-end', handleSpeakingEnd);
    };
  }, [isCallActive]);

  // Auto-scroll transcription
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  const startCall = async () => {
    await initializeWebRTC();
  };

  const endCall = async () => {
    try {
      // Stop all services
      await deepgramRef.current?.stopStreaming();
      await ttsServiceRef.current?.disconnect();
      await webRTCServiceRef.current?.endAllSessions();

      // Clean up WebRTC
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      audioContextRef.current?.close();

      // Disconnect socket
      socketRef.current?.disconnect();

      setIsCallActive(false);
      setConnectionStatus('idle');
      setTranscription([]);
    } catch (error) {
      console.error('Error ending call:', error);
    }
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
                <div
                  className={`relative w-32 h-32 rounded-full overflow-hidden transition-all duration-300 ${
                    isAgentSpeaking
                      ? 'ring-4 ring-emerald-400/50 ring-offset-4 ring-offset-transparent'
                      : ''
                  }`}
                >
                  <img
                    src={agentAvatar}
                    alt={agentName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback gradient avatar
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.background =
                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
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
                              minute: '2-digit',
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
