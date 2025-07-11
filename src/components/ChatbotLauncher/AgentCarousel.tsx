import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AgentConfig } from './agents/agentConfigs';
import { Agent } from './types';

interface AgentCarouselProps {
  agents: Agent[];
  onAgentSelect: (agent: Agent) => void;
  selectedAgentId?: string;
}

const AgentCarousel: React.FC<AgentCarouselProps> = ({
  agents,
  onAgentSelect,
  selectedAgentId
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    skipSnaps: false,
    dragFree: false,
    // Enable momentum scrolling
    duration: 20,
    // Responsive settings
    breakpoints: {
      '(min-width: 768px)': {
        // Desktop: Show multiple cards
        slidesToScroll: 1,
      }
    }
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleAgentClick = (agent: Agent, index: number) => {
    onAgentSelect(agent);
    scrollTo(index);
  };

  const renderAgentIcon = (avatar: string | React.ReactElement) => {
    if (typeof avatar === 'string') {
      return (
        <div className="agent-avatar-emoji">
          {avatar}
        </div>
      );
    }
    return avatar;
  };

  return (
    <div className="agent-carousel-container">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className={`embla__slide ${selectedAgentId === agent.id ? 'selected' : ''}`}
            >
              <div
                className={`agent-card ${!agent.available ? 'unavailable' : ''}`}
                onClick={() => agent.available && handleAgentClick(agent, index)}
                style={{
                  '--agent-color': agent.color,
                  cursor: agent.available ? 'pointer' : 'not-allowed'
                } as React.CSSProperties}
              >
                <div className="agent-card-inner">
                  <div className="agent-avatar">
                    {renderAgentIcon(agent.avatar)}
                  </div>
                  <div className="agent-info">
                    <h3 className="agent-name">{agent.name}</h3>
                    <p className="agent-specialty">{agent.specialty}</p>
                    <p className="agent-description">{agent.description}</p>
                  </div>
                  {!agent.available && (
                    <div className="agent-unavailable-overlay">
                      <span>Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicators for mobile */}
      <div className="embla__dots">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`embla__dot ${index === selectedIndex ? 'is-selected' : ''}`}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <style>{`
        .agent-carousel-container {
          width: 100%;
          position: relative;
        }

        .embla {
          overflow: hidden;
          width: 100%;
        }

        .embla__container {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
        }

        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
          position: relative;
        }

        /* Desktop: Show multiple cards */
        @media (min-width: 768px) {
          .embla__slide {
            flex: 0 0 calc(33.333% - 0.666rem);
          }
        }

        @media (min-width: 1024px) {
          .embla__slide {
            flex: 0 0 calc(25% - 0.75rem);
          }
        }

        .agent-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .agent-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: var(--agent-color);
        }

        .agent-card.unavailable {
          opacity: 0.7;
        }

        .embla__slide.selected .agent-card {
          border-color: var(--agent-color);
          box-shadow: 0 0 0 4px rgba(var(--agent-color-rgb), 0.1);
        }

        .agent-card-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: 100%;
        }

        .agent-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--agent-color) 0%, var(--agent-color) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          position: relative;
          overflow: hidden;
        }

        .agent-avatar::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.5), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .agent-card:hover .agent-avatar::before {
          transform: translateX(100%);
        }

        .agent-avatar-emoji {
          font-size: 2.5rem;
          filter: grayscale(0) contrast(1.1);
        }

        .agent-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .agent-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .agent-specialty {
          font-size: 0.875rem;
          color: var(--agent-color);
          font-weight: 500;
          margin: 0;
        }

        .agent-description {
          font-size: 0.875rem;
          color: #666;
          line-height: 1.4;
          margin: 0;
        }

        .agent-unavailable-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
        }

        .agent-unavailable-overlay span {
          background: #666;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Scroll indicators */
        .embla__dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 0;
        }

        @media (min-width: 768px) {
          .embla__dots {
            display: none;
          }
        }

        .embla__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #ddd;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .embla__dot:hover {
          background: #999;
        }

        .embla__dot.is-selected {
          width: 24px;
          border-radius: 4px;
          background: var(--agent-color, #7C3AED);
        }

        /* Touch interaction styles */
        @media (hover: none) {
          .agent-card:active {
            transform: scale(0.98);
          }
        }

        /* Smooth scroll behavior */
        .embla__container {
          backface-visibility: hidden;
          touch-action: pan-y pinch-zoom;
        }

        /* Momentum scrolling for iOS */
        .embla {
          -webkit-overflow-scrolling: touch;
        }

        /* Performance optimizations */
        .agent-card {
          will-change: transform;
        }

        .embla__slide {
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </div>
  );
};

export default AgentCarousel;