import { supabase } from '../supabase';

export interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  linkedin?: string;
}

export interface EnrichedLead {
  original: LeadData;
  enriched: {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    companyDomain?: string;
    companySize?: string;
    industry?: string;
    title: string;
    titleLevel?: string;
    linkedin?: string;
    location?: string;
    heatScore: number;
    segment: 'champion' | 'decision-maker' | 'researcher' | 'quick-win' | 'cold';
    engagementHistory?: {
      websiteVisits?: number;
      contentDownloads?: number;
      webinarAttendance?: number;
      emailOpens?: number;
      lastEngagement?: Date;
    };
    scoringFactors: {
      factor: string;
      impact: 'positive' | 'negative';
      weight: number;
    }[];
  };
}

export class EnrichmentEngine {
  private static mockCompanyData = [
    { domain: 'techcorp.com', size: '1000-5000', industry: 'Software' },
    { domain: 'innovate.io', size: '50-200', industry: 'Technology' },
    { domain: 'globalent.com', size: '10000+', industry: 'Enterprise Software' },
    { domain: 'startupxyz.com', size: '10-50', industry: 'SaaS' },
    { domain: 'megacorp.net', size: '5000-10000', industry: 'Financial Services' }
  ];

  private static titleLevels = {
    'ceo': 'C-Suite',
    'cto': 'C-Suite',
    'cfo': 'C-Suite',
    'vp': 'VP',
    'director': 'Director',
    'manager': 'Manager',
    'lead': 'Senior',
    'senior': 'Senior',
    'junior': 'Junior',
    'intern': 'Entry'
  };

  private static firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Jessica'];
  private static lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  private static companies = ['TechCorp', 'Innovate Inc', 'Global Enterprises', 'StartupXYZ', 'MegaCorp'];
  private static titles = ['VP Sales', 'Sales Director', 'Marketing Manager', 'CEO', 'CTO', 'Product Manager', 'BDR', 'Account Executive', 'Solutions Architect', 'Customer Success Manager'];

  static async enrichLeads(leads: LeadData[], uploadId?: string, isPublicMode: boolean = true): Promise<EnrichedLead[]> {
    const enrichedLeads: EnrichedLead[] = [];

    for (const lead of leads) {
      const enriched = isPublicMode 
        ? await this.mockEnrichLead(lead)
        : await this.realEnrichLead(lead);

      enrichedLeads.push(enriched);

      // Store in database if we have an upload ID
      if (uploadId) {
        await this.storeEnrichedLead(uploadId, enriched);
      }
    }

    return enrichedLeads;
  }

  private static async mockEnrichLead(lead: LeadData): Promise<EnrichedLead> {
    // Generate realistic mock data
    const firstName = lead.firstName || this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    const lastName = lead.lastName || this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    const company = lead.company || this.companies[Math.floor(Math.random() * this.companies.length)];
    const title = lead.title || this.titles[Math.floor(Math.random() * this.titles.length)];
    
    const companyDomain = lead.website || `${company.toLowerCase().replace(/\s+/g, '')}.com`;
    const email = lead.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`;
    
    // Determine company info
    const companyInfo = this.mockCompanyData[Math.floor(Math.random() * this.mockCompanyData.length)];
    
    // Calculate heat score based on various factors
    const scoringFactors = [];
    let heatScore = 50; // Base score

    // Title level scoring
    const titleLower = title.toLowerCase();
    const titleLevel = this.getTitleLevel(titleLower);
    
    if (titleLevel === 'C-Suite') {
      heatScore += 30;
      scoringFactors.push({ factor: 'C-Suite Executive', impact: 'positive' as const, weight: 30 });
    } else if (titleLevel === 'VP') {
      heatScore += 20;
      scoringFactors.push({ factor: 'VP Level', impact: 'positive' as const, weight: 20 });
    } else if (titleLevel === 'Director') {
      heatScore += 15;
      scoringFactors.push({ factor: 'Director Level', impact: 'positive' as const, weight: 15 });
    }

    // Company size scoring
    if (companyInfo.size === '1000-5000' || companyInfo.size === '5000-10000') {
      heatScore += 15;
      scoringFactors.push({ factor: 'Enterprise Company', impact: 'positive' as const, weight: 15 });
    }

    // Mock engagement data
    const hasEngagement = Math.random() > 0.5;
    const engagementHistory = hasEngagement ? {
      websiteVisits: Math.floor(Math.random() * 10) + 1,
      contentDownloads: Math.floor(Math.random() * 5),
      webinarAttendance: Math.floor(Math.random() * 3),
      emailOpens: Math.floor(Math.random() * 20) + 5,
      lastEngagement: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    } : undefined;

    if (engagementHistory) {
      const engagementScore = Math.min(20, 
        (engagementHistory.websiteVisits * 2) + 
        (engagementHistory.contentDownloads * 3) + 
        (engagementHistory.webinarAttendance * 5)
      );
      heatScore += engagementScore;
      scoringFactors.push({ 
        factor: `High Engagement (${engagementHistory.websiteVisits} visits, ${engagementHistory.contentDownloads} downloads)`, 
        impact: 'positive' as const, 
        weight: engagementScore 
      });
    }

    // Ensure score is within bounds
    heatScore = Math.min(100, Math.max(0, heatScore));

    // Determine segment
    const segment = this.determineSegment(heatScore, titleLevel, engagementHistory);

    return {
      original: lead,
      enriched: {
        fullName: `${firstName} ${lastName}`,
        email,
        phone: lead.phone || `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        company,
        companyDomain,
        companySize: companyInfo.size,
        industry: companyInfo.industry,
        title,
        titleLevel,
        linkedin: lead.linkedin || `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        location: this.getRandomLocation(),
        heatScore,
        segment,
        engagementHistory,
        scoringFactors
      }
    };
  }

  private static async realEnrichLead(lead: LeadData): Promise<EnrichedLead> {
    // TODO: Implement real enrichment with actual APIs
    // For now, return mock data
    return this.mockEnrichLead(lead);
  }

  private static getTitleLevel(title: string): string {
    const titleLower = title.toLowerCase();
    for (const [keyword, level] of Object.entries(this.titleLevels)) {
      if (titleLower.includes(keyword)) {
        return level;
      }
    }
    return 'Individual Contributor';
  }

  private static determineSegment(
    heatScore: number, 
    titleLevel: string, 
    engagement?: any
  ): EnrichedLead['enriched']['segment'] {
    if (heatScore >= 80 && (titleLevel === 'C-Suite' || titleLevel === 'VP')) {
      return 'champion';
    } else if (heatScore >= 70 && titleLevel === 'Director') {
      return 'decision-maker';
    } else if (engagement && engagement.contentDownloads > 2) {
      return 'researcher';
    } else if (heatScore >= 60) {
      return 'quick-win';
    }
    return 'cold';
  }

  private static getRandomLocation(): string {
    const locations = [
      'San Francisco, CA',
      'New York, NY',
      'Austin, TX',
      'Seattle, WA',
      'Boston, MA',
      'Chicago, IL',
      'Los Angeles, CA',
      'Denver, CO',
      'Atlanta, GA',
      'Miami, FL'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private static async storeEnrichedLead(uploadId: string, enrichedLead: EnrichedLead): Promise<void> {
    try {
      await supabase
        .from('enriched_leads')
        .insert({
          upload_id: uploadId,
          original_data: enrichedLead.original,
          enriched_data: enrichedLead.enriched,
          heat_score: enrichedLead.enriched.heatScore,
          segment: enrichedLead.enriched.segment,
          company_domain: enrichedLead.enriched.companyDomain,
          company_size: enrichedLead.enriched.companySize,
          industry: enrichedLead.enriched.industry
        });
    } catch (error) {
      console.error('Error storing enriched lead:', error);
    }
  }

  static generateSampleLeads(count: number = 50): LeadData[] {
    const leads: LeadData[] = [];
    
    for (let i = 0; i < count; i++) {
      const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
      const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
      const company = this.companies[Math.floor(Math.random() * this.companies.length)];
      const title = this.titles[Math.floor(Math.random() * this.titles.length)];
      
      leads.push({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        company,
        title
      });
    }
    
    return leads;
  }
}