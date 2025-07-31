import React from 'react';
import { useAuth } from './useAuth';
import { useRequireAuth } from './hooks';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowPublic?: boolean;
  publicComponent?: React.ReactNode;
}

/**
 * Component that requires authentication to render children
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = <div>Loading...</div>,
  redirectTo = '/login',
  allowPublic = false,
  publicComponent,
}) => {
  const authPublic = useAuth();
  const authPrivate = useRequireAuth(redirectTo);
  const { user, loading } = allowPublic ? authPublic : authPrivate;

  if (loading) {
    return <>{fallback}</>;
  }

  if (!user) {
    if (allowPublic && publicComponent) {
      return <>{publicComponent}</>;
    }
    return null;
  }

  return <>{children}</>;
};

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component that only renders for non-authenticated users
 */
export const GuestGuard: React.FC<GuestGuardProps> = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user && typeof window !== 'undefined') {
    window.location.href = redirectTo;
    return null;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  role: string;
  fallback?: React.ReactNode;
}

/**
 * Component that requires specific role to render children
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  fallback = <div>Unauthorized</div>,
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const userRoles = user.app_metadata?.roles || [];
  if (!userRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
