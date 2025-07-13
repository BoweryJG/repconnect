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
  // Role-based mappings
  advisor: User,
  specialist: Sparkles,
  expert: Brain,
  coach: Trophy,
  sales: DollarSign,
  motivator: Zap,
};

// Get icon from emoji or role
function getIcon(emoji: string, role: string): any {
  return iconMap[emoji] || iconMap[role.toLowerCase()] || User;
}

// Load agents from the backend API
export async function loadRemoteAgents(category?: string): Promise<Record<string, AgentConfig>> {
  try {
    const backendAgents = await agentBackendAPI.fetchAgents(category);
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
    const {
      gradient = '',
      accentColor = '#7C3AED',
      shadowColor = 'rgba(124, 58, 237, 0.3)',
    } = backendAgent;

    // Extract colors from gradient
    const colors = gradient.match(/#[0-9a-fA-F]{6}/g) || ['#7C3AED', '#A78BFA', '#DDD6FE'];
    const primaryColor = colors[0] || accentColor;
    const secondaryColor = colors[1] || colors[0] || '#A78BFA';
    const accentColorExtracted = colors[colors.length - 1] || '#DDD6FE';

    return {
      id: backendAgent.id,
      name: backendAgent.name,
      tagline: backendAgent.tagline,
      avatar: {
        icon: getIcon(backendAgent.avatar, backendAgent.role),
        backgroundColor: accentColorExtracted,
        iconColor: primaryColor,
      },
      colorScheme: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColorExtracted,
        gradient: gradient || `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        shadowColor: shadowColor,
      },
      personality: {
        tone:
          backendAgent.personality?.tone ||
          backendAgent.personality?.communication_style ||
          'Professional and friendly',
        traits: backendAgent.personality?.traits || [],
        approachStyle: backendAgent.personality?.approach || 'Consultative',
        communicationPreferences: backendAgent.personality?.specialties || [],
      },
      voiceConfig: {
        voiceId:
          backendAgent.voice_config?.voice_id || backendAgent.voiceId || 'EXAVITQu4vr4xnSDxMaL',
        stability: backendAgent.voice_config?.settings?.stability || 0.7,
        similarityBoost: backendAgent.voice_config?.settings?.similarityBoost || 0.8,
        style: backendAgent.voice_config?.settings?.style || 0.5,
        speakerBoost: backendAgent.voice_config?.settings?.useSpeakerBoost !== false,
      },
      knowledgeDomains: backendAgent.personality?.specialties || [],
      conversationStarters: generateConversationStarters(backendAgent),
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
  const role = agent.role?.toLowerCase() || '';
  if (role.includes('sales')) return 'power-surge';
  if (role.includes('coach')) return 'pulse';
  if (role.includes('specialist')) return 'sparkle';
  return 'gentle-sway';
}

function shouldPulse(agent: any): boolean {
  const role = agent.role?.toLowerCase() || '';
  return role.includes('sales') || role.includes('urgent') || role.includes('coach');
}

function getParticleEffect(agent: any): string {
  const role = agent.role?.toLowerCase() || '';
  if (role.includes('sales')) return 'gold-coins';
  if (role.includes('specialist')) return 'sparkle';
  if (role.includes('coach')) return 'energy-burst';
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
