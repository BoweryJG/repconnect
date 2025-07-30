import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleOutline, Close, Message, Phone } from '@mui/icons-material';
import { Agent } from './types';
import './SimpleChatbotLauncher.css';

interface SimpleChatbotLauncherProps {
  agents: Agent[];
  onAgentSelect: (_agent: Agent, _mode: 'chat' | 'voice') => void;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  glowColor?: string;
}

const SimpleChatbotLauncher: React.FC<SimpleChatbotLauncherProps> = ({
  agents = [],
  onAgentSelect,
  position = 'bottom-right',
  glowColor = '#3B82F6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedAgent(null);
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
    if (!isOpen) {
      setSelectedAgent(null);
    }
  };

  const handleAgentClick = (agent: Agent) => {
    if (agent.available) {
      setSelectedAgent(agent);
    }
  };

  const handleModeSelect = (mode: 'chat' | 'voice') => {
    if (selectedAgent) {
      onAgentSelect(selectedAgent, mode);
      setIsOpen(false);
      setSelectedAgent(null);
    }
  };

  const handleBack = () => {
    setSelectedAgent(null);
  };

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
              <h3 className="carousel-title">
                {selectedAgent ? selectedAgent.name : 'AI Sales Assistants'}
              </h3>
              <p className="carousel-subtitle">
                {selectedAgent
                  ? 'Choose how to interact'
                  : `${agents.length} specialized agents ready to help`}
              </p>
            </div>
            <button className="close-button" onClick={handleToggle}>
              <Close />
            </button>
          </div>

          {!selectedAgent ? (
            // Agent List
            <div className="agent-list">
              {agents.length === 0 ? (
                <div className="loading-message">Loading agents...</div>
              ) : (
                agents.map((agent) => (
                  <button
                    key={agent.id}
                    className={`agent-card ${!agent.available ? 'unavailable' : ''}`}
                    onClick={() => handleAgentClick(agent)}
                    disabled={!agent.available}
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
                  </button>
                ))
              )}
            </div>
          ) : (
            // Mode Selection
            <div className="mode-selection">
              <button className="back-button" onClick={handleBack}>
                ← Back to agents
              </button>

              <div className="agent-preview">
                <div className="agent-avatar large">
                  {typeof selectedAgent.avatar === 'string' ? (
                    <span className="avatar-emoji">{selectedAgent.avatar}</span>
                  ) : (
                    <span className="avatar-emoji">🤖</span>
                  )}
                </div>
                <h4>{selectedAgent.name}</h4>
                <p className="agent-tagline">{selectedAgent.tagline || selectedAgent.specialty}</p>
              </div>

              <div className="mode-buttons">
                <button
                  className="mode-button chat-mode"
                  onClick={() => handleModeSelect('chat')}
                  style={
                    { '--agent-color': selectedAgent.color || '#3B82F6' } as React.CSSProperties
                  }
                >
                  <Message />
                  <span>Chat</span>
                  <small>Type your questions</small>
                </button>

                <button
                  className="mode-button voice-mode"
                  onClick={() => handleModeSelect('voice')}
                  style={
                    { '--agent-color': selectedAgent.color || '#3B82F6' } as React.CSSProperties
                  }
                >
                  <Phone />
                  <span>Voice Call</span>
                  <small>Talk naturally</small>
                </button>
              </div>
            </div>
          )}
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

export default SimpleChatbotLauncher;
