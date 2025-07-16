import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Stack,
  Paper,
  LinearProgress,
  Fade,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Mic,
  MicOff,
  PhoneDisabled,
  VolumeUp,
  Speed,
  Psychology,
  TipsAndUpdates,
  ExpandLess,
  ExpandMore,
  AccessTime,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Analytics,
} from '@mui/icons-material';

interface Message {
  id: string;
  speaker: 'agent' | 'customer' | 'ai';
  text: string;
  timestamp: Date;
  isFinal: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ActiveChatInterfaceProps {
  sessionId: string;
  agentName: string;
  agentAvatar?: string;
  customerName?: string;
  isConnected: boolean;
  isMuted: boolean;
  audioLevel: number;
  onToggleMute: () => void;
  onEndCall: () => void;
  callDuration: number;
  conversationMetrics?: {
    talkRatio: number;
    pace: 'slow' | 'normal' | 'fast';
    sentiment: 'positive' | 'neutral' | 'negative';
    objectionCount: number;
    questionsAsked: number;
  };
  coachingInsights?: Array<{
    type: 'tip' | 'warning' | 'praise' | 'suggestion';
    message: string;
    timestamp: Date;
  }>;
}

export const ActiveChatInterface: React.FC<ActiveChatInterfaceProps> = ({
  sessionId: _sessionId,
  agentName,
  agentAvatar,
  customerName = 'Customer',
  isConnected,
  isMuted,
  audioLevel,
  onToggleMute,
  onEndCall,
  callDuration,
  conversationMetrics = {
    talkRatio: 50,
    pace: 'normal',
    sentiment: 'neutral',
    objectionCount: 0,
    questionsAsked: 0,
  },
  coachingInsights = [],
}) => {
  const [messages, _setMessages] = useState<Message[]>([]);
  const [_currentTranscript, _setCurrentTranscript] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMetrics, _setShowMetrics] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentSatisfied sx={{ color: 'success.main' }} />;
      case 'negative':
        return <SentimentDissatisfied sx={{ color: 'error.main' }} />;
      default:
        return <SentimentNeutral sx={{ color: 'text.secondary' }} />;
    }
  };

  const getPaceColor = (pace: string) => {
    switch (pace) {
      case 'slow':
        return 'warning.main';
      case 'fast':
        return 'error.main';
      default:
        return 'success.main';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1300,
      }}
    >
      {isConnected && (
        <div
          style={{
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <Card
            sx={{
              width: isMinimized ? 350 : 800,
              height: isMinimized ? 80 : 600,
              transition: 'all 0.3s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 6,
            }}
          >
            <div
              style={{
                padding: 16,
                backgroundColor: '#1976d2',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={agentAvatar} alt={agentName} sx={{ bgcolor: 'primary.dark' }}>
                  <Psychology />
                </Avatar>
                <div>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {agentName}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime sx={{ fontSize: 16 }} />
                    <Typography variant="caption">{formatDuration(callDuration)}</Typography>
                    <Chip
                      size="small"
                      label={isConnected ? 'Connected' : 'Connecting...'}
                      color={isConnected ? 'success' : 'warning'}
                      sx={{ height: 20 }}
                    />
                  </Stack>
                </div>
              </Stack>

              <Stack direction="row" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => setIsMinimized(!isMinimized)}
                  sx={{ color: 'primary.contrastText' }}
                >
                  {isMinimized ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>
            </div>

            {!isMinimized && (
              <CardContent sx={{ flex: 1, p: 0, display: 'flex' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 16,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Stack spacing={2}>
                      {messages.map((message) => (
                        <Fade in key={message.id}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1.5,
                              alignSelf: message.speaker === 'customer' ? 'flex-end' : 'flex-start',
                              maxWidth: '70%',
                              bgcolor:
                                message.speaker === 'customer'
                                  ? 'primary.light'
                                  : 'background.paper',
                              color:
                                message.speaker === 'customer'
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold">
                                {message.speaker === 'customer' ? customerName : agentName}
                              </Typography>
                              {message.sentiment && getSentimentIcon(message.sentiment)}
                            </Stack>
                            <Typography variant="body2">{message.text}</Typography>
                            {!message.isFinal && (
                              <Typography
                                variant="caption"
                                sx={{ opacity: 0.6, fontStyle: 'italic' }}
                              >
                                ...
                              </Typography>
                            )}
                          </Paper>
                        </Fade>
                      ))}
                      <div ref={messagesEndRef} />
                    </Stack>
                  </div>

                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Stack spacing={2}>
                      <LinearProgress
                        variant="determinate"
                        value={audioLevel * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: audioLevel > 0.7 ? 'error.main' : 'primary.main',
                          },
                        }}
                      />

                      <Stack direction="row" spacing={2} justifyContent="center">
                        <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                          <IconButton
                            color={isMuted ? 'error' : 'default'}
                            onClick={onToggleMute}
                            size="large"
                          >
                            {isMuted ? <MicOff /> : <Mic />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="End Call">
                          <IconButton color="error" onClick={onEndCall} size="large">
                            <PhoneDisabled />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Volume">
                          <IconButton size="large">
                            <VolumeUp />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                </div>

                <Divider orientation="vertical" flexItem />

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fafafa',
                  }}
                >
                  {showMetrics && (
                    <div style={{ padding: 16 }}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Analytics /> Conversation Metrics
                      </Typography>
                      <Stack spacing={1.5}>
                        <div>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption">Talk Ratio</Typography>
                            <Typography variant="caption">
                              {conversationMetrics.talkRatio}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={conversationMetrics.talkRatio}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </div>

                        <Stack direction="row" spacing={1}>
                          <Chip
                            icon={<Speed />}
                            label={`Pace: ${conversationMetrics.pace}`}
                            size="small"
                            sx={{ color: getPaceColor(conversationMetrics.pace) }}
                          />
                          <Chip
                            icon={getSentimentIcon(conversationMetrics.sentiment)}
                            label={conversationMetrics.sentiment}
                            size="small"
                          />
                        </Stack>

                        <Stack direction="row" spacing={2}>
                          <Typography variant="caption">
                            Questions: {conversationMetrics.questionsAsked}
                          </Typography>
                          <Typography variant="caption">
                            Objections: {conversationMetrics.objectionCount}
                          </Typography>
                        </Stack>
                      </Stack>
                    </div>
                  )}

                  <Divider />

                  <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <TipsAndUpdates /> AI Coaching
                    </Typography>
                    <Stack spacing={1}>
                      {coachingInsights.map((insight, index) => (
                        <Fade in key={index}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              bgcolor:
                                insight.type === 'warning'
                                  ? 'warning.light'
                                  : insight.type === 'praise'
                                    ? 'success.light'
                                    : 'info.light',
                              borderLeft: 3,
                              borderColor:
                                insight.type === 'warning'
                                  ? 'warning.main'
                                  : insight.type === 'praise'
                                    ? 'success.main'
                                    : 'info.main',
                            }}
                          >
                            <Typography variant="body2">{insight.message}</Typography>
                          </Paper>
                        </Fade>
                      ))}
                    </Stack>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
