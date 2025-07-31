import { useState, useEffect } from 'react';
import { RepXTier } from '../types';
import type { UserSubscription } from '../types';
import { DEFAULT_BACKEND_URL } from '../constants';

interface UseRepXTierResult {
  tier: RepXTier;
  subscription: UserSubscription | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRepXTier(userId?: string): UseRepXTierResult {
  const [tier, setTier] = useState<RepXTier>(RepXTier.Rep0);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${DEFAULT_BACKEND_URL}/api/repx/subscription`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();

      if (data.subscription) {
        setSubscription(data.subscription);
        setTier(data.subscription.tier || RepXTier.Rep0);
      } else {
        setTier(RepXTier.Rep0);
      }
    } catch (err) {
      console.error('Error fetching RepX tier:', err);
      setError(err as Error);
      setTier(RepXTier.Rep0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  return {
    tier,
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
  };
}
