import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AttachMoney, Timer, CheckCircle } from '@mui/icons-material';
import {
  harveyStyleAgents,
  getObjectionResponse,
  getClosingLine,
} from './agents/harveyStyleAgents';
import type { Agent } from './types';

interface HarveyAgentShowcaseProps {
  onSelectAgent: (_agent: Agent) => void;
}

const HarveyAgentShowcase: React.FC<HarveyAgentShowcaseProps> = ({ onSelectAgent }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('victor');
  const [showObjectionDemo, setShowObjectionDemo] = useState(false);

  const agents: Agent[] = Object.values(harveyStyleAgents).map((config) => ({
    ...config,
    category: 'sales' as const,
    available: true,
    description: config.tagline,
    specialty: config.knowledgeDomains[0],
    color: config.colorScheme.primary,
    voiceConfig: {
      ...config.voiceConfig,
      useSpeakerBoost: config.voiceConfig.speakerBoost,
    },
    visualEffects: {
      ...config.visualEffects,
      animation: config.visualEffects.animation,
      glow: config.visualEffects.glowEffect,
      pulse: config.visualEffects.pulseEffect,
      particleEffect: config.visualEffects.particleEffect || '',
    },
  }));

  const selectedAgent = harveyStyleAgents[selectedAgentId];

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const handleStartConversation = () => {
    const agent = agents.find((a) => a.id === selectedAgentId);
    if (agent) {
      onSelectAgent(agent);
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: '#0a0a0a', color: 'white', p: 4, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          ELITE CLOSERS DIVISION
        </Typography>
        <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic' }}>
          "I don't have dreams, I have goals. And they're all revenue-based."
        </Typography>
      </Box>

      {/* Agent Selection */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {agents.map((agent) => (
          <Grid item xs={12} sm={6} md={2.4} key={agent.id}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card
                onClick={() => handleSelectAgent(agent.id)}
                sx={{
                  bgcolor:
                    selectedAgentId === agent.id
                      ? alpha(agent.color, 0.2)
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    selectedAgentId === agent.id
                      ? `2px solid ${agent.color}`
                      : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(agent.color, 0.1),
                    borderColor: agent.color,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: agent.avatar.backgroundColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {React.createElement(agent.avatar.icon, {
                      size: 30,
                      color: agent.avatar.iconColor,
                    })}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: agent.color }}>
                    {agent.name.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {agent.specialty}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Selected Agent Details */}
      <AnimatePresence mode="wait">
        {selectedAgent && (
          <motion.div
            key={selectedAgentId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    background: selectedAgent.colorScheme.gradient,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
                      {selectedAgent.name}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 3, fontStyle: 'italic' }}>
                      {selectedAgent.tagline}
                    </Typography>

                    {/* Key Traits */}
                    <Box sx={{ mb: 3 }}>
                      {selectedAgent.personality.traits.map((trait) => (
                        <Chip
                          key={trait}
                          label={trait}
                          sx={{
                            mr: 1,
                            mb: 1,
                            bgcolor: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>

                    {/* Conversation Starters */}
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Opening Lines:
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {selectedAgent.conversationStarters.slice(0, 2).map((starter, idx) => (
                        <Typography key={idx} sx={{ mb: 1, fontStyle: 'italic' }}>
                          "{starter}"
                        </Typography>
                      ))}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleStartConversation}
                        sx={{
                          bgcolor: 'black',
                          color: selectedAgent.colorScheme.primary,
                          fontWeight: 700,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.8)',
                          },
                        }}
                      >
                        START CLOSING
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setShowObjectionDemo(!showObjectionDemo)}
                        sx={{
                          borderColor: 'black',
                          color: 'black',
                          fontWeight: 700,
                          '&:hover': {
                            borderColor: 'black',
                            bgcolor: 'rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        {showObjectionDemo ? 'HIDE' : 'SEE'} OBJECTION HANDLING
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                    PROVEN RESULTS
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ mr: 2, color: '#00FF00' }} />
                    <Typography>347% Average Revenue Increase</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney sx={{ mr: 2, color: '#FFD700' }} />
                    <Typography>$2.4M in New Bookings (90 days)</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Timer sx={{ mr: 2, color: '#FF6B6B' }} />
                    <Typography>15 Min Average Close Time</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ mr: 2, color: '#4ECDC4' }} />
                    <Typography>94% Close Rate on Qualified Leads</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Objection Handling Demo */}
            <AnimatePresence>
              {showObjectionDemo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                      Objection Handling Examples:
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 0, 0, 0.1)', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#FF6B6B', mb: 1 }}>
                            "It's too expensive..."
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            "{getObjectionResponse('price')}"
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 165, 0, 0.1)', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#FFA500', mb: 1 }}>
                            "I need to think about it..."
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            "{getObjectionResponse('timing')}"
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(147, 112, 219, 0.1)', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#9370DB', mb: 1 }}>
                            "How do I know this works?"
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            "{getObjectionResponse('trust')}"
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 215, 0, 0.1)', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                        CLOSING LINE:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        "{getClosingLine('assumptive')}"
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default HarveyAgentShowcase;
