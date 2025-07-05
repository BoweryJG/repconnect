import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Alert,
  Paper,
  Fade,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Psychology,
  RecordVoiceOver,
  TipsAndUpdates,
  Warning,
  CheckCircle,
  Speed
} from '@mui/icons-material';
import { WebRTCVoiceInterface } from './WebRTCVoiceInterface';
import moshiWebRTCBridge from '../services/moshiWebRTCBridge';
import { harveyCoach } from '../services/harveyCoach';

interface HarveyVoiceCoachProps {
  repId: string;
  callContext?: {
    contactName?: string;
    company?: string;
    callObjective?: string;
  };
}

interface CoachingInsight {
  type: 'tip' | 'warning' | 'praise' | 'suggestion';
  message: string;
  confidence: number;
  timestamp: Date;
}

export const HarveyVoiceCoach: React.FC<HarveyVoiceCoachProps> = ({
  repId,
  callContext
}) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [conversationMetrics, setConversationMetrics] = useState({
    talkRatio: 50,
    pace: 'normal' as 'slow' | 'normal' | 'fast',
    sentiment: 'neutral' as 'positive' | 'neutral' | 'negative',
    objectionCount: 0,
    questionsAsked: 0
  });

  // Initialize Harvey Coach connection
  useEffect(() => {
    if (isActive && sessionId) {
      // Set up Harvey Coach listeners
      moshiWebRTCBridge.on('transcript', handleTranscriptAnalysis);
      moshiWebRTCBridge.on('emotion', handleEmotionDetection);

      // Initialize Harvey's voice coaching mode
      harveyCoach.startVoiceCoaching(repId, {
        mode: 'real-time',
        intensity: process.env.HARVEY_PERSONALITY_MODE || 'balanced',
        context: callContext
      });

      return () => {
        moshiWebRTCBridge.off('transcript', handleTranscriptAnalysis);
        moshiWebRTCBridge.off('emotion', handleEmotionDetection);
        harveyCoach.stopVoiceCoaching();
      };
    }
  }, [isActive, sessionId, repId]);

  const handleTranscriptAnalysis = useCallback(async (data: {
    sessionId: string;
    text: string;
    isFinal: boolean;
  }) => {
    if (!data.isFinal || data.sessionId !== sessionId) return;

    // Analyze transcript with Harvey
    const analysis = await harveyCoach.analyzeConversation({
      transcript: data.text,
      repId,
      context: callContext,
      metrics: conversationMetrics
    });

    // Update metrics
    if (analysis.metrics) {
      setConversationMetrics(prev => ({
        ...prev,
        ...analysis.metrics
      }));
    }

    // Add coaching insights
    if (analysis.insights && analysis.insights.length > 0) {
      const newInsights: CoachingInsight[] = analysis.insights.map((insight: any) => ({
        type: insight.type,
        message: insight.message,
        confidence: insight.confidence || 0.8,
        timestamp: new Date()
      }));

      setCoachingInsights(prev => [...newInsights, ...prev].slice(0, 5)); // Keep last 5 insights
    }

    // Real-time intervention if needed
    if (analysis.requiresIntervention) {
      handleHarveyIntervention(analysis.intervention);
    }
  }, [sessionId, repId, callContext, conversationMetrics]);

  const handleEmotionDetection = useCallback((data: {
    sessionId: string;
    emotion: string;
    confidence: number;
  }) => {
    if (data.sessionId !== sessionId) return;
    
    setCurrentEmotion(data.emotion);
    
    // Harvey reacts to customer emotions
    if (data.confidence > 0.7) {
      const emotionResponse = harveyCoach.getEmotionResponse(data.emotion);
      if (emotionResponse) {
        setCoachingInsights(prev => [{
          type: 'tip',
          message: emotionResponse,
          confidence: data.confidence,
          timestamp: new Date()
        }, ...prev].slice(0, 5));
      }
    }
  }, [sessionId]);

  const handleHarveyIntervention = async (intervention: any) => {
    // Harvey can inject audio coaching directly into the call
    if (intervention.type === 'audio' && intervention.urgency === 'high') {
      try {
        await moshiWebRTCBridge.sendText(sessionId, intervention.message);
      } catch (error) {
        console.error('Failed to send Harvey intervention:', error);
      }
    }
  };

  const getInsightIcon = (type: CoachingInsight['type']) => {
    switch (type) {
      case 'tip':
        return <TipsAndUpdates color="primary" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'praise':
        return <CheckCircle color="success" />;
      case 'suggestion':
        return <Psychology color="info" />;
    }
  };

  const getInsightColor = (type: CoachingInsight['type']) => {
    switch (type) {
      case 'tip': return 'primary';
      case 'warning': return 'warning';
      case 'praise': return 'success';
      case 'suggestion': return 'info';
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* Voice Interface */}
      <Box sx={{ flex: 1 }}>
        <WebRTCVoiceInterface
          sessionId={sessionId}
          onTranscript={(text, isFinal) => {
            // Transcript handling is done via moshiWebRTCBridge events
          }}
          onError={(error) => {
            console.error('Voice interface error:', error);
          }}
          autoConnect={false}
          showTranscript={true}
        />
      </Box>

      {/* Harvey Coach Panel */}
      <Box sx={{ flex: 1, maxWidth: 400 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56
                }}
              >
                <Psychology fontSize="large" />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6">Harvey AI Coach</Typography>
                <Typography variant="body2" color="textSecondary">
                  Real-time sales coaching
                </Typography>
              </Box>
              {isActive && (
                <Chip
                  icon={<RecordVoiceOver />}
                  label="Active"
                  color="success"
                  size="small"
                />
              )}
            </Box>

            {/* Conversation Metrics */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Conversation Metrics
              </Typography>
              
              <Stack spacing={1}>
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">Talk Ratio</Typography>
                    <Typography variant="caption">{conversationMetrics.talkRatio}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={conversationMetrics.talkRatio}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box display="flex" gap={1}>
                  <Chip
                    size="small"
                    icon={<Speed />}
                    label={`Pace: ${conversationMetrics.pace}`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`${conversationMetrics.questionsAsked} Questions`}
                    variant="outlined"
                  />
                </Box>

                {currentEmotion !== 'neutral' && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Customer emotion: {currentEmotion}
                  </Alert>
                )}
              </Stack>
            </Paper>

            {/* Coaching Insights */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Real-time Insights
              </Typography>
              
              <Stack spacing={1}>
                {coachingInsights.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center" py={2}>
                    Start a conversation to receive coaching insights
                  </Typography>
                ) : (
                  coachingInsights.map((insight, index) => (
                    <Fade in key={index}>
                      <Alert
                        severity={getInsightColor(insight.type)}
                        icon={getInsightIcon(insight.type)}
                        sx={{ 
                          py: 0.5,
                          '& .MuiAlert-message': { 
                            fontSize: '0.875rem' 
                          }
                        }}
                      >
                        {insight.message}
                      </Alert>
                    </Fade>
                  ))
                )}
              </Stack>
            </Box>

            {/* Harvey's Personality Mode */}
            <Box mt={2} pt={2} borderTop={1} borderColor="divider">
              <Typography variant="caption" color="textSecondary">
                Harvey Mode: {process.env.HARVEY_PERSONALITY_MODE || 'Balanced'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};