import {
  LucideIcon,
  Sparkles,
  Heart,
  Flower2,
  Sun,
  Gem,
  Smile,
  Crown,
  Star,
  Brain,
} from 'lucide-react';
// Removed local agent imports - all agents loaded from osbackend
import { getCachedRemoteAgents } from './remoteAgentLoader';

export interface AgentPersonality {
  tone: string;
  traits: string[];
  approachStyle: string;
  communicationPreferences: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  tagline: string;
  avatar: {
    icon: LucideIcon;
    backgroundColor: string;
    iconColor: string;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
    shadowColor: string;
  };
  personality: AgentPersonality;
  voiceConfig: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
  };
  knowledgeDomains: string[];
  conversationStarters: string[];
  visualEffects: {
    animation: string;
    glowEffect: boolean;
    pulseEffect: boolean;
    particleEffect?: string;
  };
  specialCapabilities: string[];
}

// Local agent configs as fallback (minimal set for emergency use only)
// All agents should be loaded from osbackend via remoteAgentLoader
export const localAgentConfigs: Record<string, AgentConfig> = {};

// Dynamic agent configs loaded from remote backend
let agentConfigs: Record<string, AgentConfig> = {};

// Initialize agents from remote backend
export async function initializeAgents(categories?: string[]): Promise<void> {
  try {
    // Load agents from remote backend only
    const remoteAgents = await getCachedRemoteAgents(categories?.join(','));

    if (Object.keys(remoteAgents).length > 0) {
      agentConfigs = remoteAgents;
    } else {
      console.warn('No remote agents loaded');
      agentConfigs = {};
    }
  } catch (error) {
    console.error('Failed to load remote agents:', error);
    agentConfigs = {};
  }
}

// Helper function to get agent by ID
export const getAgentConfig = async (agentId: string): Promise<AgentConfig | undefined> => {
  // Ensure agents are initialized
  if (Object.keys(agentConfigs).length === 0) {
    await initializeAgents();
  }
  return agentConfigs[agentId];
};

// Helper function to get all agents
export const getAllAgents = async (): Promise<AgentConfig[]> => {
  // Ensure agents are initialized
  if (Object.keys(agentConfigs).length === 0) {
    await initializeAgents();
  }
  return Object.values(agentConfigs);
};

// Helper function to get agents by category
export const getAgentsByCategory = async (
  category: 'aesthetic' | 'dental' | 'general' | 'sales' | 'coaching'
): Promise<AgentConfig[]> => {
  // Ensure agents are initialized
  if (Object.keys(agentConfigs).length === 0) {
    await initializeAgents();
  }

  // Since all agents come from backend, we don't need a static category map
  // The backend should provide the category information
  return Object.values(agentConfigs).filter((agent) => {
    // This filtering should be handled by the backend category system
    // For now, return all agents and let the UI handle categorization
    return true;
  });
};

// Export default agent - will be loaded from remote
export let defaultAgent: AgentConfig | undefined;

// Function to refresh agents from remote
export async function refreshAgents(): Promise<void> {
  await initializeAgents();
}
