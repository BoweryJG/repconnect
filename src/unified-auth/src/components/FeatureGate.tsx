import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import type { FeatureAccess } from '../types';

interface FeatureGateProps {
  feature: keyof FeatureAccess;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onBlocked?: (reason: string, upgradeUrl?: string) => void;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  userId,
  children,
  fallback = null,
  onBlocked,
}) => {
  const { checkFeature, loading } = useFeatureAccess(userId);

  if (loading) {
    return <div>Loading...</div>;
  }

  const result = checkFeature(feature);

  if (!result.allowed) {
    if (onBlocked) {
      onBlocked(result.reason || 'Feature not available', result.upgradeUrl);
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
