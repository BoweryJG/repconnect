interface ParsedQuery {
  intent: 'sync' | 'filter' | 'prioritize';
  count?: number;
  location?: {
    city?: string;
    state?: string;
    radius?: number;
  };
  services?: string[];
  criteria?: {
    likelihood?: 'high' | 'medium' | 'low';
    recency?: 'recent' | 'week' | 'month';
    value?: 'high-value' | 'standard';
    tags?: string[];
  };
  confidence: number;
}

export class NaturalLanguageProcessor {
  private static readonly NUMBER_WORDS: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    hundred: 100,
    thousand: 1000,
  };

  private static readonly INTENT_KEYWORDS = {
    sync: ['sync', 'queue', 'prepare', 'load', 'add'],
    filter: ['filter', 'find', 'search', 'show', 'get'],
    prioritize: ['prioritize', 'rank', 'sort', 'order'],
  };

  private static readonly SERVICE_KEYWORDS = [
    'fraxel',
    'laser',
    'botox',
    'filler',
    'chemical peel',
    'microneedling',
    'coolsculpting',
    'hydrafacial',
    'ipl',
    'prp',
    'dermaplaning',
    'sculptra',
    'kybella',
    'ultherapy',
    'thermage',
  ];

  private static readonly US_STATES: Record<string, string> = {
    connecticut: 'CT',
    ct: 'CT',
    'new york': 'NY',
    ny: 'NY',
    california: 'CA',
    ca: 'CA',
    texas: 'TX',
    tx: 'TX',
    florida: 'FL',
    fl: 'FL',
    massachusetts: 'MA',
    ma: 'MA',
  };

  static parse(query: string): ParsedQuery {
    const normalized = query.toLowerCase().trim();

    return {
      intent: this.extractIntent(normalized),
      count: this.extractCount(normalized),
      location: this.extractLocation(normalized),
      services: this.extractServices(normalized),
      criteria: this.extractCriteria(normalized),
      confidence: this.calculateConfidence(normalized),
    };
  }

  private static extractIntent(query: string): 'sync' | 'filter' | 'prioritize' {
    for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        return intent as 'sync' | 'filter' | 'prioritize';
      }
    }
    return 'sync'; // Default intent
  }

  private static extractCount(query: string): number | undefined {
    // Check for numeric digits
    const numericMatch = query.match(/\b(\d+)\b/);
    if (numericMatch) {
      return parseInt(numericMatch[1]);
    }

    // Check for word numbers
    for (const [word, value] of Object.entries(this.NUMBER_WORDS)) {
      if (query.includes(word)) {
        return value;
      }
    }

    // Check for "top X" pattern
    const topMatch = query.match(/top\s+(\d+|\w+)/);
    if (topMatch) {
      const countStr = topMatch[1];
      if (isNaN(parseInt(countStr))) {
        return this.NUMBER_WORDS[countStr];
      }
      return parseInt(countStr);
    }

    return undefined;
  }

  private static extractLocation(query: string): ParsedQuery['location'] {
    const location: ParsedQuery['location'] = {};

    // Extract city patterns
    const cityPatterns = [
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2}|\w+)/i,
      /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    ];

    for (const pattern of cityPatterns) {
      const match = query.match(pattern);
      if (match) {
        location.city = match[1];
        if (match[2]) {
          location.state = this.US_STATES[match[2].toLowerCase()] || match[2];
        }
        break;
      }
    }

    // Extract radius
    const radiusMatch = query.match(/within\s+(\d+)\s*(?:miles?|mi)/i);
    if (radiusMatch) {
      location.radius = parseInt(radiusMatch[1]);
    }

    return Object.keys(location).length > 0 ? location : undefined;
  }

  private static extractServices(query: string): string[] {
    const services: string[] = [];

    for (const service of this.SERVICE_KEYWORDS) {
      if (query.includes(service)) {
        services.push(service);
      }
    }

    // Extract custom service patterns
    const serviceMatch = query.match(/interested\s+in\s+([a-z\s]+?)(?:\s+in|\s+near|$)/i);
    if (serviceMatch && !services.includes(serviceMatch[1].trim())) {
      services.push(serviceMatch[1].trim());
    }

    return services;
  }

  private static extractCriteria(query: string): ParsedQuery['criteria'] {
    const criteria: ParsedQuery['criteria'] = {};

    // Extract likelihood
    if (query.includes('most likely') || query.includes('high probability')) {
      criteria.likelihood = 'high';
    } else if (query.includes('possibly') || query.includes('maybe')) {
      criteria.likelihood = 'medium';
    }

    // Extract recency
    if (query.includes('recent') || query.includes('lately')) {
      criteria.recency = 'recent';
    } else if (query.includes('this week')) {
      criteria.recency = 'week';
    } else if (query.includes('this month')) {
      criteria.recency = 'month';
    }

    // Extract value
    if (query.includes('high-value') || query.includes('premium') || query.includes('vip')) {
      criteria.value = 'high-value';
    }

    // Extract tags
    const tagMatch = query.match(/tagged?\s+(?:as|with)?\s*"?([^"]+)"?/i);
    if (tagMatch) {
      criteria.tags = tagMatch[1].split(/[,\s]+/).filter((tag) => tag.length > 0);
    }

    return Object.keys(criteria).length > 0 ? criteria : undefined;
  }

  private static calculateConfidence(query: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for recognized patterns
    if (this.extractCount(query)) confidence += 0.1;
    if (this.extractLocation(query)) confidence += 0.15;
    if (this.extractServices(query).length > 0) confidence += 0.15;
    if (this.extractCriteria(query)) confidence += 0.1;

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  static generateSuggestions(partialQuery: string): string[] {
    const suggestions: string[] = [];
    const normalized = partialQuery.toLowerCase();

    // Intent-based suggestions
    if (normalized.length < 5) {
      suggestions.push('sync my top 50 accounts');
      suggestions.push('filter high-value clients');
      suggestions.push('prioritize recent contacts');
    }

    // Count-based suggestions
    if (normalized.includes('top') && !normalized.match(/\d+/)) {
      suggestions.push(`${normalized} 25 accounts`);
      suggestions.push(`${normalized} 50 accounts`);
      suggestions.push(`${normalized} 100 accounts`);
    }

    // Service-based suggestions
    if (normalized.includes('interested in')) {
      this.SERVICE_KEYWORDS.slice(0, 3).forEach((service) => {
        suggestions.push(`${normalized} ${service}`);
      });
    }

    // Location-based suggestions
    if (normalized.includes('in') && !this.extractLocation(normalized)) {
      suggestions.push(`${normalized} New York, NY`);
      suggestions.push(`${normalized} Los Angeles, CA`);
      suggestions.push(`${normalized} Greenwich, CT`);
    }

    return suggestions.slice(0, 5);
  }
}
