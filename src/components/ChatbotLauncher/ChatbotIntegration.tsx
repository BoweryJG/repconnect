import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import SimpleChatbotLauncher from './SimpleChatbotLauncher';
import type { Agent } from './types';
import { API_BASE_URL } from '../../config/api';
import { CircularProgress } from '@mui/material';
import { agentCache } from '../../utils/agentCache';

// Lazy load modals for better performance
const ChatModal = lazy(() =>
  import('./SimpleChatModal').then((module) => ({ default: module.ChatModal }))
);
const SimpleVoiceModal = lazy(() => import('./SimpleVoiceModal'));

interface ChatbotIntegrationProps {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  glowColor?: string;
}

type ModalType = 'chat' | 'voice' | null;

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

// Helper function to process agents data from API
const processAgentsData = (data: any): Agent[] => {
  let backendAgents = [];
  if (data.success && data.data && data.data.agents) {
    backendAgents = data.data.agents;
  } else if (data.agents) {
    backendAgents = data.agents;
  }

  return backendAgents.map((agent: any) => {
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
};

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

        // Check cache first
        const cachedAgents = agentCache.getAgents();
        if (cachedAgents) {
          setAgents(cachedAgents);
          // Still fetch in background to update cache
          agentCache.preloadAgents(async () => {
            const response = await fetch(`${API_BASE_URL}/api/repconnect/agents`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return processAgentsData(data);
          });
          return;
        }

        // No cache, fetch from API
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

        // Process and cache agents
        const convertedAgents = processAgentsData(data);
        agentCache.setAgents(convertedAgents);

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
        <Suspense
          fallback={
            <div
              style={{
                position: 'fixed',
                bottom: position === 'bottom-right' ? '100px' : '100px',
                right: position === 'bottom-right' ? '20px' : 'auto',
                left: position === 'bottom-left' ? '20px' : 'auto',
                zIndex: 1000,
              }}
            >
              <CircularProgress size={40} />
            </div>
          }
        >
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
        </Suspense>
      )}
    </>
  );
};

export default ChatbotIntegration;
