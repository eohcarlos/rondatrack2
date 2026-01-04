import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Calendar } from 'lucide-react';
import { getCurrentCompanyId } from '@/lib/company';

interface AbsenceFormProps {
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

const absenceReasons = [
  'Falta justificada',
  'Falta injustificada',
  'Atestado médico',
  'Licença médica',
  'Licença maternidade',
  'Licença paternidade',
  'Falta abonada',
  'Suspensão disciplinar',
  'Outros'
];

export const AbsenceForm = ({ onClose, onSuccess }: AbsenceFormProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [observations, setObservations] = useState('');
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

      // Usar string local YYYY-MM-DD para evitar fuso horário
      const ymdDate = date;

      // Verificar se já existe um registro para este funcionário na mesma data
      const { data: existing } = await supabase
        .from('absences')
        .select('id')
        .eq('employee_id', selectedEmployee)
        .eq('date', ymdDate)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe uma falta registrada para este funcionário nesta data');
      }

      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      const { error } = await supabase
        .from('absences')
        .insert({
          employee_id: selectedEmployee,
          date: ymdDate,
          reason,
          supervisor_id: supervisorId,
          observations,
          created_by: profile.id,
          company_id: companyId,
        });

      if (error) throw error;

      toast({
        title: "Falta registrada com sucesso!",
        description: "A falta foi adicionada ao sistema.",
        variant: "default",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar falta",
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
      noite: 'Noite'
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  return (
    <Card className="border-0 shadow-2xl rounded-xl">
      <CardHeader className="bg-gradient-to-r from-destructive to-destructive/80 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">Registrar Falta</CardTitle>
              <CardDescription className="text-destructive-foreground/90">
                Adicione uma falta de funcionário ao sistema
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
              <Label htmlFor="reason">Motivo *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger className="rounded-lg text-foreground">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {absenceReasons.map((reasonOption) => (
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações *</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações sobre a falta"
              rows={3}
              required
              className="rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onClose} variant="outline" className="rounded-lg">
              Cancelar
            </Button>
            <Button type="submit" className="bg-destructive hover:bg-destructive/90 text-white rounded-lg" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Registrar Falta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};