import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/company';

export interface Stats {
  totalEmployees: number;
  monthlyWorkedLeaves: number;
  monthlyAbsences: number;
  totalAbsences: number;
  totalCondominiums: number;
  totalWorkedLeaves: number;
  previousMonthWorkedLeaves: number;
  previousMonthAbsences: number;
  monthlyWorkedLeavesRevenue: number;
  totalWorkedLeavesRevenue: number;
}

const initialStats: Stats = {
  totalEmployees: 0,
  monthlyWorkedLeaves: 0,
  monthlyAbsences: 0,
  totalAbsences: 0,
  totalCondominiums: 0,
  totalWorkedLeaves: 0,
  previousMonthWorkedLeaves: 0,
  previousMonthAbsences: 0,
  monthlyWorkedLeavesRevenue: 0,
  totalWorkedLeavesRevenue: 0
};

// Cache para evitar requisições duplicadas
let statsCache: { data: Stats; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 segundos

export const useStats = () => {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const loadStats = useCallback(async (force = false) => {
    // Evitar múltiplas requisições simultâneas
    if (loadingRef.current) return;
    
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    // Verificar cache
    if (!force && statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
      setStats(statsCache.data);
      setIsLoading(false);
      return;
    }

    loadingRef.current = true;
    
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const next = new Date(year, month, 1);
      const nextYear = next.getFullYear();
      const nextMonth = next.getMonth() + 1;
      const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
      const prevMonth = new Date(year, month - 2, 1);
      const prevYear = prevMonth.getFullYear();
      const prevMonthNum = prevMonth.getMonth() + 1;
      const startOfPrevMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`;

      // Executar todas as queries em paralelo
      const [
        employeesResult,
        monthlyFtResult,
        prevFtResult,
        monthlyAbsencesResult,
        prevAbsencesResult,
        totalAbsencesResult,
        condominiumsResult,
        totalFtResult,
        monthlyRevenueResult,
        totalRevenueResult
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('active', true).eq('company_id', companyId),
        supabase.from('worked_leaves').select('*', { count: 'exact', head: true }).gte('date', startOfMonth).lt('date', startOfNextMonth).eq('company_id', companyId),
        supabase.from('worked_leaves').select('*', { count: 'exact', head: true }).gte('date', startOfPrevMonth).lt('date', startOfMonth).eq('company_id', companyId),
        supabase.from('absences').select('*', { count: 'exact', head: true }).gte('date', startOfMonth).lt('date', startOfNextMonth).eq('company_id', companyId),
        supabase.from('absences').select('*', { count: 'exact', head: true }).gte('date', startOfPrevMonth).lt('date', startOfMonth).eq('company_id', companyId),
        supabase.from('absences').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('condominiums').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('worked_leaves').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('worked_leaves').select('amount').gte('date', startOfMonth).lt('date', startOfNextMonth).eq('company_id', companyId),
        supabase.from('worked_leaves').select('amount').eq('company_id', companyId)
      ]);

      if (!mountedRef.current) return;

      const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      const totalRevenue = totalRevenueResult.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

      const newStats: Stats = {
        totalEmployees: employeesResult.count || 0,
        monthlyWorkedLeaves: monthlyFtResult.count || 0,
        monthlyAbsences: monthlyAbsencesResult.count || 0,
        totalAbsences: totalAbsencesResult.count || 0,
        totalCondominiums: condominiumsResult.count || 0,
        totalWorkedLeaves: totalFtResult.count || 0,
        previousMonthWorkedLeaves: prevFtResult.count || 0,
        previousMonthAbsences: prevAbsencesResult.count || 0,
        monthlyWorkedLeavesRevenue: monthlyRevenue,
        totalWorkedLeavesRevenue: totalRevenue
      };

      // Atualizar cache
      statsCache = { data: newStats, timestamp: Date.now() };
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  }, []);

  // Debounce para realtime updates
  const debouncedLoad = useCallback(() => {
    const timeoutId = setTimeout(() => loadStats(true), 500);
    return () => clearTimeout(timeoutId);
  }, [loadStats]);

  useEffect(() => {
    mountedRef.current = true;
    loadStats();

    // Single channel para todas as tabelas
    const channel = supabase
      .channel('stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, debouncedLoad)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worked_leaves' }, debouncedLoad)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, debouncedLoad)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'condominiums' }, debouncedLoad)
      .subscribe();

    channelsRef.current = [channel];

    return () => {
      mountedRef.current = false;
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    };
  }, [loadStats, debouncedLoad]);

  return { stats, isLoading, refetch: () => loadStats(true) };
};

// Função para invalidar cache (útil após ações do usuário)
export const invalidateStatsCache = () => {
  statsCache = null;
};
