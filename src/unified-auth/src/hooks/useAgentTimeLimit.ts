import { useFeatureAccess } from './useFeatureAccess';

interface UseAgentTimeLimitResult {
  timeLimit: number; // in seconds, -1 means unlimited
  displayTime: string;
  isUnlimited: boolean;
  loading: boolean;
  error: Error | null;
}

export function useAgentTimeLimit(userId?: string): UseAgentTimeLimitResult {
  const { features, loading, error } = useFeatureAccess(userId);

  const timeLimit = features.agentTimeLimit;
  const isUnlimited = timeLimit === -1;

  const displayTime = isUnlimited
    ? 'Unlimited'
    : timeLimit >= 60
      ? `${Math.floor(timeLimit / 60)} minute${Math.floor(timeLimit / 60) > 1 ? 's' : ''}`
      : `${timeLimit} seconds`;

  return {
    timeLimit,
    displayTime,
    isUnlimited,
    loading,
    error,
  };
}
