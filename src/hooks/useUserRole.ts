import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'supervisor' | 'user';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else if (data) {
        setRole(data.role as UserRole);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';

  return { role, isAdmin, isSupervisor, isLoading, refetch: checkUserRole };
};
