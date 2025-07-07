import React, { useState } from 'react';
import { Typography, LinearProgress, IconButton, Chip, Grid, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PhoneIcon from '@mui/icons-material/Phone';
import { VoiceCommandInterface } from './VoiceCommandInterface';
import { SettingsNavbar } from './SettingsNavbar';
import { QueueCallInterface } from './QueueCallInterfaceSimple';
import { SmartCallQueue } from '../lib/ai/SmartCallQueue';
import { useStore } from '../store/useStore';

interface SyncQueue {
  id: string;
  query: string;
  contacts: any[];
  createdAt: Date;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  progress: number;
}

interface SyncDashboardProps {
  onClose?: () => void;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('sync');
  const [queues, setQueues] = useState<SyncQueue[]>([]);
  const [activeQueue, setActiveQueue] = useState<string | null>(null);
  const [callingQueueId, setCallingQueueId] = useState<string | null>(null);
  const contacts = useStore((state) => state.contacts);
  
  const presets = SmartCallQueue.generatePresets();

  const handleVoiceCommand = async (query: string) => {
    try {
      const queue = await SmartCallQueue.createQueue(query, contacts);
      setQueues([...queues, queue]);
      
      // Auto-start sync
      handleSyncQueue(queue.id);
    } catch (error) {
          }
  };

  const handleSyncQueue = async (queueId: string) => {
    setActiveQueue(queueId);
    const queueIndex = queues.findIndex(q => q.id === queueId);
    if (queueIndex === -1) return;

    const updatedQueues = [...queues];
    updatedQueues[queueIndex].status = 'syncing';
    setQueues(updatedQueues);

    try {
      await SmartCallQueue.syncQueue(
        updatedQueues[queueIndex],
        (progress) => {
          setQueues(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(q => q.id === queueId);
            if (idx !== -1) {
              updated[idx].progress = progress;
            }
            return updated;
          });
        }
      );

      setQueues(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(q => q.id === queueId);
        if (idx !== -1) {
          updated[idx].status = 'completed';
        }
        return updated;
      });
    } catch (error) {
      setQueues(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(q => q.id === queueId);
        if (idx !== -1) {
          updated[idx].status = 'error';
        }
        return updated;
      });
    }
    
    setActiveQueue(null);
  };

  const handleDeleteQueue = (queueId: string) => {
    setQueues(queues.filter(q => q.id !== queueId));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sync':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Voice Command Interface */}
            <VoiceCommandInterface onCommand={handleVoiceCommand} />

            {/* Preset Templates */}
            <div>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Quick Sync Templates
              </Typography>
              <Grid container spacing={2} style={{ marginTop: '8px' }}>
                {presets.map((preset) => (
                  <Grid item xs={12} sm={6} md={4} key={preset.name}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVoiceCommand(preset.query)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{preset.icon}</span>
                        <div style={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="600">
                            {preset.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {preset.query}
                          </Typography>
                        </div>
                      </div>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </div>

            {/* Active Queues */}
            {queues.length > 0 && (
              <div>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Sync Queues
                </Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {queues.map((queue) => (
                    <motion.div
                      key={queue.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      style={{
                        background: 'rgba(17, 25, 40, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '24px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Status indicator */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: queue.status === 'completed' ? '#00ff88' :
                                   queue.status === 'error' ? '#ff0040' :
                                   queue.status === 'syncing' ? '#00d4ff' : 
                                   'rgba(255, 255, 255, 0.1)',
                        boxShadow: queue.status === 'syncing' ? '0 0 10px #00d4ff' : 'none',
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Typography variant="subtitle1" fontWeight="600">
                              {queue.query}
                            </Typography>
                            {queue.status === 'completed' && (
                              <CheckCircleIcon sx={{ color: '#00ff88', fontSize: 20 }} />
                            )}
                            {queue.status === 'error' && (
                              <ErrorIcon sx={{ color: '#ff0040', fontSize: 20 }} />
                            )}
                          </div>
                          <Typography variant="caption" color="text.secondary">
                            {queue.contacts.length} contacts • Created {new Date(queue.createdAt).toLocaleTimeString()}
                          </Typography>
                          
                          {queue.status === 'syncing' && (
                            <div style={{ marginTop: '12px' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={queue.progress} 
                                sx={{
                                  height: '6px',
                                  borderRadius: '3px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #00d4ff 0%, #00ff88 100%)',
                                    borderRadius: '3px',
                                  },
                                }}
                              />
                              <Typography variant="caption" style={{ marginTop: '4px' }}>
                                {Math.round(queue.progress)}% complete
                              </Typography>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {queue.status === 'pending' && (
                            <IconButton
                              onClick={() => handleSyncQueue(queue.id)}
                              style={{
                                background: 'rgba(0, 212, 255, 0.2)',
                                border: '1px solid rgba(0, 212, 255, 0.3)',
                              }}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          )}
                          {queue.status === 'syncing' && activeQueue === queue.id && (
                            <IconButton
                              disabled
                              style={{
                                background: 'rgba(255, 217, 61, 0.2)',
                                border: '1px solid rgba(255, 217, 61, 0.3)',
                              }}
                            >
                              <PauseIcon />
                            </IconButton>
                          )}
                          {queue.status === 'completed' && (
                            <Button
                              onClick={() => setCallingQueueId(queue.id)}
                              startIcon={<PhoneIcon />}
                              variant="contained"
                              size="small"
                              sx={{
                                background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                                color: '#000',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                                  transform: 'scale(1.05)',
                                }
                              }}
                            >
                              Start Calling
                            </Button>
                          )}
                          <IconButton
                            onClick={() => handleDeleteQueue(queue.id)}
                            style={{
                              background: 'rgba(255, 0, 64, 0.2)',
                              border: '1px solid rgba(255, 0, 64, 0.3)',
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </div>

                      {/* Preview contacts */}
                      {queue.status === 'pending' && (
                        <div style={{ marginTop: '16px' }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Preview (showing first 3)
                          </Typography>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {queue.contacts.slice(0, 3).map((contact) => (
                              <Chip
                                key={contact.id}
                                label={contact.name}
                                size="small"
                                sx={{
                                  background: 'rgba(99, 102, 241, 0.2)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                }}
                              />
                            ))}
                            {queue.contacts.length > 3 && (
                              <Chip
                                label={`+${queue.contacts.length - 3} more`}
                                size="small"
                                sx={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Interface Modal */}
            {callingQueueId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.9)',
                  zIndex: 1200,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Typography variant="h5" sx={{ color: '#fff' }}>
                    Call Queue Manager
                  </Typography>
                  <Button
                    onClick={() => setCallingQueueId(null)}
                    sx={{ color: '#fff' }}
                  >
                    Close
                  </Button>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <QueueCallInterface 
                    queueId={callingQueueId} 
                    onComplete={() => {
                      setCallingQueueId(null);
                      // Refresh queue status
                      const updatedQueues = queues.map(q => 
                        q.id === callingQueueId ? { ...q, status: 'completed' as const } : q
                      );
                      setQueues(updatedQueues);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        );
      
      case 'ai':
        return (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Typography variant="h5" color="text.secondary">
              AI Settings Coming Soon
            </Typography>
          </div>
        );
      
      case 'performance':
        return (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Typography variant="h5" color="text.secondary">
              Performance Settings Coming Soon
            </Typography>
          </div>
        );
      
      case 'history':
        return (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Typography variant="h5" color="text.secondary">
              Sync History Coming Soon
            </Typography>
          </div>
        );
      
      case 'settings':
        return (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Typography variant="h5" color="text.secondary">
              General Settings Coming Soon
            </Typography>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      position: 'relative',
    }}>
      <SettingsNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncCount={queues.filter(q => q.status === 'syncing').length}
        onClose={onClose}
      />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};