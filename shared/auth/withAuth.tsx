import React from 'react';
import { useRequireAuth } from './hooks';

/**
 * Higher-order component for requiring authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
): React.FC<P> {
  return (props: P) => {
    const { user, loading } = useRequireAuth(redirectTo);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}
