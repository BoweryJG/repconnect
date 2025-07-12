import React, { useState } from 'react';
import { Typography, Button, Grid, Card, CardContent, Chip, alpha } from '@mui/material';
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
    <div
      style={{
        width: '100%',
        backgroundColor: '#0a0a0a',
        color: 'white',
        padding: '32px',
        borderRadius: '8px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Typography
          variant="h3"
          style={{
            fontWeight: 900,
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}
        >
          ELITE CLOSERS DIVISION
        </Typography>
        <Typography variant="h5" style={{ color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic' }}>
          "I don't have dreams, I have goals. And they're all revenue-based."
        </Typography>
      </div>

      {/* Agent Selection */}
      <Grid container spacing={2} style={{ marginBottom: '32px' }}>
        {agents.map((agent) => (
          <Grid item xs={12} sm={6} md={2.4} key={agent.id}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card
                onClick={() => handleSelectAgent(agent.id)}
                style={{
                  backgroundColor:
                    selectedAgentId === agent.id
                      ? alpha(agent.color || '#FFD700', 0.2)
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    selectedAgentId === agent.id
                      ? `2px solid ${agent.color || '#FFD700'}`
                      : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent style={{ textAlign: 'center', padding: '16px' }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor:
                        typeof agent.avatar === 'object' ? agent.avatar.backgroundColor : '#FFD700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    {typeof agent.avatar === 'object' &&
                      agent.avatar.icon &&
                      React.createElement(agent.avatar.icon, {
                        size: 30,
                        color: agent.avatar.iconColor || '#000',
                      })}
                  </div>
                  <Typography
                    variant="h6"
                    style={{ fontWeight: 700, color: agent.color || '#FFD700' }}
                  >
                    {agent.name.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
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
                <div
                  style={{
                    padding: '32px',
                    borderRadius: '8px',
                    background: selectedAgent.colorScheme.gradient,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h4" style={{ fontWeight: 900, marginBottom: '16px' }}>
                      {selectedAgent.name}
                    </Typography>
                    <Typography variant="h6" style={{ marginBottom: '24px', fontStyle: 'italic' }}>
                      {selectedAgent.tagline}
                    </Typography>

                    {/* Key Traits */}
                    <div style={{ marginBottom: '24px' }}>
                      {selectedAgent.personality.traits.map((trait) => (
                        <Chip
                          key={trait}
                          label={trait}
                          style={{
                            marginRight: '8px',
                            marginBottom: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </div>

                    {/* Conversation Starters */}
                    <Typography variant="h6" style={{ marginBottom: '16px' }}>
                      Opening Lines:
                    </Typography>
                    <div style={{ marginBottom: '24px' }}>
                      {selectedAgent.conversationStarters.slice(0, 2).map((starter, idx) => (
                        <Typography key={idx} style={{ marginBottom: '8px', fontStyle: 'italic' }}>
                          "{starter}"
                        </Typography>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleStartConversation}
                        style={{
                          backgroundColor: 'black',
                          color: selectedAgent.colorScheme.primary || '#FFD700',
                          fontWeight: 700,
                        }}
                      >
                        START CLOSING
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setShowObjectionDemo(!showObjectionDemo)}
                        style={{
                          borderColor: 'black',
                          color: 'black',
                          fontWeight: 700,
                        }}
                      >
                        {showObjectionDemo ? 'HIDE' : 'SEE'} OBJECTION HANDLING
                      </Button>
                    </div>
                  </div>
                </div>
              </Grid>

              <Grid item xs={12} md={4}>
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                  }}
                >
                  <Typography variant="h6" style={{ marginBottom: '24px', fontWeight: 700 }}>
                    PROVEN RESULTS
                  </Typography>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <TrendingUp style={{ marginRight: '16px', color: '#00FF00' }} />
                    <Typography>347% Average Revenue Increase</Typography>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <AttachMoney style={{ marginRight: '16px', color: '#FFD700' }} />
                    <Typography>$2.4M in New Bookings (90 days)</Typography>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <Timer style={{ marginRight: '16px', color: '#FF6B6B' }} />
                    <Typography>15 Min Average Close Time</Typography>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <CheckCircle style={{ marginRight: '16px', color: '#4ECDC4' }} />
                    <Typography>94% Close Rate on Qualified Leads</Typography>
                  </div>
                </div>
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
                  <div
                    style={{
                      marginTop: '32px',
                      padding: '24px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                    }}
                  >
                    <Typography variant="h6" style={{ marginBottom: '24px' }}>
                      Objection Handling Examples:
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <div
                          style={{
                            padding: '16px',
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            borderRadius: '4px',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            style={{ color: '#FF6B6B', marginBottom: '8px' }}
                          >
                            "It's too expensive..."
                          </Typography>
                          <Typography variant="body2" style={{ fontStyle: 'italic' }}>
                            "{getObjectionResponse('price')}"
                          </Typography>
                        </div>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <div
                          style={{
                            padding: '16px',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                            borderRadius: '4px',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            style={{ color: '#FFA500', marginBottom: '8px' }}
                          >
                            "I need to think about it..."
                          </Typography>
                          <Typography variant="body2" style={{ fontStyle: 'italic' }}>
                            "{getObjectionResponse('timing')}"
                          </Typography>
                        </div>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <div
                          style={{
                            padding: '16px',
                            backgroundColor: 'rgba(147, 112, 219, 0.1)',
                            borderRadius: '4px',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            style={{ color: '#9370DB', marginBottom: '8px' }}
                          >
                            "How do I know this works?"
                          </Typography>
                          <Typography variant="body2" style={{ fontStyle: 'italic' }}>
                            "{getObjectionResponse('trust')}"
                          </Typography>
                        </div>
                      </Grid>
                    </Grid>

                    <div
                      style={{
                        marginTop: '24px',
                        padding: '16px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        style={{ color: '#FFD700', marginBottom: '8px' }}
                      >
                        CLOSING LINE:
                      </Typography>
                      <Typography variant="body1" style={{ fontWeight: 700 }}>
                        "{getClosingLine('assumptive')}"
                      </Typography>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HarveyAgentShowcase;
