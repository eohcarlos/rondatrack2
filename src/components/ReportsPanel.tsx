import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { X, Download, FileText, Clock, Calendar } from 'lucide-react';

interface ReportsPanelProps {
  onClose: () => void;
}

export const ReportsPanel = ({ onClose }: ReportsPanelProps) => {
  const [reportType, setReportType] = useState<'ft' | 'absences'>('ft');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let data;
      let filename;
      let headers;

      if (reportType === 'ft') {
        let query = supabase
          .from('worked_leaves')
          .select(`
            date,
            observations,
            amount,
            work_shift,
            created_at,
            employees (
              first_name,
              last_name,
              positions (title),
              condominiums (name),
              shift
            ),
            supervisor_profile:profiles!supervisor_id (name),
            created_by_profile:profiles!created_by (name)
          `)
          .gte('date', startDate)
          .lte('date', endDate);

        if (selectedEmployeeId && selectedEmployeeId !== 'all') {
          query = query.eq('employee_id', selectedEmployeeId);
        }

        const { data: ftData, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        data = ftData?.map(item => ({
          'Data da Folga Trabalhada': new Date(item.date).toLocaleDateString('pt-BR'),
          'Nome Completo do Funcionário': `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`,
          'Cargo / Função': item.employees?.positions?.title || '',
          'Condomínio Atual': item.employees?.condominiums?.name || '',
          'Turno de Trabalho': getShiftLabel(item.employees?.shift || ''),
          'Valor': item.amount ? `R$ ${Number(item.amount).toFixed(2)}` : 'Não informado',
          'Supervisor Responsável': item.supervisor_profile?.name || '',
          'Observações Gerais': item.observations || 'Sem observações',
          'Registrado Por': item.created_by_profile?.name || '',
          'Data do Registro': new Date(item.created_at).toLocaleDateString('pt-BR')
        }));

        filename = `folgas_trabalhadas_${startDate}_${endDate}${selectedEmployeeId ? '_funcionario_especifico' : ''}`;
        headers = ['Data da Folga Trabalhada', 'Nome Completo do Funcionário', 'Cargo / Função', 'Condomínio Atual', 'Turno de Trabalho', 'Valor', 'Supervisor Responsável', 'Observações Gerais', 'Registrado Por', 'Data do Registro'];

      } else {
        let query = supabase
          .from('absences')
          .select(`
            date,
            reason,
            observations,
            created_at,
            employees (
              first_name,
              last_name,
              positions (title),
              condominiums (name),
              shift
            ),
            supervisor_profile:profiles!supervisor_id (name),
            created_by_profile:profiles!created_by (name)
          `)
          .gte('date', startDate)
          .lte('date', endDate);

        if (selectedEmployeeId && selectedEmployeeId !== 'all') {
          query = query.eq('employee_id', selectedEmployeeId);
        }

        const { data: absenceData, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        data = absenceData?.map(item => ({
          'Data da Falta': new Date(item.date).toLocaleDateString('pt-BR'),
          'Nome Completo do Funcionário': `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`,
          'Cargo / Função': item.employees?.positions?.title || '',
          'Condomínio Atual': item.employees?.condominiums?.name || '',
          'Turno de Trabalho': getShiftLabel(item.employees?.shift || ''),
          'Motivo da Ausência': getReasonLabel(item.reason),
          'Observações Gerais': item.observations || 'Sem observações',
          'Supervisor Responsável': item.supervisor_profile?.name || '',
          'Registrado Por': item.created_by_profile?.name || '',
          'Data do Registro': new Date(item.created_at).toLocaleDateString('pt-BR')
        }));

        filename = `faltas_${startDate}_${endDate}${selectedEmployeeId ? '_funcionario_especifico' : ''}`;
        headers = ['Data da Falta', 'Nome Completo do Funcionário', 'Cargo / Função', 'Condomínio Atual', 'Turno de Trabalho', 'Motivo da Ausência', 'Observações Gerais', 'Supervisor Responsável', 'Registrado Por', 'Data do Registro'];
      }

      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há registros no período selecionado.",
        });
        return;
      }

      if (format === 'csv') {
        downloadCSV(data, headers, filename);
      } else {
        downloadExcel(data, headers, filename);
      }

      toast({
        title: "Relatório exportado com sucesso!",
        description: `${data.length} registros exportados.`,
      });

    } catch (error: any) {
      toast({
        title: "Erro ao exportar relatório",
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

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      'doenca': 'Doença',
      'atestado': 'Atestado Médico',
      'falta_injustificada': 'Falta Injustificada',
      'licenca': 'Licença',
      'ferias': 'Férias',
      'outros': 'Outros'
    };
    return labels[reason] || reason;
  };

  const downloadCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const downloadExcel = (data: any[], headers: string[], filename: string) => {
    // Simulação de export Excel (em produção, usar biblioteca como SheetJS)
    const csvContent = [
      headers.join('\t'),
      ...data.map(row => headers.map(header => row[header] || '').join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xls`;
    link.click();
  };

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">Exportar Relatórios</CardTitle>
              <CardDescription className="text-primary-foreground/90">
                Gere relatórios em Excel ou CSV
              </CardDescription>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Tipo de Relatório */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de Relatório</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  reportType === 'ft' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setReportType('ft')}
              >
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="font-medium">Folgas Trabalhadas</p>
                  <p className="text-sm text-muted-foreground">Relatório de FTs</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  reportType === 'absences' 
                    ? 'border-destructive bg-destructive/10' 
                    : 'border-border hover:border-destructive/50'
                }`}
                onClick={() => setReportType('absences')}
              >
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="font-medium">Faltas</p>
                  <p className="text-sm text-muted-foreground">Relatório de faltas</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Filtro por Funcionário */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Filtro por Funcionário (Opcional)</Label>
            <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Período */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Período</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Formato */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Formato de Exportação</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  format === 'xlsx' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setFormat('xlsx')}
              >
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Excel (.xlsx)</p>
                  <p className="text-sm text-muted-foreground">Planilha Excel</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  format === 'csv' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setFormat('csv')}
              >
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">CSV (.csv)</p>
                  <p className="text-sm text-muted-foreground">Valores separados por vírgula</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Campos do Relatório */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              {reportType === 'ft' ? 'Campos do Relatório de FT:' : 'Campos do Relatório de Faltas:'}
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {reportType === 'ft' ? 'Data da Folga Trabalhada' : 'Data da Falta'}</p>
              <p>• Nome Completo do Funcionário</p>
              <p>• Cargo / Função</p>
              <p>• Condomínio Atual</p>
              <p>• Turno de Trabalho</p>
              {reportType === 'absences' && <p>• Motivo da Ausência</p>}
              <p>• Observações Gerais</p>
              <p>• Supervisor Responsável</p>
              <p>• Registrado Por</p>
              <p>• Data do Registro</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleExport} variant="default" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? "Exportando..." : "Exportar Relatório"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};