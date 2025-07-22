import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const ADMIN_EMAILS = ['jasonwilliamgolden@gmail.com', 'jgolden@bowerycreativeagency.com'];

export const useIsAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status based on auth context user
    if (user?.email) {
      setIsAdmin(ADMIN_EMAILS.includes(user.email.toLowerCase()));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return { 
    isAdmin, 
    isLoading: authLoading // Use auth context loading state
  };
};
