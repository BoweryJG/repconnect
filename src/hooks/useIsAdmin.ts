import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = [
  'jasonwilliamgolden@gmail.com',
  'jgolden@bowerycreativeagency.com',
];

export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setIsAdmin(ADMIN_EMAILS.includes(user.email.toLowerCase()));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        setIsAdmin(ADMIN_EMAILS.includes(session.user.email.toLowerCase()));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isLoading };
};