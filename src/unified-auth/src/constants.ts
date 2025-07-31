import { RepXTier } from './types';
import type { FeatureAccess } from './types';

// Backend URL - must be provided by environment variable
export const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

// Feature access by tier
export const TIER_FEATURES: Record<RepXTier, FeatureAccess> = {
  [RepXTier.Rep0]: {
    // Basic features only
    login: true,
    dashboard: true,
    emailAccess: false,
    emailSendLimit: 0,
    phoneAccess: false,
    phoneNumberLimit: 0,
    smsEnabled: false,
    twilioProvisioning: false,
    autoAssignedNumber: false,
    callRecording: false,
    voicemail: false,
    gmailIntegration: false,
    gmailSyncEnabled: false,
    gmailSendFromCRM: false,
    whiteLabel: false,
    customDomain: false,
    customBranding: false,
    unlimitedEverything: false,
    agentTimeLimit: 30, // 30 seconds
  },
  [RepXTier.Rep1]: {
    // Rep1: Email access
    login: true,
    dashboard: true,
    emailAccess: true,
    emailSendLimit: 100, // 100 emails/month
    phoneAccess: false,
    phoneNumberLimit: 0,
    smsEnabled: false,
    twilioProvisioning: false,
    autoAssignedNumber: false,
    callRecording: false,
    voicemail: false,
    gmailIntegration: false,
    gmailSyncEnabled: false,
    gmailSendFromCRM: false,
    whiteLabel: false,
    customDomain: false,
    customBranding: false,
    unlimitedEverything: false,
    agentTimeLimit: 60, // 1 minute
  },
  [RepXTier.Rep2]: {
    // Rep2: Phone access
    login: true,
    dashboard: true,
    emailAccess: true,
    emailSendLimit: 500, // 500 emails/month
    phoneAccess: true,
    phoneNumberLimit: 1,
    smsEnabled: true,
    twilioProvisioning: false,
    autoAssignedNumber: false,
    callRecording: false,
    voicemail: false,
    gmailIntegration: false,
    gmailSyncEnabled: false,
    gmailSendFromCRM: false,
    whiteLabel: false,
    customDomain: false,
    customBranding: false,
    unlimitedEverything: false,
    agentTimeLimit: 300, // 5 minutes
  },
  [RepXTier.Rep3]: {
    // Rep3: Auto-provisioned Twilio
    login: true,
    dashboard: true,
    emailAccess: true,
    emailSendLimit: 2000, // 2000 emails/month
    phoneAccess: true,
    phoneNumberLimit: 3,
    smsEnabled: true,
    twilioProvisioning: true,
    autoAssignedNumber: true,
    callRecording: true,
    voicemail: true,
    gmailIntegration: false,
    gmailSyncEnabled: false,
    gmailSendFromCRM: false,
    whiteLabel: false,
    customDomain: false,
    customBranding: false,
    unlimitedEverything: false,
    agentTimeLimit: 900, // 15 minutes
  },
  [RepXTier.Rep4]: {
    // Rep4: Gmail integration
    login: true,
    dashboard: true,
    emailAccess: true,
    emailSendLimit: null, // Unlimited
    phoneAccess: true,
    phoneNumberLimit: 10,
    smsEnabled: true,
    twilioProvisioning: true,
    autoAssignedNumber: true,
    callRecording: true,
    voicemail: true,
    gmailIntegration: true,
    gmailSyncEnabled: true,
    gmailSendFromCRM: true,
    whiteLabel: false,
    customDomain: false,
    customBranding: false,
    unlimitedEverything: false,
    agentTimeLimit: 1800, // 30 minutes
  },
  [RepXTier.Rep5]: {
    // Rep5: White label & unlimited
    login: true,
    dashboard: true,
    emailAccess: true,
    emailSendLimit: null, // Unlimited
    phoneAccess: true,
    phoneNumberLimit: -1, // Unlimited
    smsEnabled: true,
    twilioProvisioning: true,
    autoAssignedNumber: true,
    callRecording: true,
    voicemail: true,
    gmailIntegration: true,
    gmailSyncEnabled: true,
    gmailSendFromCRM: true,
    whiteLabel: true,
    customDomain: true,
    customBranding: true,
    unlimitedEverything: true,
    agentTimeLimit: -1, // Unlimited
  },
};

// Tier display names
export const TIER_NAMES: Record<RepXTier, string> = {
  [RepXTier.Rep0]: 'RepX0 Free',
  [RepXTier.Rep1]: 'RepX1 Explorer',
  [RepXTier.Rep2]: 'RepX2 Professional',
  [RepXTier.Rep3]: 'RepX3 Business',
  [RepXTier.Rep4]: 'RepX4 Enterprise',
  [RepXTier.Rep5]: 'RepX5 Elite',
};

// Tier pricing
export const TIER_PRICING: Record<RepXTier, number> = {
  [RepXTier.Rep0]: 0,
  [RepXTier.Rep1]: 97,
  [RepXTier.Rep2]: 197,
  [RepXTier.Rep3]: 297,
  [RepXTier.Rep4]: 497,
  [RepXTier.Rep5]: 997,
};

// Cookie domain for cross-app auth
export const COOKIE_DOMAIN = '.repspheres.com';
