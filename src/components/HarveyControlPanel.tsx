import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import {
  ExpandMore,
  ExpandLess,
  Gavel,
  MicOff,
  Mic,
  VolumeUp,
  Psychology,
  Warning,
  EmojiEvents,
  Nightlight,
  Speed,
  LocalFireDepartment,
  Chat,
  Settings,
  PowerSettingsNew,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { harveyService } from '../services/harveyService';
import { harveyWebRTC } from '../services/harveyWebRTC';

// Harvey's Different Modes
export interface HarveyModes {
  // Core Modes
  enabled: boolean; // Master on/off switch
  voiceEnabled: boolean; // Voice connection on/off
  coachingMode: 'off' | 'gentle' | 'normal' | 'aggressive' | 'brutal'; // Coaching intensity
  
  // Feature Modes
  dailyVerdicts: boolean; // Daily performance reviews
  realTimeCoaching: boolean; // In-call whisper coaching
  publicShaming: boolean; // Public failure announcements
  battleMode: boolean; // Competitive calling battles
  afterDarkMode: boolean; // Enhanced late-night features
  
  // Interaction Modes
  voiceCommands: boolean; // Voice control enabled
  autoIntervention: boolean; // Automatic coaching triggers
  motivationalInsults: boolean; // Harvey's signature style
  
  // Performance Modes
  strictMode: boolean; // No mercy on failures
  trainingWheels: boolean; // Gentler for new reps
  eliteOnly: boolean; // Features for top performers only
}

interface HarveyControlPanelProps {
  open?: boolean;
  onClose?: () => void;
  embedded?: boolean; // For embedding in Harvey Syndicate
}

export const HarveyControlPanel: React.FC<HarveyControlPanelProps> = ({ 
  open = true, 
  onClose,
  embedded = false 
}) => {
  const [expanded, setExpanded] = useState(!embedded);
  const [modes, setModes] = useState<HarveyModes>({
    enabled: true,
    voiceEnabled: true,
    coachingMode: 'normal',
    dailyVerdicts: true,
    realTimeCoaching: true,
    publicShaming: false,
    battleMode: true,
    afterDarkMode: true,
    voiceCommands: true,
    autoIntervention: true,
    motivationalInsults: true,
    strictMode: false,
    trainingWheels: false,
    eliteOnly: false,
  });
  
  const [directMessage, setDirectMessage] = useState('');
  const [harveyResponse, setHarveyResponse] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedModes = localStorage.getItem('harveyModes');
    if (savedModes) {
      setModes(JSON.parse(savedModes));
    }
  }, []);

  const handleModeChange = (mode: keyof HarveyModes, value: any) => {
    const newModes = { ...modes, [mode]: value };
    setModes(newModes);
    
    // Save to localStorage
    localStorage.setItem('harveyModes', JSON.stringify(newModes));
    
    // Apply changes to Harvey
    applyModeChanges(mode, value);
  };

  const applyModeChanges = async (mode: keyof HarveyModes, value: any) => {
    switch (mode) {
      case 'enabled':
        if (!value) {
          // Completely disable Harvey
          harveyWebRTC.disconnect();
          setHarveyResponse("Fine. Call me when you're ready to be a real closer.");
        } else {
          // Re-enable Harvey
          await harveyWebRTC.connect({
            userId: 'user',
            onConnectionChange: () => {},
            onAudioReceived: () => {},
          });
          setHarveyResponse("I'm back. Try not to disappoint me this time.");
        }
        break;
        
      case 'voiceEnabled':
        harveyWebRTC.setMuted(!value);
        break;
        
      case 'coachingMode':
        await harveyService.updateCoachingMode(value);
        break;
        
      default:
        // Update other modes via API
        await harveyService.updateModes({ [mode]: value });
    }
  };

  const sendDirectMessage = async () => {
    if (!directMessage.trim()) return;
    
    setHarveyResponse('...');
    
    try {
      const response = await harveyService.submitVoiceCommand(directMessage);
      setHarveyResponse(response.response);
      setDirectMessage('');
    } catch (error) {
      setHarveyResponse("Speak clearly. I don't have time for errors.");
    }
  };

  const toggleVoiceInteraction = () => {
    if (isListening) {
      harveyWebRTC.stopListening();
      setIsListening(false);
    } else {
      harveyWebRTC.startListening();
      setIsListening(true);
      setHarveyResponse("I'm listening. Make it worth my time.");
    }
  };

  const getCoachingModeColor = (mode: string) => {
    switch (mode) {
      case 'gentle': return '#10B981';
      case 'normal': return '#3B82F6';
      case 'aggressive': return '#F59E0B';
      case 'brutal': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const quickPresets = [
    {
      name: 'Rookie Mode',
      icon: <Psychology />,
      settings: {
        coachingMode: 'gentle' as const,
        publicShaming: false,
        strictMode: false,
        trainingWheels: true,
        motivationalInsults: false,
      },
    },
    {
      name: 'Standard Harvey',
      icon: <Gavel />,
      settings: {
        coachingMode: 'normal' as const,
        publicShaming: false,
        strictMode: false,
        trainingWheels: false,
        motivationalInsults: true,
      },
    },
    {
      name: 'Maximum Harvey',
      icon: <LocalFireDepartment />,
      settings: {
        coachingMode: 'brutal' as const,
        publicShaming: true,
        strictMode: true,
        trainingWheels: false,
        motivationalInsults: true,
      },
    },
  ];

  const applyPreset = (preset: typeof quickPresets[0]) => {
    const newModes = { ...modes, ...preset.settings };
    setModes(newModes);
    localStorage.setItem('harveyModes', JSON.stringify(newModes));
    
    // Apply all changes
    Object.entries(preset.settings).forEach(([key, value]) => {
      applyModeChanges(key as keyof HarveyModes, value);
    });
    
    setHarveyResponse(`${preset.name} activated. ${
      preset.name === 'Maximum Harvey' 
        ? "Hope you're ready for the real deal." 
        : preset.name === 'Rookie Mode'
        ? "Training wheels are for children, but fine."
        : "A balanced approach. Acceptable."
    }`);
  };

  const content = (
    <div style={{ padding: embedded ? '16px' : '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Gavel sx={{ fontSize: 28, color: '#FFD700' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Harvey Control Panel
          </Typography>
        </div>
        {embedded && (
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </div>

      {/* Master Switch */}
      <div style={{ marginBottom: '24px' }}>
        <FormControlLabel
          control={
            <Switch
              checked={modes.enabled}
              onChange={(e) => handleModeChange('enabled', e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#FFD700',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#FFD700',
                },
              }}
            />
          }
          label={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PowerSettingsNew />
              <Typography variant="h6">
                Harvey {modes.enabled ? 'Active' : 'Offline'}
              </Typography>
            </div>
          }
        />
      </div>

      <Collapse in={expanded}>
        {/* Quick Presets */}
        <div style={{ marginBottom: '24px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Quick Presets
          </Typography>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {quickPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outlined"
                size="small"
                startIcon={preset.icon}
                onClick={() => applyPreset(preset)}
                sx={{
                  borderColor: 'rgba(255, 215, 0, 0.3)',
                  color: '#FFD700',
                  '&:hover': {
                    borderColor: '#FFD700',
                    background: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Divider sx={{ my: 2 }} />

        {/* Coaching Intensity */}
        <div style={{ marginBottom: '24px' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Coaching Intensity
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={modes.coachingMode}
              onChange={(e) => handleModeChange('coachingMode', e.target.value)}
              disabled={!modes.enabled}
              sx={{
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                },
              }}
            >
              <MenuItem value="off">
                <Chip label="OFF" size="small" sx={{ bgcolor: '#6B7280' }} />
                <span style={{ marginLeft: 8 }}>No Coaching</span>
              </MenuItem>
              <MenuItem value="gentle">
                <Chip label="GENTLE" size="small" sx={{ bgcolor: '#10B981' }} />
                <span style={{ marginLeft: 8 }}>Encouraging Guidance</span>
              </MenuItem>
              <MenuItem value="normal">
                <Chip label="NORMAL" size="small" sx={{ bgcolor: '#3B82F6' }} />
                <span style={{ marginLeft: 8 }}>Balanced Feedback</span>
              </MenuItem>
              <MenuItem value="aggressive">
                <Chip label="AGGRESSIVE" size="small" sx={{ bgcolor: '#F59E0B' }} />
                <span style={{ marginLeft: 8 }}>Tough Love</span>
              </MenuItem>
              <MenuItem value="brutal">
                <Chip label="BRUTAL" size="small" sx={{ bgcolor: '#EF4444' }} />
                <span style={{ marginLeft: 8 }}>Maximum Harvey</span>
              </MenuItem>
            </Select>
          </FormControl>
        </div>

        <Divider sx={{ my: 2 }} />

        {/* Feature Toggles */}
        <div style={{ marginBottom: '24px' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Features
          </Typography>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={modes.voiceEnabled}
                  onChange={(e) => handleModeChange('voiceEnabled', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {modes.voiceEnabled ? <Mic /> : <MicOff />}
                  <span>Voice Connection</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.dailyVerdicts}
                  onChange={(e) => handleModeChange('dailyVerdicts', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EmojiEvents />
                  <span>Daily Verdicts</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.realTimeCoaching}
                  onChange={(e) => handleModeChange('realTimeCoaching', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <VolumeUp />
                  <span>In-Call Coaching</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.battleMode}
                  onChange={(e) => handleModeChange('battleMode', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Speed />
                  <span>Battle Mode</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.publicShaming}
                  onChange={(e) => handleModeChange('publicShaming', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#EF4444',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#EF4444',
                    },
                  }}
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Warning sx={{ color: '#EF4444' }} />
                  <span>Public Failures</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.afterDarkMode}
                  onChange={(e) => handleModeChange('afterDarkMode', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Nightlight />
                  <span>After Dark</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.motivationalInsults}
                  onChange={(e) => handleModeChange('motivationalInsults', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LocalFireDepartment />
                  <span>Signature Style</span>
                </div>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={modes.trainingWheels}
                  onChange={(e) => handleModeChange('trainingWheels', e.target.checked)}
                  disabled={!modes.enabled}
                  size="small"
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Psychology />
                  <span>Training Mode</span>
                </div>
              }
            />
          </div>
        </div>

        <Divider sx={{ my: 2 }} />

        {/* Direct Interaction */}
        <div style={{ marginBottom: '24px' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Talk to Harvey
          </Typography>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask Harvey anything..."
              value={directMessage}
              onChange={(e) => setDirectMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendDirectMessage()}
              disabled={!modes.enabled}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={sendDirectMessage}
              disabled={!modes.enabled || !directMessage.trim()}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                },
              }}
            >
              <Chat />
            </Button>
            <IconButton
              onClick={toggleVoiceInteraction}
              disabled={!modes.enabled || !modes.voiceEnabled}
              sx={{
                background: isListening ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  background: isListening ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Mic sx={{ color: isListening ? '#EC4899' : 'inherit' }} />
            </IconButton>
          </div>
          
          {harveyResponse && (
            <Alert 
              severity="info" 
              sx={{ 
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                '& .MuiAlert-icon': {
                  color: '#FFD700',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                "{harveyResponse}"
              </Typography>
            </Alert>
          )}
        </div>

        {/* Status Summary */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '4px',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Current Configuration:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Harvey is {modes.enabled ? 'active' : 'offline'} in{' '}
            <Chip 
              label={modes.coachingMode.toUpperCase()} 
              size="small" 
              sx={{ 
                bgcolor: getCoachingModeColor(modes.coachingMode),
                height: 20,
              }} 
            />{' '}
            mode with {Object.values(modes).filter(v => v === true).length - 2} features enabled.
          </Typography>
        </div>
      </Collapse>
    </div>
  );

  if (embedded) {
    return (
      <Paper
        sx={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}
      >
        {content}
      </Paper>
    );
  }

  return (
    <AnimatePresence>
      {open && (
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
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 600 }}
          >
            <Paper
              sx={{
                background: 'rgba(26, 26, 26, 0.98)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              {content}
            </Paper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};