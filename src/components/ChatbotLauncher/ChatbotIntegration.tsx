import React, { useState, useCallback, useEffect } from 'react';
import SimpleChatbotLauncher from './SimpleChatbotLauncher';
import { ChatModal } from './SimpleChatModal';
import SimpleVoiceModal from './SimpleVoiceModal';
import type { Agent } from './types';
import { API_BASE_URL } from '../../config/api';

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
  // ChatbotIntegration component loaded

  // Auth not needed - chatbot is available for everyone
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Initialize agents on component mount - available for everyone
  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Starting agent loading for public access

        // Direct fetch call to bypass any axios issues
        // Call API to load agents
        const response = await fetch(`${API_BASE_URL}/api/repconnect/agents`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        // Check backend response

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Backend response received

        // Extract agents from response
        let backendAgents = [];
        if (data.success && data.data && data.data.agents) {
          backendAgents = data.data.agents;
        } else if (data.agents) {
          backendAgents = data.agents;
        }

        // Process agents from backend

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

        // Agents converted successfully
        setAgents(convertedAgents);
      } catch (error: any) {
        // Error loading agents - fallback to empty array
        // Set empty agents array on error
        setAgents([]);
      } finally {
        // Agent loading completed
      }
    };

    // Load agents immediately for all users
    loadAgents();
  }, []); // Remove dependency on user and authLoading

  const handleAgentSelect = useCallback((agent: Agent, mode: 'chat' | 'voice') => {
    // Agent selected
    setSelectedAgent(agent);
    setActiveModal(mode);
  }, []);

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
  // Render ChatbotIntegration

  return (
    <>
      <SimpleChatbotLauncher
        agents={agents}
        onAgentSelect={handleAgentSelect}
        position={position}
        primaryColor={primaryColor}
        glowColor={glowColor}
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

          <SimpleVoiceModal
            isOpen={activeModal === 'voice'}
            onClose={handleCloseModal}
            agentName={selectedAgent.name}
            agentAvatar={typeof selectedAgent.avatar === 'string' ? selectedAgent.avatar : '🤖'}
            agentRole={selectedAgent.tagline}
            agentId={selectedAgent.id}
          />
        </>
      )}
    </>
  );
};

export default ChatbotIntegration;
