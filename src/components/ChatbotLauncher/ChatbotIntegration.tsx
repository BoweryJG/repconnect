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

  const agents = getAllAgents();

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
            agent={selectedAgent}
          />

          <VoiceModal
            isOpen={activeModal === 'voice'}
            onClose={handleCloseModal}
            agentName={selectedAgent.name}
            agentAvatar={selectedAgent.avatar}
            agentRole={selectedAgent.tagline}
            agentConfig={selectedAgent}
          />
        </>
      )}
    </>
  );
};

export default ChatbotIntegration;