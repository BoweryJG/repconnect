import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Paper,
  Typography,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import { ChatBubbleOutline, Close } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { Agent, ChatbotLauncherProps } from './types';

// Keyframe animations
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(59, 130, 246, 0.8),
      0 0 40px rgba(59, 130, 246, 0.4),
      0 0 60px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 
      0 0 30px rgba(59, 130, 246, 0.9),
      0 0 50px rgba(59, 130, 246, 0.5),
      0 0 70px rgba(59, 130, 246, 0.3);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Styled components
const LauncherContainer = styled(Box)(() => ({
  position: 'fixed',
  zIndex: 1300,
  transition: 'all 0.3s ease',
}));

const FloatingOrb = styled(IconButton)<{ glowcolor?: string }>(({ theme, glowcolor }) => ({
  width: 64,
  height: 64,
  backgroundColor: glowcolor || theme.palette.primary.main,
  color: theme.palette.common.white,
  animation: `${pulse} 2s infinite, ${float} 3s ease-in-out infinite`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: glowcolor || theme.palette.primary.dark,
    animation: `${glow} 1.5s ease-in-out infinite, ${float} 3s ease-in-out infinite`,
    transform: 'scale(1.1)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 28,
  },
}));

const CarouselContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 80,
  right: 0,
  width: 380,
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: '70vh',
  overflow: 'hidden',
  borderRadius: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.95)', // Increased opacity for better fallback
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)', // More visible border
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)', // Stronger shadow for depth
  '@supports not (backdrop-filter: blur(20px))': {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100vw - 32px)',
    right: '50%',
    transform: 'translateX(50%)',
  },
}));

const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
}));

const AgentCarousel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  overflowX: 'auto',
  overflowY: 'hidden',
  gap: theme.spacing(1.5),
  scrollSnapType: 'x mandatory',
  '&::-webkit-scrollbar': {
    height: 6,
    display: 'none', // Hide scrollbar for cleaner mobile look
  },
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    gap: theme.spacing(1),
  },
}));

const AgentCard = styled(Box)<{ agentcolor: string }>(({ theme, agentcolor }) => ({
  minWidth: 140,
  maxWidth: 160,
  height: 120,
  padding: theme.spacing(1.5),
  borderRadius: 12,
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${agentcolor}15 0%, ${agentcolor}08 100%)`,
  border: `1px solid ${agentcolor}25`,
  scrollSnapAlign: 'start',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    minWidth: 120,
    maxWidth: 140,
    height: 100,
    padding: theme.spacing(1),
  },
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 4px 12px ${agentcolor}30`,
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const StyledAvatar = styled(Avatar)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  width: 48,
  height: 48,
  backgroundColor: bgcolor,
  color: theme.palette.common.white,
  fontSize: 20,
  marginBottom: theme.spacing(0.5),
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    width: 40,
    height: 40,
    fontSize: 18,
  },
}));

// Default agents - removed as agents are now passed from parent
/*
const defaultAgents: Agent[] = [
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    avatar: '🤖',
    description: 'General purpose AI helper for all your needs',
    specialty: 'General Support',
    color: '#3B82F6',
    available: true,
    category: 'general' as const,
    tagline: 'Your intelligent assistant',
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#DBEAFE',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.3)'
    },
    personality: {
      tone: 'Friendly and helpful',
      traits: ['Knowledgeable', 'Patient', 'Supportive'],
      approachStyle: 'Conversational and informative',
      communicationPreferences: ['Clear explanations', 'Step-by-step guidance']
    },
    voiceConfig: {
      voiceId: 'default',
      stability: 0.5,
      similarityBoost: 0.5,
      style: 0.5,
      useSpeakerBoost: true
    },
    knowledgeDomains: ['General knowledge', 'Problem solving'],
    conversationStarters: ['How can I help you today?'],
    visualEffects: {
      animation: 'pulse',
      glow: true,
      pulse: true,
      particleEffect: 'sparkle'
    }
  },
  {
    id: 'sales-coach',
    name: 'Sales Coach',
    avatar: '🧠',
    description: 'Expert guidance for closing deals and sales strategies',
    specialty: 'Sales Training',
    color: '#10B981',
    available: true,
  },
  {
    id: 'tech-support',
    name: 'Tech Support',
    avatar: '🛟',
    description: 'Technical assistance and troubleshooting',
    specialty: 'Technical Help',
    color: '#F59E0B',
    available: true,
  },
  {
    id: 'harvey',
    name: 'Harvey AI',
    avatar: '✨',
    description: 'Premium AI agent with advanced capabilities',
    specialty: 'Premium Support',
    color: '#9333EA',
    available: false,
  },
];
*/

const ChatbotLauncher: React.FC<ChatbotLauncherProps> = ({
  agents = [],
  onAgentSelect,
  position = 'bottom-right',
  glowColor = '#3B82F6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    console.log('ChatbotLauncher toggle clicked, current state:', isOpen);
    console.log('Available agents:', agents.length);
    setIsOpen(!isOpen);
  };

  const handleAgentClick = (agent: Agent) => {
    console.log('ChatbotLauncher agent clicked:', agent.name, 'available:', agent.available);
    if (agent.available) {
      onAgentSelect?.(agent);
      setIsOpen(false);
    }
  };

  const positionStyles = {
    'bottom-right': {
      bottom: 24,
      right: 24,
    },
    'bottom-left': {
      bottom: 24,
      left: 24,
    },
  };

  // Compute styles separately to avoid complex union type
  const containerStyles = {
    ...positionStyles[position],
    ...(isMobile
      ? {
          bottom: 16,
          right: position === 'bottom-right' ? 16 : undefined,
          left: position === 'bottom-left' ? 16 : undefined,
        }
      : {}),
  };

  return (
    <LauncherContainer ref={containerRef} sx={containerStyles}>
      {/* Floating Orb */}
      <Zoom in={!isOpen} unmountOnExit>
        <FloatingOrb onClick={handleToggle} glowcolor={glowColor} aria-label="Open chat assistant">
          <ChatBubbleOutline />
        </FloatingOrb>
      </Zoom>

      {/* Expanded Carousel */}
      <Fade in={isOpen} unmountOnExit>
        <CarouselContainer elevation={8}>
          <Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="h6" fontWeight={600}>
                  Choose Your Assistant
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Select an AI agent to help you
                </Typography>
              </div>
              <IconButton onClick={handleToggle} size="small">
                <Close />
              </IconButton>
            </div>
          </Header>

          <AgentCarousel>
            {agents.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '20px',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Loading agents...
                </Typography>
              </div>
            ) : (
              agents.map((agent) => (
                <Tooltip
                  key={agent.id}
                  title={!agent.available ? 'Coming Soon' : ''}
                  placement="left"
                >
                  <AgentCard
                    agentcolor={agent.color || '#3B82F6'}
                    onClick={() => handleAgentClick(agent)}
                    sx={{
                      opacity: agent.available ? 1 : 0.6,
                      cursor: agent.available ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <StyledAvatar bgcolor={agent.color || '#3B82F6'}>
                      {typeof agent.avatar === 'string' ? (
                        <span style={{ fontSize: '1.5rem' }}>{agent.avatar}</span>
                      ) : (
                        (() => {
                          const Icon = agent.avatar.icon;
                          return (
                            <Icon size={24} style={{ color: agent.avatar.iconColor || '#fff' }} />
                          );
                        })()
                      )}
                    </StyledAvatar>
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          lineHeight: 1.2,
                          mb: 0.5,
                        }}
                      >
                        {agent.name}
                      </Typography>
                      {!agent.available && (
                        <Chip
                          label="Soon"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: agent.color,
                          fontWeight: 500,
                          mt: 0.5,
                          display: 'block',
                        }}
                      >
                        {agent.specialty}
                      </Typography>
                    </div>
                  </AgentCard>
                </Tooltip>
              ))
            )}
          </AgentCarousel>
        </CarouselContainer>
      </Fade>

      {/* Close Button when expanded */}
      <Zoom in={isOpen} unmountOnExit>
        <FloatingOrb
          onClick={handleToggle}
          sx={{
            backgroundColor: theme.palette.grey[700],
            '&:hover': {
              backgroundColor: theme.palette.grey[800],
            },
          }}
          aria-label="Close chat assistant"
        >
          <Close />
        </FloatingOrb>
      </Zoom>
    </LauncherContainer>
  );
};

export default ChatbotLauncher;
export type { Agent } from './types';
