import React, { useState, useCallback, useEffect } from 'react';
import ChatbotLauncher from './ChatbotLauncher';
import { ChatModal } from './ChatModal';
import VoiceModalWebRTC from './VoiceModalWebRTC';
import AgentSelectionModal from './AgentSelectionModal';
import { getAllAgents, initializeAgents } from './agents/agentConfigs';
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize agents on component mount
  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      try {
        // Initialize agents from remote backend
        await initializeAgents(['sales', 'coaching']);
        
        // Get all agents
        const agentConfigs = await getAllAgents();
        
        // Convert to Agent format
        const convertedAgents = agentConfigs.map((config) => ({
          ...config,
          category: getCategoryForAgent(config.id),
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
        
        setAgents(convertedAgents);
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

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

  // Helper function to determine category
  const getCategoryForAgent = (agentId: string): Agent['category'] => {
    const categoryMap: Record<string, Agent['category']> = {
      botox: 'aesthetic',
      fillers: 'aesthetic',
      skincare: 'aesthetic',
      laser: 'aesthetic',
      bodycontouring: 'aesthetic',
      implants: 'dental',
      orthodontics: 'dental',
      cosmetic: 'dental',
      harvey: 'general',
      victor: 'sales',
      maxwell: 'sales',
      diana: 'sales',
      marcus: 'sales',
      sophia: 'sales',
    };
    
    return categoryMap[agentId] || 'general';
  };

  // Show loading state
  if (isLoading) {
    return null; // Or a loading spinner
  }

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

          <VoiceModalWebRTC
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
