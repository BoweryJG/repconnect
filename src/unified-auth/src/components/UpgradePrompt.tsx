import React from 'react';
import { RepXTier } from '../types';
import { TIER_NAMES, TIER_PRICING } from '../constants';

interface UpgradePromptProps {
  currentTier: RepXTier;
  requiredTier: RepXTier;
  feature: string;
  onUpgrade?: () => void;
  onCancel?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentTier,
  requiredTier,
  feature,
  onUpgrade,
  onCancel,
}) => {
  const currentTierName = TIER_NAMES[currentTier];
  const requiredTierName = TIER_NAMES[requiredTier];
  const price = TIER_PRICING[requiredTier];

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '400px',
        width: '90%',
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
        Upgrade Required
      </h3>

      <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
        {feature} requires <strong>{requiredTierName}</strong> or higher. You're currently on{' '}
        <strong>{currentTierName}</strong>.
      </p>

      {price > 0 && (
        <p style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#3730a3' }}>
          ${price}/month
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onUpgrade}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#3730a3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Upgrade Now
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};
