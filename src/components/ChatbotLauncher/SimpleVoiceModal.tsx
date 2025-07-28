import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCClient } from '../../services/webRTCClient';
import { useAuth } from '../../auth/useAuth';
import { trialVoiceService } from '../../services/trialVoiceService';
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
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300);
  const [showTrialExpired, setShowTrialExpired] = useState(false);

  const webRTCClientRef = useRef<WebRTCClient | null>(null);
  const remainingTimeInterval = useRef<NodeJS.Timeout | null>(null);

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

  const handleTrialExpired = useCallback(() => {
    setShowTrialExpired(true);
    endCall();
  }, [endCall]);

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
  }, [isTrialSession, isCallActive, handleTrialExpired]);

  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const isAuthenticated = !!user && !!session;

      if (!isAuthenticated && agentId) {
        const trialSession = await trialVoiceService.startTrialVoiceSession(
          agentId,
          handleTrialExpired
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

      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('error');
    }
  }, [agentName, user, session, agentId, handleTrialExpired]);

  const startCall = async () => {
    try {
      if (!webRTCClientRef.current) {
        await initializeWebRTC();
      }
      await webRTCClientRef.current!.startAudio();
      setIsCallActive(true);
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnectionStatus('error');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && webRTCClientRef.current) {
      webRTCClientRef.current.startAudio().catch(console.error);
    } else if (!isMuted && webRTCClientRef.current) {
      webRTCClientRef.current.stopAudio();
    }
  };

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
          {isTrialSession && isCallActive && (
            <div className="trial-timer">⏱️ Trial: {formatTime(remainingTime)}</div>
          )}
        </div>

        <div className="voice-modal-content">
          {showTrialExpired ? (
            <div className="trial-expired">
              <div className="expired-icon">⏰</div>
              <h3>Trial Session Ended</h3>
              <p>
                Your 5-minute trial session has ended. Upgrade to Pro for unlimited voice
                conversations.
              </p>
              <button
                className="button primary"
                onClick={() => (window.location.href = '/upgrade')}
              >
                Upgrade to Pro
              </button>
            </div>
          ) : (
            <>
              <div className="connection-status">
                <div className={`status-indicator ${connectionStatus}`}>
                  <div className="pulse"></div>
                  <span className="volume-icon">🔊</span>
                </div>
                <p className="status-text">
                  {connectionStatus === 'idle' && 'Ready to start voice conversation'}
                  {connectionStatus === 'connecting' && 'Connecting to voice service...'}
                  {connectionStatus === 'connected' && 'Connected - You can speak now!'}
                  {connectionStatus === 'error' && 'Connection error - Please try again'}
                </p>
              </div>

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

              {isTrialSession && !isCallActive && (
                <div className="trial-notice">
                  ⏱️ Free 5-minute trial session. Sign up for unlimited voice calls!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
