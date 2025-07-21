// Server-side Agent Loader
// This module loads agent configurations from the agentbackend API for server use

import fetch from 'node-fetch';

const AGENT_BACKEND_URL = process.env.AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

// Helper function to get auth headers (server-side implementation)
async function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  // For server-side, we need to use service key or pass token from request
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (serviceKey) {
    headers['Authorization'] = `Bearer ${serviceKey}`;
    headers['X-Supabase-Auth'] = 'true';
  }

  return headers;
}

// Cache for agent configurations
const agentCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load agent configuration from backend
export async function loadAgentConfig(agentId) {
  // Check cache first
  const cached = agentCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.config;
  }

  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${AGENT_BACKEND_URL}/api/canvas/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      console.error(`Failed to fetch agent ${agentId}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const agentConfig = data.agent;

    // Convert to server format
    const serverConfig = {
      id: agentConfig.id,
      name: agentConfig.name,
      description: agentConfig.tagline,
      style:
        agentConfig.personality?.communication_style ||
        agentConfig.personality?.tone ||
        'professional',
      expertise: agentConfig.personality?.specialties || [],
      catchphrases: generateCatchphrases(agentConfig),
      voiceId: agentConfig.voice_config?.voice_id || agentConfig.voiceId,
      personality: agentConfig.personality,
    };

    // Cache the configuration
    agentCache.set(agentId, {
      config: serverConfig,
      timestamp: Date.now(),
    });

    return serverConfig;
  } catch (error) {
    console.error(`Error loading agent ${agentId}:`, error);
    return null;
  }
}

// Generate catchphrases based on agent role and personality
function generateCatchphrases(agent) {
  const catchphrases = [];
  const role = agent.role?.toLowerCase() || '';

  if (role.includes('advisor')) {
    catchphrases.push(
      'Let me guide you through this.',
      "I'm here to help you make the best decision.",
      'Your concerns are my priority.'
    );
  }

  if (role.includes('sales') || role.includes('closer')) {
    catchphrases.push(
      "Let's make this happen.",
      'Success is just a decision away.',
      "I don't believe in maybes, only results."
    );
  }

  if (role.includes('coach')) {
    catchphrases.push(
      'Excellence is a habit, not an act.',
      "Let's take your performance to the next level.",
      'Winners focus on winning, losers focus on winners.'
    );
  }

  // Add personality-based catchphrases
  if (agent.personality?.traits?.includes('Confident')) {
    catchphrases.push('Trust the process, trust the results.');
  }

  if (agent.personality?.traits?.includes('Empathetic')) {
    catchphrases.push('I understand your concerns completely.');
  }

  return catchphrases.length > 0
    ? catchphrases
    : [
        'How can I assist you today?',
        "Let's work together on this.",
        'Your success is my mission.',
      ];
}

// Load all agents for initialization
export async function loadAllAgents() {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${AGENT_BACKEND_URL}/api/canvas/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      console.error(`Failed to fetch agents: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const agents = data.agents || [];

    // Cache all agents
    for (const agent of agents) {
      const serverConfig = {
        id: agent.id,
        name: agent.name,
        description: agent.tagline,
        style: agent.personality?.communication_style || agent.personality?.tone || 'professional',
        expertise: agent.personality?.specialties || [],
        catchphrases: generateCatchphrases(agent),
        voiceId: agent.voice_config?.voice_id || agent.voiceId,
        personality: agent.personality,
      };

      agentCache.set(agent.id, {
        config: serverConfig,
        timestamp: Date.now(),
      });
    }

    return agents;
  } catch (error) {
    console.error('Error loading all agents:', error);
    return [];
  }
}

// Clear cache
export function clearAgentCache() {
  agentCache.clear();
}

// Get cached agent or null
export function getCachedAgent(agentId) {
  const cached = agentCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.config;
  }
  return null;
}
