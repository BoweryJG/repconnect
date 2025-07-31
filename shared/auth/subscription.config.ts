/**
 * Canvas Header Subscription Configuration
 * Aligned with existing Stripe products
 */

export interface SubscriptionTier {
  name: string;
  displayName: string;
  price: {
    monthly: number;
    annual: number;
  };
  credits: number;
  magicLinks: number;
  features: string[];
  limits: {
    canvasScansPerMonth?: number;
    marketInsightsAccess?: boolean;
    crmContactsMax?: number;
    aiResearchReports?: number;
    exportEnabled?: boolean;
    teamMembers?: number;
  };
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'free',
    displayName: 'Free Trial',
    price: {
      monthly: 0,
      annual: 0,
    },
    credits: 10,
    magicLinks: 0,
    features: [
      '10 Canvas scans to start',
      'Full Canvas features',
      'See what Canvas Header can do',
      'No credit card required',
    ],
    limits: {
      canvasScansPerMonth: 5,
      marketInsightsAccess: false,
      crmContactsMax: 10,
      aiResearchReports: 0,
      exportEnabled: false,
      teamMembers: 1,
    },
  },

  explorer: {
    name: 'explorer',
    displayName: 'Explorer',
    price: {
      monthly: 49,
      annual: 490, // ~2 months free
    },
    credits: 50,
    magicLinks: 5,
    features: [
      '50 AI credits per month',
      '5 Magic Link emails',
      'Basic Market Insights',
      'CRM Lite (100 contacts)',
      'Export to PDF',
      'Email support',
    ],
    limits: {
      canvasScansPerMonth: 50,
      marketInsightsAccess: true,
      crmContactsMax: 100,
      aiResearchReports: 10,
      exportEnabled: true,
      teamMembers: 1,
    },
  },

  professional: {
    name: 'professional',
    displayName: 'Professional',
    price: {
      monthly: 149,
      annual: 1490,
    },
    credits: 200,
    magicLinks: 20,
    features: [
      '200 AI credits per month',
      '20 Magic Link emails',
      'Full Market Insights (350+ procedures)',
      'CRM Pro (1,000 contacts)',
      'Export to PDF/Excel',
      'Priority support',
      'Mobile app access',
      'Basic analytics',
    ],
    limits: {
      canvasScansPerMonth: 200,
      marketInsightsAccess: true,
      crmContactsMax: 1000,
      aiResearchReports: 50,
      exportEnabled: true,
      teamMembers: 2,
    },
  },

  growth: {
    name: 'growth',
    displayName: 'Growth',
    price: {
      monthly: 349,
      annual: 3490,
    },
    credits: 500,
    magicLinks: 50,
    features: [
      '500 AI credits per month',
      '50 Magic Link emails',
      'Everything in Professional',
      'Linguistics AI personalization',
      'Automated follow-ups',
      'Competition tracking',
      'Advanced analytics dashboard',
      'Priority support (2hr)',
      'Team sharing (up to 5)',
      'API access (limited)',
    ],
    limits: {
      canvasScansPerMonth: 500,
      marketInsightsAccess: true,
      crmContactsMax: 5000,
      aiResearchReports: 150,
      exportEnabled: true,
      teamMembers: 5,
    },
  },

  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: {
      monthly: 749,
      annual: 7490,
    },
    credits: 1500,
    magicLinks: 200,
    features: [
      '1,500 AI credits per month',
      '200 Magic Link emails',
      'Everything in Growth',
      'Unlimited CRM contacts',
      'Custom integrations',
      'Dedicated success manager',
      'Advanced AI training',
      'Team sharing (up to 20)',
      'Full API access',
      'HIPAA compliance ready',
    ],
    limits: {
      canvasScansPerMonth: 1500,
      marketInsightsAccess: true,
      crmContactsMax: -1, // unlimited
      aiResearchReports: 500,
      exportEnabled: true,
      teamMembers: 20,
    },
  },

  elite: {
    name: 'elite',
    displayName: 'Elite',
    price: {
      monthly: 1499,
      annual: 14990,
    },
    credits: -1, // unlimited
    magicLinks: -1, // unlimited
    features: [
      'Unlimited AI credits',
      'Unlimited Magic Links',
      'Everything in Enterprise',
      'White-label options',
      'Custom domain',
      'Dedicated infrastructure',
      '24/7 phone support',
      'Custom AI models',
      'Unlimited team members',
      'SLA guarantee',
      'Quarterly business reviews',
    ],
    limits: {
      canvasScansPerMonth: -1,
      marketInsightsAccess: true,
      crmContactsMax: -1,
      aiResearchReports: -1,
      exportEnabled: true,
      teamMembers: -1,
    },
  },
};

// Credit costs for different actions
export const CREDIT_COSTS = {
  canvasScan: 1,
  deepResearchReport: 5,
  aiOutreachCampaign: 3,
  linguisticsScript: 2,
  marketAnalysisExport: 1,
};

// Pay-as-you-go pricing (for when users run out of credits)
export const PAY_AS_YOU_GO = {
  singleCanvasScan: 4.99,
  deepResearchReport: 29,
  aiOutreachCampaign: 19,
  tenCreditPack: 39,
  fiftyCreditPack: 149,
  hundredCreditPack: 249,
};

// Helper functions
export const getSubscriptionTier = (tierName: string): SubscriptionTier => {
  return SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.free;
};

export const canAccessFeature = (
  subscription: { tier?: string } | null,
  feature: keyof SubscriptionTier['limits']
): boolean => {
  const tier = getSubscriptionTier(subscription?.tier || 'free');
  const limit = tier.limits[feature];

  if (limit === undefined || limit === false) return false;
  if (limit === true || limit === -1) return true;

  // For numeric limits, need to check usage
  return true; // Will be implemented with usage tracking
};
