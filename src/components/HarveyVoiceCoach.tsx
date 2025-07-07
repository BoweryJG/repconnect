import React, { useState, useEffect, useCallback } from 'react';
import {
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
import voiceBridgeFactory from '../services/voiceBridgeFactory';
import harveyCoach from '../services/harveyCoach';

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
      const voiceBridge = voiceBridgeFactory.getBridge();
      voiceBridge.on('transcript', handleTranscriptAnalysis);
      voiceBridge.on('emotion', handleEmotionDetection);

      // Initialize Harvey's voice coaching mode
      harveyCoach.startVoiceCoaching(repId, {
        mode: 'real-time',
        intensity: process.env.HARVEY_PERSONALITY_MODE || 'balanced',
        context: callContext
      });

      return () => {
        const voiceBridge = voiceBridgeFactory.getBridge();
        voiceBridge.off('transcript', handleTranscriptAnalysis);
        voiceBridge.off('emotion', handleEmotionDetection);
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
        sentiment: analysis.metrics.sentiment as 'positive' | 'negative' | 'neutral',
        objectionCount: analysis.metrics.objectionCount
      }));
    }

    // Add coaching insights
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      const newInsights: CoachingInsight[] = analysis.recommendations.map((recommendation: any) => ({
        type: recommendation.type,
        message: recommendation.message,
        confidence: 0.8,
        timestamp: new Date()
      }));

      setCoachingInsights(prev => [...newInsights, ...prev].slice(0, 5)); // Keep last 5 insights
    }

    // Real-time intervention if needed
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      const highPriorityRecommendation = analysis.recommendations.find((r: any) => r.urgency === 'high') as any;
      if (highPriorityRecommendation) {
        handleHarveyIntervention({
          message: highPriorityRecommendation.message,
          type: highPriorityRecommendation.type
        });
      }
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
          type: 'tip' as const,
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
        const voiceBridge = voiceBridgeFactory.getBridge();
        await voiceBridge.sendText(sessionId, intervention.message);
      } catch (error) {
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
      case 'tip': return 'info';
      case 'warning': return 'warning';
      case 'praise': return 'success';
      case 'suggestion': return 'info';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      {/* Voice Interface */}
      <div style={{ flex: 1 }}>
        <WebRTCVoiceInterface
          sessionId={sessionId}
          onTranscript={(text, isFinal) => {
            // Transcript handling is done via moshiWebRTCBridge events
          }}
          onError={(error) => {
                      }}
          autoConnect={false}
          showTranscript={true}
        />
      </div>

      {/* Harvey Coach Panel */}
      <div style={{ flex: 1, maxWidth: '400px' }}>
        <Card>
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56
                }}
              >
                <Psychology fontSize="large" />
              </Avatar>
              <div style={{ flex: 1 }}>
                <Typography variant="h6">Harvey AI Coach</Typography>
                <Typography variant="body2" color="textSecondary">
                  Real-time sales coaching
                </Typography>
              </div>
              {isActive && (
                <Chip
                  icon={<RecordVoiceOver />}
                  label="Active"
                  color="success"
                  size="small"
                />
              )}
            </div>

            {/* Conversation Metrics */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Conversation Metrics
              </Typography>
              
              <Stack spacing={1}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Talk Ratio</Typography>
                    <Typography variant="caption">{conversationMetrics.talkRatio}%</Typography>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={conversationMetrics.talkRatio}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
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
                </div>

                {currentEmotion !== 'neutral' && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Customer emotion: {currentEmotion}
                  </Alert>
                )}
              </Stack>
            </Paper>

            {/* Coaching Insights */}
            <div>
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
            </div>

            {/* Harvey's Personality Mode */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" color="textSecondary">
                Harvey Mode: {process.env.HARVEY_PERSONALITY_MODE || 'Balanced'}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};