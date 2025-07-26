// Remote Agent Loader
// This module loads agents from the agentbackend API and converts them to the local format

import agentBackendAPI from '../../../services/agentBackendAPI';
import { AgentConfig } from './agentConfigs';
import {
  User,
  Heart,
  Sparkles,
  Star,
  Brain,
  Zap,
  Network,
  Eye,
  DollarSign,
  Trophy,
  Flower2,
  Sun,
  Gem,
  Crown,
  Smile,
} from 'lucide-react';

// Icon mapping from emoji/role to Lucide icons
const iconMap: Record<string, any> = {
  '👨‍⚕️': User,
  '💊': Heart,
  '✨': Sparkles,
  '⭐': Star,
  '🧠': Brain,
  '⚡': Zap,
  '🌐': Network,
  '👁️': Eye,
  '💵': DollarSign,
  '🏆': Trophy,
  '🌸': Flower2,
  '☀️': Sun,
  '💎': Gem,
  '👑': Crown,
  '😊': Smile,
  '🔥': Zap,
  '📊': Brain,
  '🧘': Heart,
  '🤝': Network,
  '👔': DollarSign,
  '🌟': Star,
  '🦷': Smile,
  // Role-based mappings
  advisor: User,
  specialist: Sparkles,
  expert: Brain,
  coach: Trophy,
  sales: DollarSign,
  motivator: Zap,
  elite_closer: Crown,
};

// Get icon from emoji or role
function getIcon(emoji: string, role: string): any {
  return iconMap[emoji] || iconMap[role.toLowerCase()] || User;
}

// Load agents from the backend API
export async function loadRemoteAgents(category?: string): Promise<Record<string, AgentConfig>> {
  try {
    const backendAgents = await agentBackendAPI.fetchAgents(category as any);
    const agents: Record<string, AgentConfig> = {};

    for (const backendAgent of backendAgents) {
      const converted = convertBackendAgent(backendAgent);
      if (converted) {
        agents[converted.id] = converted;
      }
    }

    return agents;
  } catch (error) {
    console.error('Error loading remote agents:', error);
    return {};
  }
}

// Convert a single backend agent to local format
function convertBackendAgent(backendAgent: any): AgentConfig | null {
  try {
    // Handle osbackend agent format
    const avatar_emoji = backendAgent.avatar_emoji || backendAgent.avatar || '👤';
    const agent_category = backendAgent.agent_category || 'general';

    // Map agent category to color scheme
    const colorSchemes: Record<string, any> = {
      elite_closer: {
        primary: '#DC2626',
        secondary: '#EF4444',
        accent: '#FEE2E2',
      },
      coach: {
        primary: '#3B82F6',
        secondary: '#60A5FA',
        accent: '#DBEAFE',
      },
      specialist: {
        primary: '#10B981',
        secondary: '#34D399',
        accent: '#D1FAE5',
      },
      strategist: {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#EDE9FE',
      },
      voice_rep: {
        primary: '#6366F1',
        secondary: '#818CF8',
        accent: '#E0E7FF',
      },
      procedure_expert: {
        primary: '#7C3AED',
        secondary: '#A78BFA',
        accent: '#DDD6FE',
      },
    };

    const colors = colorSchemes[agent_category] || {
      primary: '#7C3AED',
      secondary: '#A78BFA',
      accent: '#DDD6FE',
    };

    // Extract tagline from backend or create one
    let tagline = backendAgent.tagline;
    if (!tagline && backendAgent.system_prompt) {
      // Extract first sentence after "You are [name]," from system prompt
      const match = backendAgent.system_prompt.match(/You are [^,]+, ([^.]+)\./);
      tagline = match ? match[1] : `${backendAgent.personality_type || agent_category} specialist`;
    }

    return {
      id: backendAgent.id,
      name: backendAgent.name,
      tagline: tagline || `${backendAgent.personality_type || agent_category} specialist`,
      avatar: {
        icon: getIcon(avatar_emoji, agent_category),
        backgroundColor: colors.accent,
        iconColor: colors.primary,
      },
      colorScheme: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        gradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        shadowColor: `rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.3)`,
      },
      personality: {
        tone:
          backendAgent.personality_profile?.tone ||
          backendAgent.communication_style ||
          'Professional and friendly',
        traits: backendAgent.personality_profile?.core_traits || [],
        approachStyle:
          backendAgent.coaching_style?.approach ||
          backendAgent.personality_profile?.approach ||
          'Consultative',
        communicationPreferences: backendAgent.specialties || [],
      },
      voiceConfig: {
        voiceId: backendAgent.voice_id || 'EXAVITQu4vr4xnSDxMaL',
        stability: backendAgent.voice_settings?.stability || 0.7,
        similarityBoost: backendAgent.voice_settings?.similarity_boost || 0.8,
        style: backendAgent.voice_settings?.style || 0.5,
        speakerBoost: backendAgent.voice_settings?.use_speaker_boost !== false,
      },
      knowledgeDomains: backendAgent.specialties || backendAgent.medical_specialties || [],
      conversationStarters:
        backendAgent.conversation_starters || generateConversationStarters(backendAgent),
      visualEffects: {
        animation: getAnimationStyle(backendAgent),
        glowEffect: true,
        pulseEffect: shouldPulse(backendAgent),
        particleEffect: getParticleEffect(backendAgent),
      },
      specialCapabilities: formatCapabilities(backendAgent.capabilities || {}),
    };
  } catch (error) {
    console.error(`Error converting agent ${backendAgent.id}:`, error);
    return null;
  }
}

// Helper functions
function generateConversationStarters(agent: any): string[] {
  const starters: string[] = [];
  const role = agent.role?.toLowerCase() || '';
  const specialties = agent.personality?.specialties || [];

  // Role-based starters
  if (role.includes('advisor')) {
    starters.push('How can I assist you with your concerns today?');
  }
  if (role.includes('sales') || role.includes('closer')) {
    starters.push("Let's talk about how I can help you achieve your goals.");
  }
  if (role.includes('coach')) {
    starters.push('Ready to take your performance to the next level?');
  }

  // Specialty-based starters
  specialties.forEach((specialty: string) => {
    const spec = specialty.toLowerCase();
    if (spec.includes('insurance')) {
      starters.push('Do you have questions about insurance coverage?');
    }
    if (spec.includes('treatment')) {
      starters.push('What treatment options are you considering?');
    }
    if (spec.includes('complex')) {
      starters.push('Are you dealing with a complex situation?');
    }
  });

  // Default starters
  if (starters.length === 0) {
    starters.push(
      'How can I help you today?',
      'What brings you here?',
      'What would you like to discuss?'
    );
  }

  return starters.slice(0, 4); // Limit to 4 starters
}

function getAnimationStyle(agent: any): string {
  const category = agent.agent_category?.toLowerCase() || '';
  const type = agent.personality_type?.toLowerCase() || '';

  if (category === 'elite_closer') return 'power-surge';
  if (category === 'coach') return 'pulse';
  if (category === 'specialist') return 'sparkle';
  if (category === 'procedure_expert') return 'gentle-sway';
  if (type.includes('disrupt')) return 'lightning-strike';
  if (type.includes('strategic')) return 'chess-move';
  return 'gentle-sway';
}

function shouldPulse(agent: any): boolean {
  const category = agent.agent_category?.toLowerCase() || '';
  return category === 'elite_closer' || category === 'coach' || category === 'strategist';
}

function getParticleEffect(agent: any): string {
  const category = agent.agent_category?.toLowerCase() || '';
  const type = agent.personality_type?.toLowerCase() || '';

  if (category === 'elite_closer') return 'gold-coins';
  if (category === 'specialist') return 'sparkle';
  if (category === 'coach') return 'energy-burst';
  if (category === 'procedure_expert') return 'shimmer';
  if (type.includes('network')) return 'connection-nodes';
  if (type.includes('disrupt')) return 'electric-sparks';
  return '';
}

function formatCapabilities(capabilities: Record<string, boolean>): string[] {
  return Object.entries(capabilities)
    .filter(([_, enabled]) => enabled)
    .map(([capability]) => {
      return capability
        .split(/(?=[A-Z])|_/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });
}

// Cache management
let cachedAgents: Record<string, AgentConfig> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedRemoteAgents(
  category?: string
): Promise<Record<string, AgentConfig>> {
  const now = Date.now();

  if (!cachedAgents || now - cacheTimestamp > CACHE_DURATION) {
    cachedAgents = await loadRemoteAgents(category);
    cacheTimestamp = now;
  }

  return cachedAgents;
}

export function clearAgentCache(): void {
  cachedAgents = null;
  cacheTimestamp = 0;
}
