import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { subscriptionService, type UnifiedSubscription } from '../services/subscriptionService';

interface UnifiedUsage {
  calls: number;
  emails: number;
  canvas_scans: number;
  credits_used: number;
  lastResetDate: string;
}

export const useUnifiedSubscription = () => {
  const { user } = useAuth();
  const [repxPlans, setRepxPlans] = useState<Record<string, UnifiedSubscription> | null>(null);
  const [usage, setUsage] = useState<UnifiedUsage | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current subscription from user data
  const currentSubscription = user?.subscription || {
    tier: 'free',
    status: 'inactive',
    credits: 10,
    creditsUsed: 0,
  };

  // Fetch RepX plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plans = await subscriptionService.getRepXPlans();
        setRepxPlans(plans);
      } catch (error) {
        console.error('Failed to fetch RepX plans:', error);
      }
    };

    fetchPlans();
  }, []);

  // Fetch usage data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        // This would ideally come from osbackend usage tracking
        // For now, use local Canvas usage data
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get Canvas-specific usage (credits, scans)
        const canvasUsage = {
          calls: 0, // Would come from RepX integration
          emails: 0, // Would come from RepX integration
          canvas_scans: currentSubscription.creditsUsed || 0,
          credits_used: currentSubscription.creditsUsed || 0,
          lastResetDate: startOfMonth.toISOString(),
        };

        setUsage(canvasUsage);
      } catch (error) {
        console.error('Error fetching unified usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user?.id, currentSubscription.creditsUsed]);

  // Get unified feature limits based on current tier
  const getFeatureLimits = async () => {
    return await subscriptionService.getFeatureLimits(currentSubscription.tier);
  };

  // Check if user has access to RepX features
  const hasRepXAccess = (): boolean => {
    return subscriptionService.hasRepXAccess(currentSubscription.tier);
  };

  // Create checkout for RepX subscription
  const createRepXCheckout = async (tier: string, billingCycle: 'monthly' | 'annual') => {
    try {
      const checkoutUrl = await subscriptionService.createCheckoutSession(
        tier,
        billingCycle,
        user?.email
      );
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Failed to create RepX checkout:', error);
      throw error;
    }
  };

  // Check if user can perform action based on unified limits
  const canPerformAction = async (
    action: 'calls' | 'emails' | 'canvas_scans'
  ): Promise<{
    allowed: boolean;
    reason?: string;
    limit?: number | 'unlimited';
    used?: number;
  }> => {
    if (!usage) {
      return { allowed: false, reason: 'Usage data not loaded' };
    }

    try {
      const limits = await getFeatureLimits();
      const limit = limits[action];
      const used = usage[action];

      if (limit === 'unlimited') {
        return { allowed: true, limit, used };
      }

      if (typeof limit === 'number' && used >= limit) {
        return {
          allowed: false,
          reason: `Monthly ${action} limit reached (${limit})`,
          limit,
          used,
        };
      }

      return { allowed: true, limit, used };
    } catch {
      return { allowed: false, reason: 'Failed to check limits' };
    }
  };

  // Get RepX tier mapping for current Canvas tier
  const getRepXTierMapping = () => {
    return subscriptionService.mapCanvasToRepXTier(currentSubscription.tier);
  };

  // Track usage for unified system
  const trackUsage = async (
    action: 'calls' | 'emails' | 'canvas_scans',
    metadata?: Record<string, unknown>
  ) => {
    if (!user?.id || !usage) return;

    try {
      // Update local usage state immediately
      setUsage((prev) =>
        prev
          ? {
              ...prev,
              [action]: prev[action] + 1,
            }
          : null
      );

      // TODO: Send to osbackend usage tracking API
      // This would replace the local Supabase tracking
      console.log(`Tracked ${action} usage for user ${user.id}`, metadata);
    } catch (error) {
      console.error('Error tracking unified usage:', error);
    }
  };

  return {
    // Current subscription info
    subscription: currentSubscription,
    usage,
    loading,

    // RepX integration
    repxPlans,
    hasRepXAccess,
    getRepXTierMapping,
    createRepXCheckout,

    // Feature checking
    canPerformAction,
    getFeatureLimits,
    trackUsage,

    // Convenience flags
    isFreeTier: currentSubscription.tier === 'free',
    hasCanvasAccess: currentSubscription.tier !== 'free',
    hasRepXCalling: hasRepXAccess(),
    hasRepXEmail: hasRepXAccess(),

    // Unified service access
    subscriptionService,
  };
};
