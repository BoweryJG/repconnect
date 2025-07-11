import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, IconButton, TextField, Chip, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { NaturalLanguageProcessor } from '../lib/ai/NaturalLanguageProcessor';
import { adaptiveRenderer } from '../lib/performance/AdaptiveRenderer';

interface VoiceCommandInterfaceProps {
  onCommand: (query: string) => void;
  suggestions?: string[];
}

export const VoiceCommandInterface: React.FC<VoiceCommandInterfaceProps> = ({
  onCommand,
  suggestions = [],
}) => {
  const [isListening, setIsListening] = useState(false);
  const [query, setQuery] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [enableEffects, setEnableEffects] = useState(true);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = adaptiveRenderer.subscribe((settings) => {
      setEnableEffects(settings.enableGlassEffects);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);

        if (event.results[current].isFinal) {
          setQuery(transcript);
          const suggestions = NaturalLanguageProcessor.generateSuggestions(transcript);
          setAiSuggestions(suggestions);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw animated waveform
    const time = Date.now() * 0.001;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';

    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y =
        height / 2 + Math.sin(x * 0.02 + time) * 20 * (isListening ? 1 + Math.random() * 0.5 : 0.2);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    animationRef.current = requestAnimationFrame(drawWaveform);
  }, [isListening]);

  useEffect(() => {
    if (isListening && enableEffects) {
      drawWaveform();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isListening, enableEffects, drawWaveform]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onCommand(query);
      setQuery('');
      setTranscript('');
      setAiSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onCommand(suggestion);
    setAiSuggestions([]);
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(17, 25, 40, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Holographic overlay */}
      {enableEffects && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(45deg, transparent 30%, rgba(0, 255, 136, 0.05) 50%, transparent 70%)',
            animation: 'holographicSweep 3s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Typography
          variant="h5"
          fontWeight="700"
          style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}
        >
          AI Voice Sync
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Speak naturally to sync your calls
        </Typography>
      </div>

      {/* Voice visualization */}
      <div
        style={{
          height: '80px',
          marginBottom: '24px',
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {enableEffects ? (
          <canvas
            ref={canvasRef}
            width={400}
            height={80}
            style={{
              width: '100%',
              height: '100%',
              opacity: isListening ? 1 : 0.3,
              transition: 'opacity 0.3s ease',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {isListening && <CircularProgress size={40} style={{ color: '#00ff88' }} />}
          </div>
        )}

        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '16px',
              right: '16px',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '8px 16px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="caption" style={{ color: '#00ff88' }}>
              {transcript}
            </Typography>
          </motion.div>
        )}
      </div>

      {/* Input field */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) {
              const suggestions = NaturalLanguageProcessor.generateSuggestions(e.target.value);
              setAiSuggestions(suggestions);
            } else {
              setAiSuggestions([]);
            }
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Or type your command..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 255, 136, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00ff88',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
              fontSize: '16px',
            },
          }}
        />

        <IconButton
          onClick={toggleListening}
          style={{
            background: isListening
              ? 'linear-gradient(135deg, #ff0040 0%, #ff0080 100%)'
              : 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
            width: '56px',
            height: '56px',
            boxShadow: isListening
              ? '0 0 30px rgba(255, 0, 64, 0.5)'
              : '0 0 30px rgba(0, 255, 136, 0.3)',
          }}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>

        <IconButton
          onClick={handleSubmit}
          disabled={!query.trim()}
          style={{
            background: query.trim()
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            width: '56px',
            height: '56px',
            boxShadow: query.trim() ? '0 0 30px rgba(99, 102, 241, 0.4)' : 'none',
          }}
        >
          <SendIcon />
        </IconButton>
      </div>

      {/* AI Suggestions */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 16, color: '#ffd93d' }} />
              <Typography variant="caption" color="text.secondary">
                AI Suggestions
              </Typography>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Chip
                    label={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: 'white',
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(99, 102, 241, 0.3)',
                        borderColor: 'rgba(99, 102, 241, 0.5)',
                      },
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example queries */}
      {!query && !transcript && (
        <div style={{ marginTop: '24px' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Try saying:
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {[
              '"Sync my top 50 accounts in Greenwich interested in fraxel"',
              '"Queue high-value clients from this week"',
              '"Prepare calls for accounts tagged premium"',
            ].map((example) => (
              <Typography
                key={example}
                variant="body2"
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                }}
                onClick={() => setQuery(example.replace(/"/g, ''))}
              >
                {example}
              </Typography>
            ))}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes holographicSweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>
    </div>
  );
};
