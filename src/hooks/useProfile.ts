import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'supervisor' | 'gestor' | 'gerente';
  avatar_url?: string;
}

// Cache global para evitar requisições duplicadas
let profileCache: { data: Profile | null; userId: string | null; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minuto

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mountedRef.current) {
        setIsLoading(false);
        return;
      }

      // Verificar cache
      if (profileCache && 
          profileCache.userId === user.id && 
          Date.now() - profileCache.timestamp < CACHE_DURATION) {
        setProfile(profileCache.data);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, first_name, last_name, email, role, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) throw error;

      // Atualizar cache
      profileCache = { data, userId: user.id, timestamp: Date.now() };
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadProfile();

    return () => {
      mountedRef.current = false;
    };
  }, [loadProfile]);

  return { profile, isLoading, refetch: loadProfile };
};

export const invalidateProfileCache = () => {
  profileCache = null;
};
