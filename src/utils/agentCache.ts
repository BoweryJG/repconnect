import type { Agent } from '../components/ChatbotLauncher/types';

const CACHE_KEY = 'repconnect_agents_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedAgents {
  agents: Agent[];
  timestamp: number;
}

export class AgentCache {
  private static instance: AgentCache;
  private memoryCache: CachedAgents | null = null;

  private constructor() {}

  static getInstance(): AgentCache {
    if (!AgentCache.instance) {
      AgentCache.instance = new AgentCache();
    }
    return AgentCache.instance;
  }

  // Get agents from cache (memory first, then localStorage)
  getAgents(): Agent[] | null {
    // Check memory cache first
    if (this.memoryCache && this.isValid(this.memoryCache.timestamp)) {
      return this.memoryCache.agents;
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedAgents = JSON.parse(cached);
        if (this.isValid(parsedCache.timestamp)) {
          // Update memory cache
          this.memoryCache = parsedCache;
          return parsedCache.agents;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Error reading agents cache:', error);
      localStorage.removeItem(CACHE_KEY);
    }

    return null;
  }

  // Save agents to cache (both memory and localStorage)
  setAgents(agents: Agent[]): void {
    const cacheData: CachedAgents = {
      agents,
      timestamp: Date.now(),
    };

    // Update memory cache
    this.memoryCache = cacheData;

    // Update localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving agents cache:', error);
      // If localStorage is full, clear old data
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearCache();
      }
    }
  }

  // Clear all caches
  clearCache(): void {
    this.memoryCache = null;
    localStorage.removeItem(CACHE_KEY);
  }

  // Check if cache is still valid
  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  // Preload agents in the background
  async preloadAgents(fetchFunction: () => Promise<Agent[]>): Promise<void> {
    try {
      const agents = await fetchFunction();
      this.setAgents(agents);
    } catch (error) {
      console.error('Error preloading agents:', error);
    }
  }
}

// Export singleton instance
export const agentCache = AgentCache.getInstance();
