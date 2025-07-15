// Agent Backend API Integration
// This service connects to the remote agentbackend API to fetch agent configurations

import { supabase } from '../lib/supabase';

const AGENT_BACKEND_URL =
  process.env.REACT_APP_AGENT_BACKEND_URL || 'https://agentbackend-2932.onrender.com';

class AgentBackendAPI {
  constructor() {
    this.baseURL = AGENT_BACKEND_URL;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Helper method to get current auth headers
  async getAuthHeaders() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        return {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'X-Supabase-Auth': 'true', // Additional header to indicate Supabase auth
        };
      }
    } catch (error) {
      console.error('Failed to get auth session:', error);
    }
    return {
      'Content-Type': 'application/json',
    };
  }

  // Fetch agents from backend with optional category filter
  async fetchAgents(category = null) {
    const cacheKey = `agents_${category || 'all'}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = category
        ? `${this.baseURL}/api/agents?category=${category}`
        : `${this.baseURL}/api/agents`;

      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the response
      this.cache.set(cacheKey, {
        data: data.agents || [],
        timestamp: Date.now(),
      });

      return data.agents || [];
    } catch (error) {
      console.error('Error fetching agents from backend:', error);
      // Return empty array on error to allow fallback to local agents
      return [];
    }
  }

  // Get a specific agent by ID
  async getAgent(agentId) {
    const cacheKey = `agent_${agentId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/agents/${agentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agent: ${response.statusText}`);
      }

      const data = await response.json();
      const agent = data.agent;

      // Cache the response
      this.cache.set(cacheKey, {
        data: agent,
        timestamp: Date.now(),
      });

      return agent;
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      return null;
    }
  }

  // Convert backend agent format to RepConnect format
  convertToRepConnectFormat(backendAgent) {
    // Map the backend agent structure to RepConnect's expected format
    return {
      id: backendAgent.id,
      name: backendAgent.name,
      tagline: backendAgent.tagline,
      avatar: {
        icon: this.getIconFromEmoji(backendAgent.avatar),
        backgroundColor: this.extractBackgroundColor(backendAgent.gradient),
        iconColor: backendAgent.accentColor,
      },
      colorScheme: {
        primary: backendAgent.accentColor,
        secondary: this.extractSecondaryColor(backendAgent.gradient),
        accent: this.extractAccentColor(backendAgent.gradient),
        gradient: backendAgent.gradient,
        shadowColor: backendAgent.shadowColor,
      },
      personality: {
        tone: backendAgent.personality.tone || backendAgent.personality.communication_style,
        traits: backendAgent.personality.traits,
        approachStyle: backendAgent.personality.approach,
        communicationPreferences: backendAgent.personality.specialties,
      },
      voiceConfig: {
        voiceId: backendAgent.voice_config?.voice_id || backendAgent.voiceId,
        stability: backendAgent.voice_config?.settings?.stability || 0.7,
        similarityBoost: backendAgent.voice_config?.settings?.similarityBoost || 0.8,
        style: backendAgent.voice_config?.settings?.style || 0.5,
        speakerBoost: backendAgent.voice_config?.settings?.useSpeakerBoost || true,
      },
      knowledgeDomains: backendAgent.personality.specialties || [],
      conversationStarters: this.generateConversationStarters(backendAgent),
      visualEffects: {
        animation: 'pulse',
        glowEffect: true,
        pulseEffect: true,
        particleEffect: 'sparkle',
      },
      specialCapabilities: Object.keys(backendAgent.capabilities || {})
        .filter((cap) => backendAgent.capabilities[cap])
        .map((cap) => this.formatCapability(cap)),
      // Additional fields for compatibility
      category: this.determineCategory(backendAgent),
      available: backendAgent.active || true,
      description: backendAgent.tagline,
      specialty: backendAgent.personality.specialties?.[0] || backendAgent.role,
    };
  }

  // Helper methods for conversion
  getIconFromEmoji(_emoji) {
    // This would need to map emojis to Lucide icons
    // For now, return a default icon reference
    return 'User';
  }

  extractBackgroundColor(gradient) {
    // Extract the first color from gradient
    const match = gradient.match(/#[0-9a-fA-F]{6}/);
    return match ? match[0] : '#E8D4F8';
  }

  extractSecondaryColor(gradient) {
    // Extract the second color from gradient
    const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
    return matches && matches.length > 1 ? matches[1] : '#A78BFA';
  }

  extractAccentColor(gradient) {
    // Extract the last color from gradient
    const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
    return matches && matches.length > 0 ? matches[matches.length - 1] : '#DDD6FE';
  }

  generateConversationStarters(agent) {
    // Generate conversation starters based on agent role and specialties
    const starters = [];
    if (agent.role.toLowerCase().includes('advisor')) {
      starters.push('How can I help you with your dental concerns today?');
    }
    if (agent.personality.specialties?.includes('Insurance')) {
      starters.push('Do you have questions about insurance coverage?');
    }
    if (agent.personality.specialties?.includes('Complex procedures')) {
      starters.push('Are you considering any specific dental procedures?');
    }
    starters.push('What brings you here today?');
    return starters;
  }

  formatCapability(capability) {
    // Convert capability key to human-readable format
    return capability
      .split(/(?=[A-Z])|_/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  determineCategory(agent) {
    const role = agent.role.toLowerCase();
    const specialties = agent.personality.specialties?.join(' ').toLowerCase() || '';

    if (role.includes('sales') || role.includes('closer')) return 'sales';
    if (role.includes('coach') || role.includes('motivator')) return 'coaching';
    if (specialties.includes('aesthetic') || specialties.includes('botox')) return 'aesthetic';
    if (role.includes('dental') || specialties.includes('dental')) return 'dental';
    return 'general';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const agentBackendAPI = new AgentBackendAPI();

export default agentBackendAPI;

// Export convenience methods
export const { fetchAgents, getAgent, convertToRepConnectFormat, clearCache } = agentBackendAPI;
