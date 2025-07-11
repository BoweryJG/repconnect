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
import {
  ChatBubbleOutline,
  Close,
  SmartToy,
  Psychology,
  Support,
  AutoAwesome,
} from '@mui/icons-material';
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
const LauncherContainer = styled(Box)(({ theme }) => ({
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
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
  padding: theme.spacing(2),
  maxHeight: 400,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  },
}));

const AgentCard = styled(Box)<{ agentcolor: string }>(({ theme, agentcolor }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  borderRadius: 16,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.8)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  '&:hover': {
    transform: 'translateX(-4px)',
    background: `linear-gradient(135deg, ${agentcolor}15 0%, ${agentcolor}05 100%)`,
    borderColor: agentcolor,
    boxShadow: `0 4px 20px ${agentcolor}30`,
  },
  '&:last-child': {
    marginBottom: 0,
  },
}));

const StyledAvatar = styled(Avatar)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  width: 56,
  height: 56,
  backgroundColor: bgcolor,
  color: theme.palette.common.white,
  fontSize: 24,
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
  primaryColor = '#3B82F6',
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
    setIsOpen(!isOpen);
  };

  const handleAgentClick = (agent: Agent) => {
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

  return (
    <LauncherContainer
      ref={containerRef}
      sx={{
        ...positionStyles[position],
        ...(isMobile && {
          bottom: 16,
          right: position === 'bottom-right' ? 16 : undefined,
          left: position === 'bottom-left' ? 16 : undefined,
        }),
      }}
    >
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
            {agents.map((agent) => (
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
                      <span style={{ fontSize: '2rem' }}>{agent.avatar}</span>
                    ) : (
                      (() => {
                        const Icon = agent.avatar.icon;
                        return <Icon size={32} style={{ color: agent.avatar.iconColor }} />;
                      })()
                    )}
                  </StyledAvatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {agent.name}
                      </Typography>
                      {!agent.available && (
                        <Chip
                          label="Soon"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          }}
                        />
                      )}
                    </div>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {agent.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: agent.color,
                        fontWeight: 500,
                        mt: 0.5,
                        display: 'inline-block',
                      }}
                    >
                      {agent.specialty}
                    </Typography>
                  </div>
                </AgentCard>
              </Tooltip>
            ))}
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
