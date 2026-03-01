import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/company';

export interface MonthlyData {
  month: string;
  monthShort: string;
  fts: number;
  faltas: number;
  faturamento: number;
}

export interface WeeklyData {
  day: string;
  fts: number;
  faltas: number;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const useChartData = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const companyId = getCurrentCompanyId();
    if (!companyId) { setIsLoading(false); return; }

    try {
      const now = new Date();
      const months: MonthlyData[] = [];

      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const next = new Date(year, month + 1, 1);
        const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;

        const [ftsRes, faltasRes, revRes] = await Promise.all([
          supabase.from('worked_leaves').select('*', { count: 'exact', head: true }).gte('date', start).lt('date', end).eq('company_id', companyId),
          supabase.from('absences').select('*', { count: 'exact', head: true }).gte('date', start).lt('date', end).eq('company_id', companyId),
          supabase.from('worked_leaves').select('amount').gte('date', start).lt('date', end).eq('company_id', companyId),
        ]);

        const rev = revRes.data?.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 0;

        months.push({
          month: MONTH_FULL[month],
          monthShort: MONTH_NAMES[month],
          fts: ftsRes.count || 0,
          faltas: faltasRes.count || 0,
          faturamento: rev,
        });
      }

      setMonthlyData(months);

      // Last 7 days
      const days: WeeklyData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const [ftsDay, faltasDay] = await Promise.all([
          supabase.from('worked_leaves').select('*', { count: 'exact', head: true }).eq('date', dateStr).eq('company_id', companyId),
          supabase.from('absences').select('*', { count: 'exact', head: true }).eq('date', dateStr).eq('company_id', companyId),
        ]);

        days.push({
          day: `${WEEKDAYS[d.getDay()]} ${d.getDate()}`,
          fts: ftsDay.count || 0,
          faltas: faltasDay.count || 0,
        });
      }

      setWeeklyData(days);
    } catch (err) {
      console.error('Erro ao carregar dados dos gráficos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return { monthlyData, weeklyData, isLoading };
};
