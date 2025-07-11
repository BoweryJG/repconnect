import React, { useState, useEffect } from 'react';
import { CallQueueService, QueuedCall, CallOutcome } from '../services/callQueueService';

interface QueueCallInterfaceProps {
  queueId: string;
  onComplete?: () => void;
}

export const QueueCallInterface: React.FC<QueueCallInterfaceProps> = ({ queueId, onComplete }) => {
  const [currentCall, setCurrentCall] = useState<QueuedCall | null>(null);
  const [isAutoDialing, setIsAutoDialing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [callOutcome, setCallOutcome] = useState<Partial<CallOutcome>>({
    status: 'completed',
  });
  const [queueProgress, setQueueProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    calling: 0,
  });

  useEffect(() => {
    const loadProgress = async () => {
      const progress = await CallQueueService.getQueueProgress(queueId);
      setQueueProgress(progress);
    };

    loadProgress();
    const interval = setInterval(loadProgress, 5000);

    return () => clearInterval(interval);
  }, [queueId]);

  useEffect(() => {
    const unsubscribe = CallQueueService.onCallUpdate((call) => {
      if (call.queueId === queueId) {
        setCurrentCall(call);
      }
    });

    return unsubscribe;
  }, [queueId]);

  useEffect(() => {
    if (isAutoDialing && !isPaused && !currentCall) {
      loadNextCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoDialing, isPaused, currentCall]);

  const loadNextCall = async () => {
    try {
      const nextCall = await CallQueueService.getNextCall(queueId);
      if (nextCall) {
        setCurrentCall(nextCall);
        if (isAutoDialing) {
          await makeCall(nextCall);
        }
      } else {
        setIsAutoDialing(false);
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {}
  };

  const makeCall = async (call: QueuedCall) => {
    try {
      await CallQueueService.makeCall(call);
    } catch (error) {}
  };

  const handleEndCall = () => {
    setShowOutcomeDialog(true);
  };

  const handleSaveOutcome = async () => {
    if (currentCall) {
      await CallQueueService.completeCall(currentCall.id, callOutcome as CallOutcome);
      setShowOutcomeDialog(false);
      setCallOutcome({ status: 'completed' });
      setCurrentCall(null);

      if (isAutoDialing) {
        setTimeout(() => loadNextCall(), 2000);
      }
    }
  };

  const handleSkip = async () => {
    if (currentCall) {
      await CallQueueService.completeCall(currentCall.id, {
        status: 'no-answer',
        notes: 'Skipped by agent',
      });
      setCurrentCall(null);
      loadNextCall();
    }
  };

  const progressPercentage =
    queueProgress.total > 0
      ? ((queueProgress.completed + queueProgress.failed) / queueProgress.total) * 100
      : 0;

  return (
    <div style={{ padding: '24px' }}>
      {/* Queue Progress */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ color: '#fff', margin: 0 }}>Queue Progress</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: '#4ade80' }}>{queueProgress.completed} Completed</span>
            <span style={{ color: '#fff' }}>{queueProgress.pending} Pending</span>
            <span style={{ color: '#ef4444' }}>{queueProgress.failed} Failed</span>
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: 'linear-gradient(to right, #00d4ff, #00ff88)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Current Call Card */}
      {currentCall && (
        <div
          style={{
            padding: '24px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div>
              <h2 style={{ color: '#fff', margin: '0 0 8px 0' }}>{currentCall.contactName}</h2>
              <p style={{ color: '#00FFFF', fontFamily: 'monospace', margin: 0 }}>
                {currentCall.phoneNumber}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  color: isPaused ? '#ff0040' : '#00ff88',
                  cursor: 'pointer',
                }}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleSkip}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  color: '#ffaa00',
                  cursor: 'pointer',
                }}
              >
                Skip
              </button>
            </div>
          </div>

          {/* Call Actions */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {currentCall.status === 'pending' ? (
              <button
                onClick={() => makeCall(currentCall)}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Start Call
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #ff0040 0%, #ff8866 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                End Call
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Contact {currentCall.position} of {queueProgress.total}
          </p>
        </div>
      )}

      {/* Auto-dial Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button
          onClick={() => setIsAutoDialing(!isAutoDialing)}
          style={{
            padding: '12px 24px',
            background: isAutoDialing
              ? 'transparent'
              : 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            border: isAutoDialing ? '2px solid #6366F1' : 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {isAutoDialing ? 'Stop Auto-Dial' : 'Start Auto-Dial'}
        </button>

        {!currentCall && (
          <button
            onClick={loadNextCall}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '2px solid #00FFFF',
              borderRadius: '8px',
              color: '#00FFFF',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Load Next Contact
          </button>
        )}
      </div>

      {/* Call Outcome Dialog */}
      {showOutcomeDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h3 style={{ color: '#fff', marginBottom: '24px' }}>Call Outcome</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                Status:
              </label>
              <select
                value={callOutcome.status}
                onChange={(e) => setCallOutcome({ ...callOutcome, status: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#333',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                <option value="completed">Completed Successfully</option>
                <option value="no-answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="voicemail">Left Voicemail</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>Notes:</label>
              <textarea
                value={callOutcome.notes || ''}
                onChange={(e) => setCallOutcome({ ...callOutcome, notes: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#333',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                Next Action:
              </label>
              <select
                value={callOutcome.nextAction || ''}
                onChange={(e) =>
                  setCallOutcome({ ...callOutcome, nextAction: e.target.value as any })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#333',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                <option value="">None</option>
                <option value="callback">Schedule Callback</option>
                <option value="email">Send Email</option>
                <option value="text">Send Text</option>
                <option value="remove">Remove from List</option>
              </select>
            </div>

            {callOutcome.nextAction === 'callback' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                  Callback Date:
                </label>
                <input
                  type="datetime-local"
                  value={callOutcome.callbackDate?.toISOString().slice(0, 16) || ''}
                  onChange={(e) =>
                    setCallOutcome({
                      ...callOutcome,
                      callbackDate: new Date(e.target.value),
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#333',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOutcomeDialog(false)}
                style={{
                  padding: '8px 24px',
                  background: 'transparent',
                  border: '1px solid #666',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutcome}
                style={{
                  padding: '8px 24px',
                  background: '#6366F1',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
