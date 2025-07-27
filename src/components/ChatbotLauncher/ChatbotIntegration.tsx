import React, { useState, useCallback, useEffect } from 'react';
import ChatbotLauncher from './ChatbotLauncher';
import { ChatModal } from './ChatModal';
import VoiceModalWithTrial from './VoiceModalWithTrial';
import AgentSelectionModal from './AgentSelectionModal';
import type { Agent } from './types';
import api, { API_BASE_URL } from '../../config/api';

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
  console.log('ChatbotIntegration component loaded!');

  // Auth not needed - chatbot is available for everyone
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Initialize agents on component mount - available for everyone
  useEffect(() => {
    const loadAgents = async () => {
      try {
        console.log('Starting agent loading for public access...');

        // Direct fetch call to bypass any axios issues
        console.log('About to call API with URL:', API_BASE_URL + '/api/repconnect/agents');
        const response = await fetch(`${API_BASE_URL}/api/repconnect/agents`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('Backend response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Backend response data:', data);

        // Extract agents from response
        let backendAgents = [];
        if (data.success && data.data && data.data.agents) {
          backendAgents = data.data.agents;
        } else if (data.agents) {
          backendAgents = data.agents;
        }

        console.log('Found', backendAgents.length, 'agents from backend');

        // Convert backend agents to frontend Agent format
        const convertedAgents = backendAgents.map((agent: any) => {
          // Simple direct mapping from backend format
          const category = getCategoryForAgent(agent.id, agent.agent_category);

          return {
            id: agent.id,
            name: agent.name,
            tagline: agent.tagline,
            avatar: agent.avatar || '🤖',
            description: agent.tagline,
            specialty: agent.medical_specialties?.[0] || agent.tagline,
            color: agent.accent_color || '#3B82F6',
            available: agent.is_active !== false,
            category,
            knowledge_domains: agent.knowledge_domains || [],
            // Just use defaults for other fields we don't need right now
            colorScheme: {
              primary: agent.accent_color || '#3B82F6',
              secondary: '#60A5FA',
              accent: '#DBEAFE',
              gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
              shadowColor: 'rgba(59, 130, 246, 0.3)',
            },
            personality: {
              tone: 'Professional',
              traits: [],
              approachStyle: 'Helpful',
              communicationPreferences: [],
            },
            voiceConfig: {
              voiceId: 'default',
              stability: 0.5,
              similarityBoost: 0.5,
              style: 0.5,
              useSpeakerBoost: true,
            },
            knowledgeDomains: agent.medical_specialties || [],
            conversationStarters: [],
            visualEffects: {
              animation: 'pulse',
              glow: true,
              pulse: true,
              particleEffect: 'sparkle',
            },
          } as Agent;
        });

        console.log(
          'Converted agents:',
          convertedAgents.map((a: Agent) => ({ id: a.id, name: a.name }))
        );
        setAgents(convertedAgents);
      } catch (error: any) {
        console.error('Error loading agents:', error);
        console.error('Error details:', error?.message || 'Unknown error');
        console.error('Error response:', error?.response);
        console.error('Error config:', error?.config);
        // Set empty agents array on error
        setAgents([]);
      } finally {
        console.log('Agent loading completed (success or failure)');
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
      const modalType = mode === 'message' ? 'chat' : 'voice';
      console.log('Setting activeModal to:', modalType);
      setActiveModal(modalType);
      setShowSelectionModal(false);
      console.log('Modal state after update - activeModal will be:', modalType);
    },
    [selectedAgent]
  );

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    // Keep selected agent for potential re-opening
  }, []);

  // Helper function to determine category
  const getCategoryForAgent = (agentId: string, agentCategory?: string): Agent['category'] => {
    // First check if agent has explicit category from backend
    if (agentCategory) {
      const categoryMapping: Record<string, Agent['category']> = {
        elite_closer: 'sales',
        coach: 'coaching',
        specialist: 'general',
        strategist: 'sales',
        voice_rep: 'general',
        procedure_expert: 'aesthetic', // Default procedure experts to aesthetic
      };
      return categoryMapping[agentCategory] || 'general';
    }

    // No need for ID-based mapping since all agents come from backend now
    return 'general';
  };

  // Always show the launcher, even when loading
  // This ensures the launcher doesn't disappear when auth state changes
  console.log('ChatbotIntegration rendering, agents count:', agents.length);
  console.log('Current activeModal state:', activeModal);
  console.log('Selected agent:', selectedAgent?.name);

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

          <VoiceModalWithTrial
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
