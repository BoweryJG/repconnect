import { NaturalLanguageProcessor } from './NaturalLanguageProcessor';

// Import Contact interface from store
type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  lastCall?: Date;
  callCount: number;
  notes?: string;
  tags?: string[];
  location?: {
    city?: string;
    state?: string;
    coordinates?: [number, number];
  };
  value?: 'high' | 'standard';
  interestScore?: Record<string, number>;
};

interface QueuedContact extends Contact {
  score: number;
  matchReasons: string[];
}

interface SyncQueue {
  id: string;
  query: string;
  contacts: QueuedContact[];
  createdAt: Date;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  progress: number;
}

export class SmartCallQueue {
  private static readonly EARTH_RADIUS_MILES = 3959;
  
  static async createQueue(
    query: string, 
    contacts: Contact[],
    options?: { 
      maxContacts?: number;
      includeReasons?: boolean;
    }
  ): Promise<SyncQueue> {
    const parsed = NaturalLanguageProcessor.parse(query);
    const maxContacts = options?.maxContacts || parsed.count || 50;
    
    // Score and filter contacts
    const scoredContacts = contacts
      .map(contact => this.scoreContact(contact, parsed))
      .filter(scored => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxContacts);

    return {
      id: crypto.randomUUID(),
      query,
      contacts: scoredContacts,
      createdAt: new Date(),
      status: 'pending',
      progress: 0
    };
  }

  private static scoreContact(contact: Contact, query: ReturnType<typeof NaturalLanguageProcessor.parse>): QueuedContact {
    let score = 0;
    const matchReasons: string[] = [];

    // Location scoring
    if (query.location && contact.location) {
      const locationScore = this.calculateLocationScore(contact.location, query.location);
      score += locationScore * 0.3;
      if (locationScore > 0) {
        if (query.location.city && contact.location.city === query.location.city) {
          matchReasons.push(`Located in ${query.location.city}`);
        } else if (query.location.radius) {
          matchReasons.push(`Within ${query.location.radius} miles`);
        }
      }
    }

    // Service interest scoring
    if (query.services && query.services.length > 0 && contact.interestScore) {
      const serviceScore = this.calculateServiceScore(contact.interestScore, query.services);
      score += serviceScore * 0.4;
      if (serviceScore > 0.5) {
        matchReasons.push(`High interest in ${query.services.join(', ')}`);
      }
    }

    // Criteria scoring
    if (query.criteria) {
      const criteriaScore = this.calculateCriteriaScore(contact, query.criteria);
      score += criteriaScore * 0.3;
      
      if (query.criteria.recency && contact.lastCall) {
        const daysSinceCall = this.daysSince(contact.lastCall);
        if (query.criteria.recency === 'recent' && daysSinceCall < 7) {
          matchReasons.push('Recently contacted');
        }
      }
      
      if (query.criteria.value === 'high-value' && contact.value === 'high') {
        matchReasons.push('High-value client');
      }
      
      if (query.criteria.tags && contact.tags) {
        const matchingTags = query.criteria.tags.filter(tag => 
          contact.tags?.includes(tag)
        );
        if (matchingTags.length > 0) {
          matchReasons.push(`Tagged: ${matchingTags.join(', ')}`);
        }
      }
    }

    // Boost for frequent contacts
    if (contact.callCount > 5) {
      score += 0.1;
      matchReasons.push('Frequent contact');
    }

    return {
      ...contact,
      score: Math.min(score, 1.0),
      matchReasons
    };
  }

  private static calculateLocationScore(
    contactLocation: NonNullable<Contact['location']>,
    queryLocation: NonNullable<ReturnType<typeof NaturalLanguageProcessor.parse>['location']>
  ): number {
    // Exact city match
    if (queryLocation.city && contactLocation.city) {
      if (contactLocation.city.toLowerCase() === queryLocation.city.toLowerCase()) {
        return 1.0;
      }
    }

    // State match
    if (queryLocation.state && contactLocation.state) {
      if (contactLocation.state === queryLocation.state) {
        return 0.5;
      }
    }

    // Radius-based matching (would need geocoding API in production)
    if (queryLocation.radius && contactLocation.coordinates && queryLocation.city) {
      // Simplified scoring based on radius
      return 0.3;
    }

    return 0;
  }

  private static calculateServiceScore(
    interestScores: Record<string, number>,
    services: string[]
  ): number {
    if (services.length === 0) return 0;

    const scores = services
      .map(service => interestScores[service] || 0)
      .filter(score => score > 0);

    if (scores.length === 0) return 0;

    // Average of all service scores
    return scores.reduce((sum, score) => sum + score, 0) / services.length;
  }

  private static calculateCriteriaScore(
    contact: Contact,
    criteria: NonNullable<ReturnType<typeof NaturalLanguageProcessor.parse>['criteria']>
  ): number {
    let score = 0;
    let criteriaCount = 0;

    // Recency scoring
    if (criteria.recency && contact.lastCall) {
      criteriaCount++;
      const daysSinceCall = this.daysSince(contact.lastCall);
      
      switch (criteria.recency) {
        case 'recent':
          score += daysSinceCall <= 7 ? 1.0 : daysSinceCall <= 14 ? 0.5 : 0;
          break;
        case 'week':
          score += daysSinceCall <= 7 ? 1.0 : 0;
          break;
        case 'month':
          score += daysSinceCall <= 30 ? 1.0 : 0;
          break;
      }
    }

    // Value scoring
    if (criteria.value) {
      criteriaCount++;
      if (contact.value === 'high' && criteria.value === 'high-value') {
        score += 1.0;
      }
    }

    // Tag matching
    if (criteria.tags && contact.tags) {
      criteriaCount++;
      const matchingTags = criteria.tags.filter(tag => contact.tags?.includes(tag));
      score += matchingTags.length / criteria.tags.length;
    }

    return criteriaCount > 0 ? score / criteriaCount : 0;
  }

  private static daysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  static async syncQueue(
    queue: SyncQueue,
    onProgress?: (progress: number) => void
  ): Promise<SyncQueue> {
    queue.status = 'syncing';
    
    // Simulate progressive sync
    const totalContacts = queue.contacts.length;
    let synced = 0;

    for (let i = 0; i < queue.contacts.length; i++) {
      // In production, this would sync to CRM/dashboard
      await new Promise(resolve => setTimeout(resolve, 50));
      
      synced++;
      queue.progress = (synced / totalContacts) * 100;
      
      if (onProgress) {
        onProgress(queue.progress);
      }
    }

    queue.status = 'completed';
    queue.progress = 100;
    
    return queue;
  }

  static generatePresets(): Array<{ name: string; query: string; icon: string }> {
    return [
      {
        name: 'High-Value Recent',
        query: 'sync top 25 high-value accounts contacted recently',
        icon: '💎'
      },
      {
        name: 'Local Premium',
        query: 'sync premium clients within 25 miles',
        icon: '📍'
      },
      {
        name: 'Service Interest',
        query: 'sync accounts interested in botox and fillers',
        icon: '💉'
      },
      {
        name: 'Monthly Follow-up',
        query: 'sync contacts from this month tagged follow-up',
        icon: '📅'
      },
      {
        name: 'New Prospects',
        query: 'filter accounts with less than 3 calls',
        icon: '🎯'
      }
    ];
  }
}