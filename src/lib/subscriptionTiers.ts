export interface SubscriptionTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limits: {
    callsPerMonth: number;
    contactsPerAccount: number;
    teamMembers: number;
    aiTranscriptions: boolean;
    harveyAccess: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
    prioritySupport: boolean;
  };
  badge: string;
  color: string;
  stripePriceIds?: {
    monthly: string;
    annual: string;
  };
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Starter',
    price: {
      monthly: 0,
      annual: 0,
    },
    features: [
      '50 calls per month',
      '100 contacts',
      'Basic call recording',
      'Standard analytics',
      'Email support',
    ],
    limits: {
      callsPerMonth: 50,
      contactsPerAccount: 100,
      teamMembers: 1,
      aiTranscriptions: false,
      harveyAccess: false,
      advancedAnalytics: false,
      customIntegrations: false,
      prioritySupport: false,
    },
    badge: 'STARTER',
    color: '#64748b',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: {
      monthly: 49,
      annual: 470, // ~20% discount
    },
    features: [
      '500 calls per month',
      '1,000 contacts',
      'AI-powered transcriptions',
      'Harvey AI coach (limited)',
      'Advanced analytics',
      '3 team members',
      'Priority email support',
    ],
    limits: {
      callsPerMonth: 500,
      contactsPerAccount: 1000,
      teamMembers: 3,
      aiTranscriptions: true,
      harveyAccess: true,
      advancedAnalytics: true,
      customIntegrations: false,
      prioritySupport: true,
    },
    badge: 'PRO',
    color: '#4B96DC',
    stripePriceIds: {
      monthly: process.env.REACT_APP_STRIPE_PRO_MONTHLY_PRICE_ID || '',
      annual: process.env.REACT_APP_STRIPE_PRO_ANNUAL_PRICE_ID || '',
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: {
      monthly: 99,
      annual: 950, // ~20% discount
    },
    features: [
      '2,000 calls per month',
      '5,000 contacts',
      'AI-powered transcriptions',
      'Harvey AI coach (unlimited)',
      'Advanced analytics & insights',
      '10 team members',
      'Custom integrations',
      'Priority phone support',
      'Quarterly business reviews',
    ],
    limits: {
      callsPerMonth: 2000,
      contactsPerAccount: 5000,
      teamMembers: 10,
      aiTranscriptions: true,
      harveyAccess: true,
      advancedAnalytics: true,
      customIntegrations: true,
      prioritySupport: true,
    },
    badge: 'GROWTH',
    color: '#00d4ff',
    stripePriceIds: {
      monthly: process.env.REACT_APP_STRIPE_GROWTH_MONTHLY_PRICE_ID || '',
      annual: process.env.REACT_APP_STRIPE_GROWTH_ANNUAL_PRICE_ID || '',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 299,
      annual: 2870, // ~20% discount
    },
    features: [
      'Unlimited calls',
      'Unlimited contacts',
      'AI-powered everything',
      'Harvey AI coach (unlimited + custom training)',
      'Advanced analytics & custom reports',
      'Unlimited team members',
      'Custom integrations & API access',
      'Dedicated account manager',
      '24/7 phone support',
      'Monthly business reviews',
      'Custom AI model training',
      'White-label options',
    ],
    limits: {
      callsPerMonth: -1, // unlimited
      contactsPerAccount: -1, // unlimited
      teamMembers: -1, // unlimited
      aiTranscriptions: true,
      harveyAccess: true,
      advancedAnalytics: true,
      customIntegrations: true,
      prioritySupport: true,
    },
    badge: 'ENTERPRISE',
    color: '#4bd48e',
    stripePriceIds: {
      monthly: process.env.REACT_APP_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
      annual: process.env.REACT_APP_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '',
    },
  },
};

export const getTierByPriceId = (priceId: string): SubscriptionTier | null => {
  for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
    if (tier.stripePriceIds?.monthly === priceId || tier.stripePriceIds?.annual === priceId) {
      return tier;
    }
  }
  return null;
};

export const canAccessFeature = (
  userTier: string,
  feature: keyof SubscriptionTier['limits']
): boolean => {
  const tier = SUBSCRIPTION_TIERS[userTier];
  if (!tier) return false;

  const limit = tier.limits[feature];
  return typeof limit === 'boolean' ? limit : limit > 0;
};

export const getRemainingCalls = (userTier: string, usedCalls: number): number => {
  const tier = SUBSCRIPTION_TIERS[userTier];
  if (!tier) return 0;

  const limit = tier.limits.callsPerMonth;
  if (limit === -1) return -1; // unlimited

  return Math.max(0, limit - usedCalls);
};
