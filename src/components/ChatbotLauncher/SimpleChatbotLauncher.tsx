import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatBubbleOutline, Close, Message, Phone, Lock } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { Agent } from './types';
import { useAuth } from '../../auth/useAuth';
import { useRepXTier, checkFeatureAccess } from '../../unified-auth';
import './SimpleChatbotLauncher.css';

interface SimpleChatbotLauncherProps {
  agents: Agent[];
  onAgentSelect: (_agent: Agent, _mode: 'chat' | 'voice') => void;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  glowColor?: string;
}

interface AgentCardProps {
  agent: Agent;
  hasVoiceAccess: boolean;
  onSelect: (_agent: Agent, _mode: 'chat' | 'voice') => void;
}

// Memoized agent card to prevent re-renders
const AgentCard = React.memo<AgentCardProps>(({ agent, hasVoiceAccess, onSelect }) => {
  return (
    <div
      className={`agent-card ${!agent.available ? 'unavailable' : ''}`}
      style={{ '--agent-color': agent.color || '#3B82F6' } as React.CSSProperties}
    >
      <div className="agent-avatar">
        {typeof agent.avatar === 'string' ? (
          <span className="avatar-emoji">{agent.avatar}</span>
        ) : (
          <span className="avatar-emoji">🤖</span>
        )}
      </div>
      <div className="agent-info">
        <h4 className="agent-name">{agent.name}</h4>
        {!agent.available && <span className="coming-soon-chip">Coming Soon</span>}
        <span className="agent-specialty">{agent.specialty}</span>
      </div>
      {agent.available && (
        <div className="agent-actions">
          <IconButton
            size="small"
            onClick={() => onSelect(agent, 'chat')}
            title="Chat with agent"
            className="action-button chat-action"
          >
            <Message sx={{ fontSize: 18 }} />
          </IconButton>
          {hasVoiceAccess ? (
            <IconButton
              size="small"
              onClick={() => onSelect(agent, 'voice')}
              title="Call agent"
              className="action-button voice-action"
            >
              <Phone sx={{ fontSize: 18 }} />
            </IconButton>
          ) : (
            <Tooltip title="Voice calls available with Rep² subscription" placement="top">
              <span>
                <IconButton size="small" disabled className="action-button voice-action disabled">
                  <Lock sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
});

AgentCard.displayName = 'AgentCard';

const SimpleChatbotLauncher: React.FC<SimpleChatbotLauncherProps> = ({
  agents = [],
  onAgentSelect,
  position = 'bottom-right',
  glowColor = '#3B82F6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { tier } = useRepXTier(user?.id);

  // Check if user has voice access (Rep2+)
  const hasVoiceAccess = checkFeatureAccess(tier, 'phoneAccess');

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

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleAgentSelect = useCallback(
    (agent: Agent, mode: 'chat' | 'voice') => {
      if (agent.available) {
        // Check voice access for voice mode
        if (mode === 'voice' && !hasVoiceAccess) {
          // For now, just prevent selection - we'll add visual feedback in Phase 3.3
          return;
        }
        onAgentSelect(agent, mode);
        setIsOpen(false);
      }
    },
    [hasVoiceAccess, onAgentSelect]
  );

  const positionClass = position === 'bottom-right' ? 'launcher-right' : 'launcher-left';

  return (
    <div ref={containerRef} className={`chatbot-launcher-container ${positionClass}`}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="chatbot-launcher-button"
          onClick={handleToggle}
          style={{ '--glow-color': glowColor } as React.CSSProperties}
          aria-label="Open chat assistant"
        >
          <ChatBubbleOutline />
          {agents.length > 0 && <span className="agent-count-badge">{agents.length}</span>}
        </button>
      )}

      {/* Agent Carousel or Mode Selection */}
      {isOpen && (
        <div className="chatbot-carousel">
          <div className="carousel-header">
            <div>
              <h3 className="carousel-title">AI Sales Assistants</h3>
              <p className="carousel-subtitle">{agents.length} specialized agents ready to help</p>
            </div>
            <button className="close-button" onClick={handleToggle}>
              <Close />
            </button>
          </div>

          {/* Agent List */}
          <div className="agent-list">
            {agents.length === 0 ? (
              <div className="loading-message">Loading agents...</div>
            ) : (
              agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  hasVoiceAccess={hasVoiceAccess}
                  onSelect={handleAgentSelect}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Close Button when expanded */}
      {isOpen && (
        <button
          className="chatbot-launcher-button close-state"
          onClick={handleToggle}
          aria-label="Close chat assistant"
        >
          <Close />
        </button>
      )}
    </div>
  );
};

export default React.memo(SimpleChatbotLauncher);
