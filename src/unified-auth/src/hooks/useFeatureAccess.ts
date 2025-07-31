import { useMemo } from 'react';
import { useRepXTier } from './useRepXTier';
import type { FeatureAccess, FeatureCheckResult } from '../types';
import { TIER_FEATURES, TIER_NAMES, DEFAULT_BACKEND_URL } from '../constants';
import { RepXTier } from '../types';

interface UseFeatureAccessResult {
  features: FeatureAccess;
  checkFeature: (feature: keyof FeatureAccess) => FeatureCheckResult;
  loading: boolean;
  error: Error | null;
}

export function useFeatureAccess(userId?: string): UseFeatureAccessResult {
  const { tier, loading, error } = useRepXTier(userId);

  const features = useMemo(() => {
    return TIER_FEATURES[tier] || TIER_FEATURES.rep0;
  }, [tier]);

  const checkFeature = (feature: keyof FeatureAccess): FeatureCheckResult => {
    const hasAccess = features[feature];

    if (
      hasAccess === true ||
      hasAccess === -1 ||
      (typeof hasAccess === 'number' && hasAccess > 0)
    ) {
      return { allowed: true };
    }

    // Find the minimum tier that has this feature
    let requiredTier = null;
    for (const [tierKey, tierFeatures] of Object.entries(TIER_FEATURES)) {
      const featureValue = tierFeatures[feature];
      if (
        featureValue === true ||
        featureValue === -1 ||
        (typeof featureValue === 'number' && featureValue > 0)
      ) {
        requiredTier = tierKey as RepXTier;
        break;
      }
    }

    return {
      allowed: false,
      reason: `This feature requires ${requiredTier ? TIER_NAMES[requiredTier as RepXTier] : 'a higher tier'}`,
      requiredTier: requiredTier || undefined,
      upgradeUrl: `${DEFAULT_BACKEND_URL}/upgrade?feature=${feature}&from=${tier}`,
    };
  };

  return {
    features,
    checkFeature,
    loading,
    error,
  };
}
