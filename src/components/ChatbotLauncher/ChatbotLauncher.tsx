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
  Badge,
} from '@mui/material';
import { ChatBubbleOutline, Close, AutoAwesome } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { Agent, ChatbotLauncherProps } from './types';
import { AgentKnowledgeDomains } from './AgentKnowledgeDomains';

// Keyframe animations
const pulse = keyframes`
  0% {
    box-shadow: 
      0 0 0 0 rgba(59, 130, 246, 0.7),
      inset 0 0 0 0 rgba(59, 130, 246, 0.3);
  }
  70% {
    box-shadow: 
      0 0 0 30px rgba(59, 130, 246, 0),
      inset 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 
      0 0 0 0 rgba(59, 130, 246, 0),
      inset 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 
      0 0 30px rgba(59, 130, 246, 1),
      0 0 60px rgba(59, 130, 246, 0.8),
      0 0 90px rgba(59, 130, 246, 0.6),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
    filter: brightness(1.2);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(59, 130, 246, 1),
      0 0 80px rgba(59, 130, 246, 0.9),
      0 0 120px rgba(59, 130, 246, 0.7),
      inset 0 0 30px rgba(255, 255, 255, 0.6);
    filter: brightness(1.3);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.05);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const rotateGradient = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled components
const LauncherContainer = styled(Box)(() => ({
  position: 'fixed',
  zIndex: 1300,
  transition: 'all 0.3s ease',
  pointerEvents: 'none',
  '& > *': {
    pointerEvents: 'auto',
  },
}));

const FloatingOrb = styled(IconButton)<{ glowcolor?: string }>(({ theme, glowcolor }) => ({
  width: 80,
  height: 80,
  position: 'relative',
  background: `linear-gradient(135deg, ${glowcolor || '#3B82F6'} 0%, ${glowcolor ? glowcolor + '80' : '#8B5CF6'} 100%)`,
  color: theme.palette.common.white,
  animation: `${pulse} 2.5s infinite, ${float} 4s ease-in-out infinite`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'visible',
  boxShadow: `
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 40px ${glowcolor || '#3B82F6'}40,
    inset 0 -2px 10px rgba(0, 0, 0, 0.2),
    inset 0 2px 10px rgba(255, 255, 255, 0.3)
  `,
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: -20,
    background: `conic-gradient(from 180deg at 50% 50%, ${glowcolor || '#3B82F6'}00 0deg, ${glowcolor || '#3B82F6'}40 60deg, ${glowcolor || '#3B82F6'}00 120deg)`,
    animation: `${rotateGradient} 3s linear infinite`,
    zIndex: -1,
    filter: 'blur(20px)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: `linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)`,
    backgroundSize: '200% 200%',
    animation: `${shimmer} 3s ease-in-out infinite`,
  },
  '&:hover': {
    animation: `${glow} 1.5s ease-in-out infinite, ${float} 4s ease-in-out infinite`,
    transform: 'scale(1.15) rotate(5deg)',
    boxShadow: `
      0 8px 30px rgba(0, 0, 0, 0.15),
      0 0 60px ${glowcolor || '#3B82F6'}60,
      inset 0 -3px 15px rgba(0, 0, 0, 0.3),
      inset 0 3px 15px rgba(255, 255, 255, 0.4)
    `,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 36,
    zIndex: 1,
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
  },
  [theme.breakpoints.down('sm')]: {
    width: 70,
    height: 70,
    '& .MuiSvgIcon-root': {
      fontSize: 32,
    },
  },
}));

const CarouselContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 100,
  right: 0,
  width: 420,
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: '70vh',
  overflow: 'hidden',
  borderRadius: 28,
  background:
    theme.palette.mode === 'light'
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)'
      : 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
  backdropFilter: 'blur(30px) saturate(180%)',
  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)'}`,
  boxShadow: `
    0 20px 60px -10px rgba(0, 0, 0, 0.3),
    0 10px 30px -5px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)
  `,
  // Better cross-browser support
  '@supports not (backdrop-filter: blur(30px))': {
    background:
      theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.99)' : 'rgba(30, 30, 30, 0.99)',
    boxShadow: `
      0 25px 70px -15px rgba(0, 0, 0, 0.4),
      0 15px 35px -10px rgba(0, 0, 0, 0.3)
    `,
  },
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100vw - 24px)',
    right: '50%',
    transform: 'translateX(50%)',
    bottom: 90,
  },
}));

const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 3),
  borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
  background:
    theme.palette.mode === 'light'
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: '5%',
    height: 1,
    background:
      'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
  },
}));

const AgentCarousel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2.5),
  display: 'flex',
  overflowX: 'auto',
  overflowY: 'hidden',
  gap: theme.spacing(2),
  scrollSnapType: 'x mandatory',
  scrollBehavior: 'smooth',
  minHeight: 220,
  position: 'relative',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    pointerEvents: 'none',
    zIndex: 1,
  },
  '&::before': {
    left: 0,
    background:
      theme.palette.mode === 'light'
        ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, transparent 100%)'
        : 'linear-gradient(90deg, rgba(30, 30, 30, 0.98) 0%, transparent 100%)',
  },
  '&::after': {
    right: 0,
    background:
      theme.palette.mode === 'light'
        ? 'linear-gradient(270deg, rgba(255, 255, 255, 0.98) 0%, transparent 100%)'
        : 'linear-gradient(270deg, rgba(30, 30, 30, 0.98) 0%, transparent 100%)',
  },
  '&::-webkit-scrollbar': {
    height: 8,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.action.hover,
    borderRadius: 4,
    margin: theme.spacing(0, 2),
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 1.5),
    gap: theme.spacing(1.5),
    minHeight: 190,
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
}));

const AgentCard = styled(Box)<{ agentcolor: string }>(({ theme, agentcolor }) => ({
  minWidth: 150,
  width: 150,
  height: 'auto',
  minHeight: 180,
  padding: theme.spacing(2),
  borderRadius: 20,
  cursor: 'pointer',
  position: 'relative',
  overflow: 'visible',
  background:
    theme.palette.mode === 'light'
      ? `linear-gradient(145deg, ${agentcolor}10 0%, ${agentcolor}05 100%)`
      : `linear-gradient(145deg, ${agentcolor}20 0%, ${agentcolor}10 100%)`,
  border: `1px solid ${agentcolor}20`,
  scrollSnapAlign: 'start',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  textAlign: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05)
  `,
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    minWidth: 130,
    width: 130,
    minHeight: 160,
    padding: theme.spacing(1.5),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    padding: 1,
    background: `linear-gradient(135deg, ${agentcolor}40 0%, transparent 100%)`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `
      0 12px 32px ${agentcolor}25,
      0 4px 16px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.2)
    `,
    background:
      theme.palette.mode === 'light'
        ? `linear-gradient(145deg, ${agentcolor}15 0%, ${agentcolor}08 100%)`
        : `linear-gradient(145deg, ${agentcolor}30 0%, ${agentcolor}15 100%)`,
    '&::before': {
      opacity: 1,
    },
  },
  '&:active': {
    transform: 'translateY(-4px) scale(1.01)',
  },
}));

const StyledAvatar = styled(Avatar)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  width: 56,
  height: 56,
  background: `linear-gradient(135deg, ${bgcolor} 0%, ${bgcolor}CC 100%)`,
  color: theme.palette.common.white,
  fontSize: 24,
  marginBottom: theme.spacing(1),
  boxShadow: `
    0 4px 12px ${bgcolor}40,
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1)
  `,
  border: `2px solid ${bgcolor}20`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: -4,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${bgcolor}20 0%, transparent 70%)`,
    zIndex: -1,
  },
  // Mobile optimizations
  [theme.breakpoints.down('sm')]: {
    width: 48,
    height: 48,
    fontSize: 20,
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
        <Badge
          badgeContent={agents.length}
          color="success"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 'bold',
              fontSize: 11,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            },
          }}
        >
          <FloatingOrb
            onClick={handleToggle}
            glowcolor={glowColor}
            aria-label="Open chat assistant"
          >
            <ChatBubbleOutline />
            <AutoAwesome
              sx={{
                position: 'absolute',
                fontSize: 16,
                top: 10,
                right: 10,
                color: 'white',
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
                animation: `${shimmer} 2s ease-in-out infinite`,
              }}
            />
          </FloatingOrb>
        </Badge>
      </Zoom>

      {/* Expanded Carousel */}
      <Fade in={isOpen} unmountOnExit>
        <CarouselContainer elevation={8}>
          <Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 0.5,
                  }}
                >
                  AI Sales Assistants
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {agents.length} specialized agents ready to help
                </Typography>
              </div>
              <IconButton
                onClick={handleToggle}
                size="small"
                sx={{
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                    transform: 'rotate(90deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
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
                      opacity: agent.available ? 1 : 0.7,
                      cursor: agent.available ? 'pointer' : 'not-allowed',
                      filter: agent.available ? 'none' : 'grayscale(30%)',
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
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          lineHeight: 1.3,
                          mb: 0.5,
                          color: 'text.primary',
                        }}
                      >
                        {agent.name}
                      </Typography>
                      {!agent.available && (
                        <Chip
                          label="Coming Soon"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            backgroundColor: `${agent.color}20`,
                            color: agent.color,
                            border: `1px solid ${agent.color}30`,
                          }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: agent.color,
                          fontWeight: 600,
                          mt: 0.5,
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontSize: '0.65rem',
                        }}
                      >
                        {agent.specialty}
                      </Typography>
                      {/* Display knowledge domains in compact view */}
                      {agent.knowledge_domains &&
                        agent.knowledge_domains.length > 0 &&
                        agent.available && (
                          <div style={{ marginTop: 4, width: '100%' }}>
                            <AgentKnowledgeDomains
                              domains={agent.knowledge_domains}
                              compact={true}
                            />
                          </div>
                        )}
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
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              transform: 'scale(1.1) rotate(180deg)',
            },
            '&::before': {
              background:
                'conic-gradient(from 180deg at 50% 50%, #EF444400 0deg, #EF444440 60deg, #EF444400 120deg)',
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
