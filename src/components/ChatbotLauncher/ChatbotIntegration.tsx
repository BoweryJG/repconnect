import React, { useState, useCallback } from 'react';
import ChatbotLauncher from './ChatbotLauncher';
import { ChatModal } from './ChatModal';
import VoiceModal from './VoiceModal';
import AgentSelectionModal from './AgentSelectionModal';
import { getAllAgents } from './agents/agentConfigs';
import type { Agent } from './types';

interface ChatbotIntegrationProps {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  glowColor?: string;
}

type ModalType = 'chat' | 'voice' | null;

export const ChatbotIntegration: React.FC<ChatbotIntegrationProps> = ({
  position = 'bottom-right',
  primaryColor,
  glowColor = '#3B82F6',
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const handleAgentSelect = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setShowSelectionModal(true);
  }, []);

  const handleModeSelect = useCallback((mode: 'message' | 'converse') => {
    setActiveModal(mode === 'message' ? 'chat' : 'voice');
    setShowSelectionModal(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    // Keep selected agent for potential re-opening
  }, []);

  // Convert AgentConfig to Agent format
  const categoryMap: Record<string, 'aesthetic' | 'dental' | 'general'> = {
    botox: 'aesthetic',
    fillers: 'aesthetic',
    skincare: 'aesthetic',
    laser: 'aesthetic',
    bodycontouring: 'aesthetic',
    implants: 'dental',
    orthodontics: 'dental',
    cosmetic: 'dental',
    harvey: 'general',
  };

  const agents: Agent[] = getAllAgents().map((config) => ({
    ...config,
    category: categoryMap[config.id] || 'general',
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

  return (
    <>
      <ChatbotLauncher
        agents={agents}
        onAgentSelect={handleAgentSelect}
        position={position}
        primaryColor={primaryColor}
        glowColor={glowColor}
      />

      <AgentSelectionModal
        open={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        agent={selectedAgent}
        onSelectMode={handleModeSelect}
      />

      {selectedAgent && (
        <>
          <ChatModal
            isOpen={activeModal === 'chat'}
            onClose={handleCloseModal}
            agentName={selectedAgent.name}
            agentAvatar={typeof selectedAgent.avatar === 'string' ? selectedAgent.avatar : '🤖'}
            agentRole={selectedAgent.tagline}
          />

          <VoiceModal
            isOpen={activeModal === 'voice'}
            onClose={handleCloseModal}
            agentName={selectedAgent.name}
            agentAvatar={typeof selectedAgent.avatar === 'string' ? selectedAgent.avatar : '🤖'}
            agentRole={selectedAgent.tagline}
          />
        </>
      )}
    </>
  );
};

export default ChatbotIntegration;
