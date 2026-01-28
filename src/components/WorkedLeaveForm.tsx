import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X, Clock, User, Calendar, DollarSign, Sun, Moon, FileText, Users, Sparkles } from 'lucide-react';
import { getCurrentCompanyId } from '@/lib/company';

interface WorkedLeaveFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  name: string;
  positions: { title: string };
  condominiums: { name: string };
  shift: string;
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

export const WorkedLeaveForm = ({ onClose, onSuccess }: WorkedLeaveFormProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [date, setDate] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [observations, setObservations] = useState('');
  const [amount, setAmount] = useState('150');
  const [workShift, setWorkShift] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadSupervisors();
    setCurrentUserAsSupervisor();
  }, []);

  const loadEmployees = async () => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        console.error('Company ID não encontrado');
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          shift,
          positions (title),
          condominiums (name)
        `)
        .eq('active', true)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar funcionários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadSupervisors = async () => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        console.error('Company ID não encontrado');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setSupervisors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar supervisores",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const setCurrentUserAsSupervisor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setSupervisorId(profile.id);
      }
    } catch (error: any) {
      console.error('Erro ao definir supervisor:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const ymdDate = date;

      const { data: existing } = await supabase
        .from('worked_leaves')
        .select('id')
        .eq('employee_id', selectedEmployee)
        .eq('date', ymdDate)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe uma FT registrada para este funcionário nesta data');
      }

      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      const { error } = await supabase
        .from('worked_leaves')
        .insert({
          employee_id: selectedEmployee,
          date: ymdDate,
          supervisor_id: supervisorId,
          observations,
          amount: amount ? parseFloat(amount) : null,
          work_shift: workShift,
          start_time: startTime || null,
          end_time: endTime || null,
          created_by: profile.id,
          company_id: companyId,
        });

      if (error) throw error;

      toast({
        title: "FT registrada com sucesso!",
        description: "A folga trabalhada foi adicionada ao sistema.",
        variant: "default",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar FT",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getShiftLabel = (shift: string) => {
    const shifts: Record<string, string> = {
      manha: 'Manhã',
      noite: 'Noite'
    };
    return shifts[shift] || shift;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-2xl">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500" />
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Registrar FT</h2>
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </div>
                <p className="text-white/80 text-sm mt-0.5">
                  Adicione uma folga trabalhada ao sistema
                </p>
              </div>
            </div>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20 rounded-xl h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 bg-gradient-to-b from-background to-muted/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee & Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="employee" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-emerald-500" />
                Funcionário *
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                <SelectTrigger className="h-12 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id} className="rounded-lg">
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{employee.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {employee.positions?.title} • {employee.condominiums?.name} • {getShiftLabel(employee.shift)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-12 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm hover:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Supervisor & Amount Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="supervisor" className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-emerald-500" />
                Supervisor do Dia *
              </Label>
              <Select value={supervisorId} onValueChange={setSupervisorId} required>
                <SelectTrigger className="h-12 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                  <SelectValue placeholder="Selecione o supervisor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id} className="rounded-lg">
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{supervisor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {supervisor.role === 'gerente' ? 'Gerente' : supervisor.role === 'gestor' ? 'Gestor' : 'Supervisor'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Valor (R$)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="h-12 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm hover:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Shift Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="workShift" className="flex items-center gap-2 text-sm font-medium">
                  {workShift === 'noturno' ? (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-500" />
                  )}
                  Turno de Trabalho *
                </Label>
                <Select 
                  value={workShift} 
                  onValueChange={(value) => {
                    setWorkShift(value);
                    if (value === 'diurno') {
                      setStartTime('06:00');
                      setEndTime('18:00');
                    } else if (value === 'noturno') {
                      setStartTime('18:00');
                      setEndTime('06:00');
                    }
                  }} 
                  required
                >
                  <SelectTrigger className="h-12 rounded-xl border-border/50 bg-background hover:border-emerald-500/50 transition-colors">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="diurno" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        <span>Diurno (06:00 - 18:00)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="noturno" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        <span>Noturno (18:00 - 06:00)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Horário de Início
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-12 rounded-xl border-border/50 bg-background hover:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Horário Final
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-12 rounded-xl border-border/50 bg-background hover:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-emerald-500" />
              Observações
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              rows={3}
              className="rounded-xl border-border/50 bg-background/80 backdrop-blur-sm hover:border-emerald-500/50 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="outline" 
              className="h-12 px-6 rounded-xl border-border/50 hover:bg-muted/50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Registrar FT
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
