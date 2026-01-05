import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Calendar, Car, Building, Clock, DollarSign, AlertTriangle, Briefcase, TrendingUp } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
  company_time_months?: number;
  driver_license?: string;
  shift: string;
  positions?: { title: string };
  condominiums?: { name: string };
}

interface EmployeeStats {
  totalFT: number;
  totalAbsences: number;
  totalFTValue: number;
}

interface EmployeeDetailsModalProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeDetailsModal = ({ employeeId, isOpen, onClose }: EmployeeDetailsModalProps) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<EmployeeStats>({ totalFT: 0, totalAbsences: 0, totalFTValue: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeId && isOpen) {
      loadEmployeeDetails();
    }
  }, [employeeId, isOpen]);

  const loadEmployeeDetails = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      // Fetch employee details, worked leaves and absences in parallel
      const [employeeResult, workedLeavesResult, absencesResult] = await Promise.all([
        supabase
          .from('employees')
          .select(`
            id,
            first_name,
            last_name,
            phone,
            age,
            company_time_months,
            driver_license,
            shift,
            positions (title),
            condominiums (name)
          `)
          .eq('id', employeeId)
          .single(),
        supabase
          .from('worked_leaves')
          .select('id, amount')
          .eq('employee_id', employeeId),
        supabase
          .from('absences')
          .select('id')
          .eq('employee_id', employeeId)
      ]);

      if (employeeResult.error) throw employeeResult.error;
      setEmployee(employeeResult.data);

      // Calculate stats
      const workedLeaves = workedLeavesResult.data || [];
      const absences = absencesResult.data || [];
      const totalFTValue = workedLeaves.reduce((sum, ft) => sum + (ft.amount || 0), 0);

      setStats({
        totalFT: workedLeaves.length,
        totalAbsences: absences.length,
        totalFTValue
      });
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftLabel = (shift: string) => {
    const shifts = {
      manha: 'Manhã',
      noite: 'Noite'
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  const getShiftColor = (shift: string) => {
    const colors = {
      manha: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white',
      noite: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
    };
    return colors[shift as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            Detalhes do Funcionário
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : employee ? (
          <div className="space-y-5 pt-2">
            {/* Employee Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-2xl font-bold text-primary-foreground">
                  {employee.first_name.charAt(0)}{employee.last_name?.charAt(0) || ''}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-foreground">
                  {employee.first_name} {employee.last_name}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{employee.positions?.title || 'Sem cargo'}</span>
                </div>
              </div>
              <Badge className={`${getShiftColor(employee.shift)} border-0 px-3 py-1`}>
                {getShiftLabel(employee.shift)}
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.totalFT}</p>
                <p className="text-xs text-muted-foreground">FTs Realizadas</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.totalAbsences}</p>
                <p className="text-xs text-muted-foreground">Faltas</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">R$ {stats.totalFTValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total FT</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Building className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Condomínio</p>
                  <p className="font-semibold text-foreground">{employee.condominiums?.name || 'N/A'}</p>
                </div>
              </div>

              {employee.phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-semibold text-foreground">{employee.phone}</p>
                  </div>
                </div>
              )}

              {employee.age && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Idade</p>
                    <p className="font-semibold text-foreground">{employee.age} anos</p>
                  </div>
                </div>
              )}

              {employee.company_time_months !== undefined && employee.company_time_months !== null && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo de Empresa</p>
                    <p className="font-semibold text-foreground">
                      {Math.floor(employee.company_time_months / 12)} anos e {employee.company_time_months % 12} meses
                    </p>
                  </div>
                </div>
              )}

              {employee.driver_license && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CNH</p>
                    <p className="font-semibold text-foreground">{employee.driver_license}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Funcionário não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
