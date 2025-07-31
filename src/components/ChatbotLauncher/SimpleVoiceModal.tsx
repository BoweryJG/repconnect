import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCClient } from '../../services/webRTCClient';
import { useAuth } from '../../auth/useAuth';
import { trialVoiceService } from '../../services/trialVoiceService';
import { api } from '../../config/api';
import { useRepXTier, checkFeatureAccess } from '../../unified-auth';
import SimpleChatModal from './SimpleChatModal';
import './SimpleVoiceModal.css';

interface SimpleVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentAvatar?: string;
  agentRole?: string;
  agentId?: string;
}

export default function SimpleVoiceModal({
  isOpen,
  onClose,
  agentName = 'AI Assistant',
  agentAvatar = '🤖',
  agentRole = 'Your Personal AI Concierge',
  agentId,
}: SimpleVoiceModalProps) {
  const { user, session } = useAuth();
  const { tier } = useRepXTier(user?.id);
  const hasVoiceAccess = checkFeatureAccess(tier, 'phoneAccess');

  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [showTextChat, setShowTextChat] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      speaker: 'user' | 'agent';
      text: string;
      timestamp: Date;
    }>
  >([]);
  const [repxTier, setRepxTier] = useState<{
    tier: string;
    tierName: string;
    agentMinutes: number;
    agentSeconds: number;
    unlimited: boolean;
  } | null>(null);

  const webRTCClientRef = useRef<WebRTCClient | null>(null);
  const remainingTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const endCall = useCallback(() => {
    if (webRTCClientRef.current) {
      webRTCClientRef.current.stopAudio();
    }
    if (isTrialSession) {
      trialVoiceService.endSession();
    }
    setIsCallActive(false);
    setConnectionStatus('idle');
  }, [isTrialSession]);

  const handleSessionExpired = useCallback(() => {
    setShowTrialExpired(true);
    endCall();
  }, [endCall]);

  useEffect(() => {
    if ((isTrialSession || (repxTier && !repxTier.unlimited)) && isCallActive) {
      const startTime = Date.now();
      remainingTimeInterval.current = setInterval(() => {
        if (isTrialSession) {
          const remaining = trialVoiceService.getRemainingTime();
          setRemainingTime(remaining);
          if (remaining <= 0) {
            handleSessionExpired();
          }
        } else if (repxTier && !repxTier.unlimited) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = repxTier.agentSeconds - elapsed;
          setRemainingTime(Math.max(0, remaining));
          if (remaining <= 0) {
            handleSessionExpired();
          }
        }
      }, 1000);
    }

    return () => {
      if (remainingTimeInterval.current) {
        clearInterval(remainingTimeInterval.current);
      }
    };
  }, [isTrialSession, isCallActive, handleSessionExpired, repxTier]);

  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const isAuthenticated = !!user && !!session;

      if (!isAuthenticated && agentId) {
        const trialSession = await trialVoiceService.startTrialVoiceSession(
          agentId,
          handleSessionExpired
        );
        setIsTrialSession(true);
        setRemainingTime(trialSession.session.max_duration_seconds);
      }

      const backendUrl =
        process.env.REACT_APP_AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

      webRTCClientRef.current = new WebRTCClient({
        backendUrl: backendUrl,
        agentId: agentId!,
        userId: user?.id || 'guest-' + Date.now(),
        authToken: session?.access_token,
      });

      await webRTCClientRef.current.connect();
      const roomId = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await webRTCClientRef.current.joinRoom(roomId);

      // Set up voice event handlers for continuous conversation
      if (webRTCClientRef.current.socket) {
        // Handle agent speaking status
        webRTCClientRef.current.socket.on('agent:speaking', (speaking: boolean) => {
          setIsAgentSpeaking(speaking);
        });

        // Handle transcription events
        webRTCClientRef.current.socket.on('transcription:user', (data: { text: string }) => {
          setConversationHistory((prev) => [
            ...prev,
            {
              speaker: 'user',
              text: data.text,
              timestamp: new Date(),
            },
          ]);
        });

        webRTCClientRef.current.socket.on('transcription:agent', (data: { text: string }) => {
          setConversationHistory((prev) => [
            ...prev,
            {
              speaker: 'agent',
              text: data.text,
              timestamp: new Date(),
            },
          ]);
        });

        // Handle voice activity detection
        webRTCClientRef.current.socket.on('vad:speech-end', () => {
          // User finished speaking, agent will respond
        });
      }

      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('error');
    }
  }, [agentName, user, session, agentId, handleSessionExpired]);

  const startCall = useCallback(async () => {
    try {
      setMicrophoneError(null);

      if (!webRTCClientRef.current) {
        await initializeWebRTC();
      }

      // Request microphone permission and start audio
      try {
        await webRTCClientRef.current!.startAudio();
        setIsCallActive(true);
      } catch (audioError: any) {
        // Handle microphone permission denied
        if (audioError.name === 'NotAllowedError' || audioError.name === 'PermissionDeniedError') {
          setMicrophoneError(
            'Microphone access denied. Please enable microphone permissions to use voice chat.'
          );
        } else if (audioError.name === 'NotFoundError') {
          setMicrophoneError('No microphone found. Please connect a microphone to use voice chat.');
        } else {
          setMicrophoneError('Failed to access microphone. Please check your audio settings.');
        }
        throw audioError;
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnectionStatus('error');
    }
  }, [initializeWebRTC]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && webRTCClientRef.current) {
      webRTCClientRef.current.startAudio().catch(console.error);
    } else if (!isMuted && webRTCClientRef.current) {
      webRTCClientRef.current.stopAudio();
    }
  };

  // Fetch RepX tier limits when modal opens
  useEffect(() => {
    const fetchRepxTier = async () => {
      if (user && session) {
        try {
          const response = await api.get('/api/repx/agent-time-limit');
          if (response.data.success) {
            setRepxTier(response.data.data);
            // Set initial remaining time based on tier
            const seconds = response.data.data.agentSeconds;
            setRemainingTime(seconds === -1 ? 999999 : seconds); // Set to large number if unlimited
          }
        } catch (error) {
          console.error('Failed to fetch RepX tier:', error);
          // Default to 5 minutes if fetch fails
          setRemainingTime(300);
        }
      }
    };

    if (isOpen) {
      fetchRepxTier();
    }
  }, [isOpen, user, session]);

  // Auto-start call when modal opens
  useEffect(() => {
    if (isOpen && !isCallActive && connectionStatus === 'idle' && !microphoneError) {
      startCall();
    }
  }, [isOpen, isCallActive, connectionStatus, microphoneError, startCall]);

  // Auto-scroll conversation history
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
      if (webRTCClientRef.current) {
        webRTCClientRef.current.disconnect();
      }
    };
  }, [endCall, isCallActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Check voice access first - redirect to text chat if no access
  if (!hasVoiceAccess && !isTrialSession) {
    return (
      <SimpleChatModal
        isOpen={isOpen}
        onClose={onClose}
        agentName={agentName}
        agentAvatar={agentAvatar}
        agentRole={agentRole}
        agentId={agentId}
      />
    );
  }

  // Show text chat if user switched
  if (showTextChat) {
    return (
      <SimpleChatModal
        isOpen={isOpen}
        onClose={onClose}
        agentName={agentName}
        agentAvatar={agentAvatar}
        agentRole={agentRole}
        agentId={agentId}
      />
    );
  }

  return (
    <div className="voice-modal-overlay" onClick={onClose}>
      <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-modal-header">
          <button className="close-button" onClick={onClose}>
            ×
          </button>
          <div className="agent-info">
            <div className="agent-avatar">{agentAvatar}</div>
            <div>
              <h2>{agentName}</h2>
              <p>{agentRole}</p>
            </div>
          </div>
          {isCallActive && (
            <div className="trial-timer">
              {repxTier?.unlimited ? (
                <>✨ {repxTier.tierName}: Unlimited conversation</>
              ) : (
                <>
                  ⏱️ {isTrialSession ? 'Trial' : repxTier?.tierName}: {formatTime(remainingTime)}
                </>
              )}
            </div>
          )}
        </div>

        <div className="voice-modal-content">
          {showTrialExpired ? (
            <div className="trial-expired">
              <div className="expired-icon">⏰</div>
              <h3>{isTrialSession ? 'Trial Session' : 'Time Limit'} Ended</h3>
              <p>
                {isTrialSession
                  ? 'Your 5-minute trial session has ended. Upgrade to Pro for unlimited voice conversations.'
                  : repxTier
                    ? `Your ${repxTier.tierName} ${repxTier.agentMinutes}-minute conversation limit has been reached. ${
                        repxTier.tier !== 'repx5'
                          ? 'Upgrade to Rep⁵ for unlimited conversations!'
                          : ''
                      }`
                    : 'Your conversation time has ended.'}
              </p>
              <button
                className="button primary"
                onClick={() => (window.location.href = '/upgrade')}
              >
                {repxTier?.tier === 'repx5' ? 'Start New Conversation' : 'Upgrade Now'}
              </button>
            </div>
          ) : (
            <>
              <div className="connection-status">
                <div
                  className={`status-indicator ${connectionStatus} ${isAgentSpeaking ? 'agent-speaking' : ''}`}
                >
                  <div className="pulse"></div>
                  <span className="volume-icon">{isAgentSpeaking ? '🗣️' : '🔊'}</span>
                </div>
                <p className="status-text">
                  {connectionStatus === 'idle' && 'Ready to start voice conversation'}
                  {connectionStatus === 'connecting' && 'Connecting to voice service...'}
                  {connectionStatus === 'connected' &&
                    !microphoneError &&
                    (isAgentSpeaking ? 'Agent is speaking...' : 'Listening - You can speak now!')}
                  {connectionStatus === 'error' && 'Connection error - Please try again'}
                  {microphoneError && connectionStatus !== 'connecting' && microphoneError}
                </p>
              </div>

              {/* Conversation history display */}
              {isCallActive && conversationHistory.length > 0 && (
                <div className="conversation-history" ref={conversationRef}>
                  <h4>Conversation</h4>
                  <div className="conversation-messages">
                    {conversationHistory.map((message, index) => (
                      <div key={index} className={`message ${message.speaker}`}>
                        <span className="speaker-label">
                          {message.speaker === 'user' ? 'You' : agentName}:
                        </span>
                        <span className="message-text">{message.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {microphoneError && (
                <div className="microphone-error">
                  <p className="error-message">🎤 {microphoneError}</p>
                  <button className="button secondary" onClick={() => setShowTextChat(true)}>
                    Switch to Text Chat
                  </button>
                </div>
              )}

              <div className="controls">
                {!isCallActive ? (
                  <button
                    className="button call-button"
                    onClick={startCall}
                    disabled={connectionStatus === 'connecting'}
                  >
                    📞 Start Call
                  </button>
                ) : (
                  <>
                    <button
                      className={`button mute-button ${isMuted ? 'muted' : ''}`}
                      onClick={toggleMute}
                    >
                      {isMuted ? '🔇' : '🎤'}
                    </button>
                    <button className="button end-button" onClick={endCall}>
                      📵 End Call
                    </button>
                  </>
                )}
              </div>

              {((isTrialSession && !isCallActive) ||
                (repxTier && !repxTier.unlimited && !isCallActive)) && (
                <div className="trial-notice">
                  {isTrialSession ? (
                    <>⏱️ Free 5-minute trial session. Sign up for unlimited voice calls!</>
                  ) : (
                    <>
                      ⏱️ {repxTier?.tierName}: {repxTier?.agentMinutes} minute
                      {repxTier?.agentMinutes !== 1 ? 's' : ''} per conversation.
                      {repxTier?.tier !== 'repx5' && ' Upgrade to Rep⁵ for unlimited!'}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
