import React from 'react';
import { RepXTier } from '../types';
import { TIER_NAMES } from '../constants';

interface TierBadgeProps {
  tier: RepXTier;
  className?: string;
  style?: React.CSSProperties;
}

const tierColors: Record<RepXTier, { bg: string; text: string; border: string }> = {
  [RepXTier.Rep0]: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
  [RepXTier.Rep1]: { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1' },
  [RepXTier.Rep2]: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  [RepXTier.Rep3]: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  [RepXTier.Rep4]: { bg: '#fce7f3', text: '#831843', border: '#ec4899' },
  [RepXTier.Rep5]: { bg: '#fef3c7', text: '#78350f', border: '#f59e0b' },
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '', style = {} }) => {
  const colors = tierColors[tier];
  const name = TIER_NAMES[tier];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      {name}
    </span>
  );
};
