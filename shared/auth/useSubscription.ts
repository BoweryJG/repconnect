import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from './supabase';
import { CREDIT_COSTS, getSubscriptionTier, canAccessFeature } from './subscription.config';

interface UsageData {
  creditsUsed: number;
  magicLinksUsed: number;
  canvasScansThisMonth: number;
  lastResetDate: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const subscription = user?.subscription || {
    tier: 'explorer',
    status: 'active',
    credits: 5,
    creditsUsed: 0,
    magicLinksUsed: 0,
    magicLinksLimit: 0,
  };

  const tier = getSubscriptionTier(subscription.tier);

  // Fetch usage data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        // Get current month usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('usage_tracking')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (error) throw error;

        // Calculate usage
        const creditsUsed =
          data?.reduce(
            (sum, record) => sum + (CREDIT_COSTS[record.action as keyof typeof CREDIT_COSTS] || 0),
            0
          ) || 0;

        const magicLinksUsed = data?.filter((r) => r.action === 'magic_link').length || 0;
        const canvasScansThisMonth = data?.filter((r) => r.action === 'canvas_scan').length || 0;

        setUsage({
          creditsUsed,
          magicLinksUsed,
          canvasScansThisMonth,
          lastResetDate: startOfMonth.toISOString(),
        });
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user?.id]);

  // Check if user can perform action
  const canPerformAction = (
    action: keyof typeof CREDIT_COSTS
  ): { allowed: boolean; reason?: string; creditsNeeded?: number } => {
    if (!subscription || subscription.status !== 'active') {
      return { allowed: false, reason: 'No active subscription' };
    }

    const creditsNeeded = CREDIT_COSTS[action];
    const creditsRemaining = subscription.credits - (usage?.creditsUsed || 0);

    // Unlimited credits for enterprise
    if (subscription.tier === 'enterprise') {
      return { allowed: true };
    }

    // Check credit limit
    if (creditsRemaining < creditsNeeded) {
      return {
        allowed: false,
        reason: `Not enough credits. Need ${creditsNeeded}, have ${creditsRemaining}`,
        creditsNeeded,
      };
    }

    // Check specific limits
    if (action === 'canvasScan') {
      const limit = tier.limits.canvasScansPerMonth;
      if (limit && limit !== -1 && (usage?.canvasScansThisMonth || 0) >= limit) {
        return {
          allowed: false,
          reason: `Monthly scan limit reached (${limit})`,
        };
      }
    }

    return { allowed: true };
  };

  // Check magic link access
  const canSendMagicLink = (): { allowed: boolean; reason?: string } => {
    if (subscription.tier === 'explorer') {
      return { allowed: false, reason: 'Magic links not available in free tier' };
    }

    if (subscription.tier === 'enterprise') {
      return { allowed: true };
    }

    const remaining = subscription.magicLinksLimit - (usage?.magicLinksUsed || 0);
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `Monthly magic link limit reached (${subscription.magicLinksLimit})`,
      };
    }

    return { allowed: true };
  };

  // Track usage
  const trackUsage = async (action: string, metadata?: Record<string, unknown>) => {
    if (!user?.id) return;

    try {
      await supabase.from('usage_tracking').insert({
        user_id: user.id,
        action,
        metadata,
        created_at: new Date().toISOString(),
      });

      // Update local usage state
      if (usage) {
        const creditCost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] || 0;
        setUsage({
          ...usage,
          creditsUsed: usage.creditsUsed + creditCost,
          magicLinksUsed: action === 'magic_link' ? usage.magicLinksUsed + 1 : usage.magicLinksUsed,
          canvasScansThisMonth:
            action === 'canvas_scan' ? usage.canvasScansThisMonth + 1 : usage.canvasScansThisMonth,
        });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  return {
    subscription,
    tier,
    usage,
    loading,
    canPerformAction,
    canSendMagicLink,
    trackUsage,
    hasAccess: (feature: keyof typeof tier.limits) => canAccessFeature(subscription, feature),
    creditsRemaining: subscription.credits - (usage?.creditsUsed || 0),
    magicLinksRemaining: subscription.magicLinksLimit - (usage?.magicLinksUsed || 0),
    isFreeTier: subscription.tier === 'explorer',
    isPro: subscription.tier === 'dominator' || subscription.tier === 'enterprise',
    isEnterprise: subscription.tier === 'enterprise',
  };
};
