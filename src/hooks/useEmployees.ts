import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/company';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position_id: string;
  condominium_id: string;
  shift: string;
  active: boolean;
  phone?: string;
  age?: number;
  company_time_months?: number;
  driver_license?: string;
  positions?: { title: string };
  condominiums?: { name: string };
}

export interface Position {
  id: string;
  title: string;
}

export interface Condominium {
  id: string;
  name: string;
}

interface UseEmployeesOptions {
  searchTerm?: string;
  condominiumFilter?: string;
}

export const useEmployees = (options: UseEmployeesOptions = {}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadData = useCallback(async () => {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      // Carregar tudo em paralelo
      const [employeesResult, positionsResult, condominiumsResult] = await Promise.all([
        supabase
          .from('employees')
          .select('*, positions(title), condominiums(name)')
          .eq('company_id', companyId)
          .order('first_name'),
        supabase
          .from('positions')
          .select('id, title')
          .eq('company_id', companyId)
          .order('title'),
        supabase
          .from('condominiums')
          .select('id, name')
          .eq('company_id', companyId)
          .order('name')
      ]);

      if (!mountedRef.current) return;

      setEmployees(employeesResult.data || []);
      setPositions(positionsResult.data || []);
      setCondominiums(condominiumsResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced reload para realtime
  const debouncedReload = useCallback(() => {
    const timeoutId = setTimeout(loadData, 300);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    // Single channel para employees
    channelRef.current = supabase
      .channel('employees-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, debouncedReload)
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadData, debouncedReload]);

  // Filtrar employees com useMemo para evitar recálculos
  const filteredEmployees = useMemo(() => {
    const { searchTerm = '', condominiumFilter = 'all' } = options;
    const searchLower = searchTerm.toLowerCase();
    
    return employees.filter(employee => {
      if (!employee.active) return false;
      
      const matchesSearch = !searchTerm || 
        employee.first_name.toLowerCase().includes(searchLower) ||
        employee.last_name.toLowerCase().includes(searchLower) ||
        employee.positions?.title?.toLowerCase().includes(searchLower) ||
        employee.condominiums?.name?.toLowerCase().includes(searchLower);
      
      const matchesFilter = condominiumFilter === 'all' || 
        condominiumFilter === '' || 
        employee.condominium_id === condominiumFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [employees, options.searchTerm, options.condominiumFilter]);

  return {
    employees,
    filteredEmployees,
    positions,
    condominiums,
    isLoading,
    refetch: loadData
  };
};
