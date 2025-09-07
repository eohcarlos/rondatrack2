import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Clock } from 'lucide-react';
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
  const [amount, setAmount] = useState('');
  const [workShift, setWorkShift] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadSupervisors();
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

      // Usar string local YYYY-MM-DD para evitar fuso horário
      const ymdDate = date;

      // Verificar se já existe um registro para este funcionário na mesma data
      const { data: existing } = await supabase
        .from('worked_leaves')
        .select('id')
        .eq('employee_id', selectedEmployee)
        .eq('date', ymdDate)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe uma FT registrada para este funcionário nesta data');
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
          created_by: profile.id,
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
    const shifts = {
      manha: 'Manhã',
      tarde: 'Tarde', 
      noite: 'Noite',
      madrugada: 'Madrugada'
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  return (
    <Card className="border-0 shadow-2xl rounded-xl">
      <CardHeader className="bg-gradient-to-r from-accent to-accent/80 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">Registrar Folga Trabalhada (FT)</CardTitle>
              <CardDescription className="text-accent-foreground/90">
                Adicione uma folga trabalhada ao sistema
              </CardDescription>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                  <SelectTrigger className="rounded-lg text-foreground">
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{employee.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {employee.positions?.title} - {employee.condominiums?.name} - {getShiftLabel(employee.shift)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supervisor">Supervisor do Dia *</Label>
              <Select value={supervisorId} onValueChange={setSupervisorId} required>
                <SelectTrigger className="rounded-lg text-foreground">
                  <SelectValue placeholder="Selecione o supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      <div className="flex flex-col">
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
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workShift">Turno de Trabalho *</Label>
              <Select value={workShift} onValueChange={setWorkShift} required>
                <SelectTrigger className="rounded-lg text-foreground">
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diurno">Diurno (06:00 - 18:00)</SelectItem>
                  <SelectItem value="noturno">Noturno (18:00 - 06:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              rows={3}
              className="rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onClose} variant="outline" className="rounded-lg">
              Cancelar
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-white rounded-lg" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Registrar FT"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};