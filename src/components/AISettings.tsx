import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

interface AISettingsProps {
  open: boolean;
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ open, onClose }) => {
  const { aiEnabled, toggleAI } = useStore();
  
  // AI Settings State
  const [settings, setSettings] = useState({
    autoDialing: true,
    callPrioritization: 'score',
    retryAttempts: 3,
    callSpacing: 5,
    voiceTranscription: true,
    sentimentAnalysis: true,
    autoNotes: true,
    smartScheduling: true,
    confidenceThreshold: 70,
    maxConcurrentCalls: 1,
    preferredCallTimes: 'business',
    languageModel: 'gpt-4',
    toneMatching: true,
    objectionHandling: true,
    personalityAdaptation: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings to store/backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      autoDialing: true,
      callPrioritization: 'score',
      retryAttempts: 3,
      callSpacing: 5,
      voiceTranscription: true,
      sentimentAnalysis: true,
      autoNotes: true,
      smartScheduling: true,
      confidenceThreshold: 70,
      maxConcurrentCalls: 1,
      preferredCallTimes: 'business',
      languageModel: 'gpt-4',
      toneMatching: true,
      objectionHandling: true,
      personalityAdaptation: true,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(40, 40, 40, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        pb: 2,
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI Assistant Settings
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Settings saved successfully!
          </Alert>
        )}

        {/* Master AI Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={aiEnabled}
                onChange={toggleAI}
                color="primary"
                size="medium"
              />
            }
            label={
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Assistant {aiEnabled ? 'Enabled' : 'Disabled'}
              </Typography>
            }
            sx={{ mb: 3 }}
          />
        </motion.div>

        <Divider sx={{ my: 2 }} />

        {/* Call Management */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Call Management
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoDialing}
              onChange={(e) => setSettings({ ...settings, autoDialing: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Auto-dialing"
          sx={{ mb: 2, display: 'block' }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Call Prioritization</InputLabel>
          <Select
            value={settings.callPrioritization}
            onChange={(e) => setSettings({ ...settings, callPrioritization: e.target.value })}
            disabled={!aiEnabled}
          >
            <MenuItem value="score">AI Score</MenuItem>
            <MenuItem value="value">Deal Value</MenuItem>
            <MenuItem value="recency">Last Contact</MenuItem>
            <MenuItem value="manual">Manual Order</MenuItem>
          </Select>
        </FormControl>

        <Typography gutterBottom>Retry Attempts: {settings.retryAttempts}</Typography>
        <Slider
          value={settings.retryAttempts}
          onChange={(_, value) => setSettings({ ...settings, retryAttempts: value as number })}
          min={0}
          max={5}
          marks
          disabled={!aiEnabled}
          sx={{ mb: 2 }}
        />

        <Typography gutterBottom>Call Spacing: {settings.callSpacing} seconds</Typography>
        <Slider
          value={settings.callSpacing}
          onChange={(_, value) => setSettings({ ...settings, callSpacing: value as number })}
          min={1}
          max={30}
          disabled={!aiEnabled}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Voice & Analysis */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Voice & Analysis
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.voiceTranscription}
              onChange={(e) => setSettings({ ...settings, voiceTranscription: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Real-time Transcription"
          sx={{ mb: 1, display: 'block' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.sentimentAnalysis}
              onChange={(e) => setSettings({ ...settings, sentimentAnalysis: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Sentiment Analysis"
          sx={{ mb: 1, display: 'block' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.autoNotes}
              onChange={(e) => setSettings({ ...settings, autoNotes: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Auto-generate Call Notes"
          sx={{ mb: 3, display: 'block' }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Advanced AI Features */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Advanced AI Features
        </Typography>

        <Typography gutterBottom>Confidence Threshold: {settings.confidenceThreshold}%</Typography>
        <Slider
          value={settings.confidenceThreshold}
          onChange={(_, value) => setSettings({ ...settings, confidenceThreshold: value as number })}
          min={0}
          max={100}
          disabled={!aiEnabled}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Language Model</InputLabel>
          <Select
            value={settings.languageModel}
            onChange={(e) => setSettings({ ...settings, languageModel: e.target.value })}
            disabled={!aiEnabled}
          >
            <MenuItem value="gpt-4">GPT-4 (Most Accurate)</MenuItem>
            <MenuItem value="gpt-3.5">GPT-3.5 (Faster)</MenuItem>
            <MenuItem value="claude">Claude (Conversational)</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={settings.toneMatching}
              onChange={(e) => setSettings({ ...settings, toneMatching: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Tone Matching"
          sx={{ mb: 1, display: 'block' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.objectionHandling}
              onChange={(e) => setSettings({ ...settings, objectionHandling: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Smart Objection Handling"
          sx={{ mb: 1, display: 'block' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.personalityAdaptation}
              onChange={(e) => setSettings({ ...settings, personalityAdaptation: e.target.checked })}
              disabled={!aiEnabled}
            />
          }
          label="Personality Adaptation"
          sx={{ mb: 3, display: 'block' }}
        />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #818CF8 0%, #F472B6 100%)',
              },
            }}
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};