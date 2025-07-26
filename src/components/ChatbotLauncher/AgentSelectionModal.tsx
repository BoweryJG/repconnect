import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  alpha,
  Box,
} from '@mui/material';
import { Close, Chat, Mic } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import type { Agent } from './types';
import { AgentKnowledgeDomains } from './AgentKnowledgeDomains';

interface AgentSelectionModalProps {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
  onSelectMode: (_mode: 'message' | 'converse') => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: alpha('#000000', 0.8),
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: theme.shape.borderRadius * 3,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    overflow: 'visible',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2, 4),
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: alpha('#ffffff', 0.05),
  color: '#ffffff',
  '&:hover': {
    backgroundColor: alpha('#ffffff', 0.1),
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    padding: 1,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
  },
}));

const MessageButton = styled(StyledButton)(({ theme: _theme }) => ({
  background: `linear-gradient(135deg, ${alpha('#3B82F6', 0.2)} 0%, ${alpha('#8B5CF6', 0.2)} 100%)`,
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha('#3B82F6', 0.3)} 0%, ${alpha('#8B5CF6', 0.3)} 100%)`,
  },
}));

const ConverseButton = styled(StyledButton)(({ theme: _theme }) => ({
  background: `linear-gradient(135deg, ${alpha('#10B981', 0.2)} 0%, ${alpha('#34D399', 0.2)} 100%)`,
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha('#10B981', 0.3)} 0%, ${alpha('#34D399', 0.3)} 100%)`,
  },
}));

export const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({
  open,
  onClose,
  agent,
  onSelectMode,
}) => {
  if (!agent) return null;

  const handleSelectMode = (mode: 'message' | 'converse') => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onExited: () => {
          // Clean up after close animation
        },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: -16,
            top: -16,
            color: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: agent.colorScheme.gradient,
            boxShadow: `0 0 40px ${alpha(agent.colorScheme.primary, 0.5)}`,
          }}
        >
          {typeof agent.avatar === 'string' ? (
            <Avatar
              src={agent.avatar}
              alt={agent.name}
              sx={{
                width: 72,
                height: 72,
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          ) : agent.avatar && typeof agent.avatar === 'object' ? (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: agent.avatar.backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {React.createElement(agent.avatar.icon, {
                size: 32,
                color: agent.avatar.iconColor,
              })}
            </div>
          ) : (
            <div style={{ color: 'white', fontSize: 32 }}>{'🤖'}</div>
          )}
        </div>

        <Typography variant="h5" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
          {agent.name}
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
          {agent.tagline}
        </Typography>

        {/* Display knowledge domains */}
        {agent.knowledge_domains && agent.knowledge_domains.length > 0 && (
          <Box sx={{ mb: 3, px: 2 }}>
            <AgentKnowledgeDomains domains={agent.knowledge_domains} />
          </Box>
        )}

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Tooltip title="Ask anything. Your AI will reply instantly." arrow>
            <MessageButton
              onClick={() => handleSelectMode('message')}
              startIcon={<Chat />}
              size="large"
            >
              Message
            </MessageButton>
          </Tooltip>

          <Tooltip title="Start a real-time voice session with this agent." arrow>
            <ConverseButton
              onClick={() => handleSelectMode('converse')}
              startIcon={<Mic />}
              size="large"
            >
              Converse
            </ConverseButton>
          </Tooltip>
        </div>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 3,
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic',
          }}
        >
          Choose your preferred communication method
        </Typography>
      </DialogContent>
    </StyledDialog>
  );
};

export default AgentSelectionModal;
