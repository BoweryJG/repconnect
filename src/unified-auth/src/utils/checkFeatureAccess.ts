import { RepXTier } from '../types';
import type { FeatureAccess } from '../types';
import { TIER_FEATURES } from '../constants';

export function checkFeatureAccess(tier: RepXTier, feature: keyof FeatureAccess): boolean {
  const features = TIER_FEATURES[tier];
  if (!features) return false;

  const value = features[feature];

  // Boolean features
  if (typeof value === 'boolean') return value;

  // Numeric features (limits)
  if (typeof value === 'number') {
    return value > 0 || value === -1; // -1 means unlimited
  }

  // Null means unlimited (for email send limit)
  if (value === null) return true;

  return false;
}
