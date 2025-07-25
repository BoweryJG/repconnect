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
  // Auth not needed - chatbot is available for everyone
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Initialize agents on component mount - available for everyone
  useEffect(() => {
    const loadAgents = async () => {
      try {
        console.log('Starting agent loading...');

        // Initialize agents from remote backend (available for all users)
        await initializeAgents(['sales', 'coaching']);
        console.log('Agent initialization complete');

        // Get all agents
        const agentConfigs = await getAllAgents();
        console.log('Got agent configs:', agentConfigs.length, 'agents');

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

        console.log(
          'Converted agents:',
          convertedAgents.map((a) => ({ id: a.id, name: a.name }))
        );
        setAgents(convertedAgents);
      } catch (error: any) {
        console.error('Error loading agents:', error);
        console.error('Error details:', error?.message || 'Unknown error');
      }
    };

    // Load agents immediately for all users
    loadAgents();
  }, []); // Remove dependency on user and authLoading

  const handleAgentSelect = useCallback((agent: Agent) => {
    console.log('Agent selected:', agent.name, agent.id);
    setSelectedAgent(agent);
    setShowSelectionModal(true);
  }, []);

  const handleModeSelect = useCallback(
    (mode: 'message' | 'converse') => {
      console.log('Mode selected:', mode, 'for agent:', selectedAgent?.name);
      setActiveModal(mode === 'message' ? 'chat' : 'voice');
      setShowSelectionModal(false);
    },
    [selectedAgent]
  );

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

  // Always show the launcher, even when loading
  // This ensures the launcher doesn't disappear when auth state changes
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
            agentId={selectedAgent.id}
          />

          <VoiceModalWebRTC
            isOpen={activeModal === 'voice'}
            onClose={handleCloseModal}
            agentName={selectedAgent.name}
            agentAvatar={typeof selectedAgent.avatar === 'string' ? selectedAgent.avatar : '🤖'}
            agentRole={selectedAgent.tagline}
            agentId={selectedAgent.id}
            voiceConfig={selectedAgent.voiceConfig}
          />
        </>
      )}
    </>
  );
};

export default ChatbotIntegration;
