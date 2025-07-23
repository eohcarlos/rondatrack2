import { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        const { data: ftData, error } = await supabase
          .from('worked_leaves')
          .select(`
            date,
            observations,
            created_at,
            employees (
              name,
              positions (title),
              condominiums (name),
              shift
            ),
            supervisor_profile:profiles!supervisor_id (name),
            created_by_profile:profiles!created_by (name)
          `)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (error) throw error;

        data = ftData?.map(item => ({
          Data: new Date(item.date).toLocaleDateString('pt-BR'),
          Nome: item.employees?.name || '',
          Cargo: item.employees?.positions?.title || '',
          Condomínio: item.employees?.condominiums?.name || '',
          Turno: getShiftLabel(item.employees?.shift || ''),
          'Supervisor do Dia': item.supervisor_profile?.name || '',
          Observações: item.observations || '',
          'Registrado por': item.created_by_profile?.name || '',
          'Data de Registro': new Date(item.created_at).toLocaleDateString('pt-BR')
        }));

        filename = `folgas_trabalhadas_${startDate}_${endDate}`;
        headers = ['Data', 'Nome', 'Cargo', 'Condomínio', 'Turno', 'Supervisor do Dia', 'Observações', 'Registrado por', 'Data de Registro'];

      } else {
        const { data: absenceData, error } = await supabase
          .from('absences')
          .select(`
            date,
            reason,
            observations,
            created_at,
            employees (
              name,
              positions (title),
              condominiums (name),
              shift
            ),
            supervisor_profile:profiles!supervisor_id (name),
            created_by_profile:profiles!created_by (name)
          `)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (error) throw error;

        data = absenceData?.map(item => ({
          Data: new Date(item.date).toLocaleDateString('pt-BR'),
          Nome: item.employees?.name || '',
          Cargo: item.employees?.positions?.title || '',
          Condomínio: item.employees?.condominiums?.name || '',
          Turno: getShiftLabel(item.employees?.shift || ''),
          Motivo: item.reason,
          Observações: item.observations || '',
          'Supervisor do Dia': item.supervisor_profile?.name || '',
          'Registrado por': item.created_by_profile?.name || '',
          'Data de Registro': new Date(item.created_at).toLocaleDateString('pt-BR')
        }));

        filename = `faltas_${startDate}_${endDate}`;
        headers = ['Data', 'Nome', 'Cargo', 'Condomínio', 'Turno', 'Motivo', 'Observações', 'Supervisor do Dia', 'Registrado por', 'Data de Registro'];
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
              <p>• Data</p>
              <p>• Nome do funcionário</p>
              <p>• Cargo</p>
              <p>• Condomínio</p>
              <p>• Turno</p>
              {reportType === 'absences' && <p>• Motivo da falta</p>}
              <p>• Observações</p>
              <p>• Supervisor do dia</p>
              <p>• Registrado por</p>
              <p>• Data de registro</p>
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