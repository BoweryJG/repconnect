import React, { useState } from 'react';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../../lib/subscriptionTiers';
import { useAuth } from '../../auth/useAuth';
import { createCheckoutSession } from '../../lib/stripe';
import './SubscriptionModal.css';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  currentTier = 'free' 
}) => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
            return;
    }

    setIsLoading(true);
    setSelectedTier(tierId);

    try {
      const sessionUrl = await createCheckoutSession(
        tierId as keyof typeof SUBSCRIPTION_TIERS,
        billingCycle,
        user.id
      );

      if (sessionUrl) {
        window.location.href = sessionUrl;
      }
    } catch (error) {
          } finally {
      setIsLoading(false);
      setSelectedTier(null);
    }
  };

  if (!isOpen) return null;

  const tiers = Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free');
  const annualSavings = billingCycle === 'annual' ? 0.2 : 0; // 20% discount

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="close-btn" onClick={onClose} />

        {/* Header */}
        <div className="subscription-header">
          <h2 className="subscription-title">Choose Your Plan</h2>
          <p className="subscription-subtitle">
            Unlock advanced features and scale your sales operations
          </p>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button
              className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`billing-option ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              <span className="save-badge">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="tiers-grid">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === currentTier;
            const price = billingCycle === 'monthly' 
              ? tier.price.monthly 
              : Math.round(tier.price.annual / 12);
            
            return (
              <div 
                key={tier.id} 
                className={`tier-card ${isCurrentTier ? 'current' : ''} ${tier.id === 'growth' ? 'popular' : ''}`}
                style={{ '--tier-color': tier.color } as React.CSSProperties}
              >
                {tier.id === 'growth' && (
                  <div className="popular-badge">MOST POPULAR</div>
                )}

                <div className="tier-header">
                  <h3 className="tier-name">{tier.name}</h3>
                  <div className="tier-price">
                    <span className="price-currency">$</span>
                    <span className="price-amount">{price}</span>
                    <span className="price-period">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="annual-total">
                      ${tier.price.annual} billed annually
                    </div>
                  )}
                </div>

                <div className="tier-features">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <svg className="feature-icon" width="16" height="16" viewBox="0 0 24 24">
                        <path 
                          fill="currentColor" 
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                        />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`subscribe-btn ${isCurrentTier ? 'current' : ''}`}
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isCurrentTier || isLoading}
                >
                  {isLoading && selectedTier === tier.id ? (
                    <span className="loading-spinner" />
                  ) : isCurrentTier ? (
                    'Current Plan'
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="subscription-footer">
          <p className="footer-text">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="footer-security">
            <span className="security-icon">🔒</span>
            Secured by Stripe. Your payment info is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};