import React from 'react';
import { LucideIcon } from 'lucide-react';
import { CartierScrew } from './CartierScrew';
import { AgentConfig } from './agents/agentConfigs';
import './styles/AgentCard.css';

interface AgentCardProps {
  agent: AgentConfig;
  onClick: (agent: AgentConfig) => void;
  isSelected?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  onClick, 
  isSelected = false 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    onClick(agent);
  };

  const Icon = agent.avatar.icon;

  return (
    <div
      className={`agent-card-wrapper ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
      style={{
        '--agent-primary': agent.colorScheme.primary,
        '--agent-secondary': agent.colorScheme.secondary,
        '--agent-accent': agent.colorScheme.accent,
        '--agent-shadow': agent.colorScheme.shadowColor,
        '--ring-color': isSelected ? agent.colorScheme.primary : 'transparent',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Background gradient effect */}
      <div
        className="agent-card-gradient"
        style={{
          background: agent.colorScheme.gradient,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Main card container */}
      <div
        className="agent-card-container"
        style={{
          background: `
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.05) 100%
            )
          `,
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: isHovered 
            ? `0 20px 40px ${agent.colorScheme.shadowColor}, 0 0 60px ${agent.colorScheme.shadowColor}` 
            : `0 10px 30px ${agent.colorScheme.shadowColor}`,
        }}
      >
        {/* Glassmorphism noise texture */}
        <div
          className="agent-card-noise"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Cartier Screws - positioned at corners */}
        <div className="agent-card-screw top-left" style={{ transform: isHovered ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <CartierScrew rotation={-45} size={12} />
        </div>
        <div className="agent-card-screw top-right" style={{ transform: isHovered ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <CartierScrew rotation={45} size={12} />
        </div>
        <div className="agent-card-screw bottom-left" style={{ transform: isHovered ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <CartierScrew rotation={135} size={12} />
        </div>
        <div className="agent-card-screw bottom-right" style={{ transform: isHovered ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <CartierScrew rotation={-135} size={12} />
        </div>

        {/* Content */}
        <div className="agent-card-content">
          {/* Avatar container */}
          <div
            className="agent-card-avatar"
            style={{
              background: agent.avatar.backgroundColor,
              boxShadow: `0 8px 24px ${agent.colorScheme.shadowColor}`,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {/* Glow effect */}
            {agent.visualEffects.glowEffect && (
              <div
                className="agent-card-glow"
                style={{
                  background: `radial-gradient(circle, ${agent.colorScheme.primary}40 0%, transparent 70%)`,
                }}
              />
            )}

            {/* Icon */}
            <Icon
              size={36}
              style={{
                color: agent.avatar.iconColor,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.3s ease',
                position: 'relative',
                zIndex: 10,
              }}
            />

            {/* Pulse effect */}
            {agent.visualEffects.pulseEffect && isHovered && (
              <div className="agent-card-pulse"
                style={{ background: agent.avatar.backgroundColor }}
              />
            )}
          </div>

          {/* Agent name */}
          <h3
            className="agent-card-name"
            style={{
              textShadow: isHovered 
                ? `0 0 20px ${agent.colorScheme.primary}50` 
                : '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            {agent.name}
          </h3>

          {/* Tagline */}
          <p
            className="agent-card-tagline"
            style={{
              opacity: isHovered ? 1 : 0.8,
            }}
          >
            {agent.tagline}
          </p>

          {/* Hover indicator */}
          <div
            className="agent-card-indicator"
            style={{
              background: agent.colorScheme.gradient,
              width: isHovered ? '64px' : '32px',
              opacity: isHovered ? 1 : 0,
            }}
          />
        </div>

        {/* Special visual effects overlay */}
        {agent.visualEffects.particleEffect && isHovered && (
          <div className="agent-card-effects">
            {agent.visualEffects.particleEffect === 'shimmer' && (
              <div
                className="agent-card-shimmer"
                style={{
                  background: `linear-gradient(45deg, transparent 30%, ${agent.colorScheme.accent}50 50%, transparent 70%)`,
                }}
              />
            )}
            {agent.visualEffects.particleEffect === 'hearts' && (
              <div className="agent-card-particles">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="agent-card-particle animate-float-up"
                    style={{
                      left: `${20 + i * 30}%`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  >
                    ❤️
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCard;