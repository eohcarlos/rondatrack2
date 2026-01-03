import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { X, Download, FileText, Clock, Calendar, File, CalendarDays } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCurrentCompanyId } from '@/lib/company';
import * as XLSX from 'xlsx';

interface ReportsPanelProps {
  onClose: () => void;
}

export const ReportsPanel = ({ onClose }: ReportsPanelProps) => {
  const [reportType, setReportType] = useState<'ft' | 'absences'>('ft');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
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
          first_name, 
          last_name,
          positions (title),
          condominiums (name, address)
        `)
        .eq('active', true)
        .eq('company_id', companyId)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um funcionário.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let data;
      let filename;
      let headers;

      // Buscar informações do funcionário selecionado
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      if (!selectedEmployee) {
        throw new Error('Funcionário não encontrado');
      }

      if (reportType === 'ft') {
        const { data: ftData, error } = await supabase
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
              condominiums (name, address),
              shift
            ),
            supervisor_profile:profiles!supervisor_id (name),
            created_by_profile:profiles!created_by (name)
          `)
          .eq('employee_id', selectedEmployeeId)
          .order('date', { ascending: false });

        if (error) throw error;

        data = ftData?.map(item => ({
          'Data': format(new Date(item.date + 'T00:00:00'), 'dd/MM/yyyy'),
          'Nome': `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`,
          'Cargo': item.employees?.positions?.title || '',
          'Supervisor(a)': item.supervisor_profile?.name || '',
          'Condomínio': item.employees?.condominiums?.name || '',
          'Valor': item.amount ? `R$ ${Number(item.amount).toFixed(2)}` : 'Não informado',
          'Observações': item.observations || 'Sem observações',
          'Data do Registro': format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })
        }));

        filename = `folgas_trabalhadas_${selectedEmployee.first_name}_${selectedEmployee.last_name}`;
        headers = ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Condomínio', 'Valor', 'Observações', 'Data do Registro'];

      } else {
        const { data: absenceData, error } = await supabase
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
              condominiums (name, address),
              shift
            ),
            supervisor_profile:profiles!supervisor_id (name),
            created_by_profile:profiles!created_by (name)
          `)
          .eq('employee_id', selectedEmployeeId)
          .order('date', { ascending: false });

        if (error) throw error;

        data = absenceData?.map(item => ({
          'Data': format(new Date(item.date + 'T00:00:00'), 'dd/MM/yyyy'),
          'Nome': `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`,
          'Cargo': item.employees?.positions?.title || '',
          'Supervisor(a)': item.supervisor_profile?.name || '',
          'Condomínio': item.employees?.condominiums?.name || '',
          'Motivo': getReasonLabel(item.reason),
          'Observações': item.observations || 'Sem observações',
          'Data do Registro': format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })
        }));

        filename = `faltas_${selectedEmployee.first_name}_${selectedEmployee.last_name}`;
        headers = ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Condomínio', 'Motivo', 'Observações', 'Data do Registro'];
      }

      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há registros para este funcionário.",
        });
        return;
      }

      if (exportFormat === 'pdf') {
        await downloadPDF(data, headers, filename, selectedEmployee);
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


  const downloadExcel = (data: any[], headers: string[], filename: string) => {
    // Criar worksheet com os dados
    const worksheetData = [
      headers,
      ...data.map(row => headers.map(header => row[header] || ''))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Calcular largura automática das colunas
    const colWidths = headers.map((header, colIndex) => {
      const headerLength = header.length;
      const maxDataLength = Math.max(
        ...data.map(row => String(row[header] || '').length)
      );
      return { wch: Math.max(headerLength, maxDataLength, 10) + 2 };
    });
    worksheet['!cols'] = colWidths;

    // Aplicar estilo nos cabeçalhos e bordas em todas as células
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { t: 's', v: '' };
        }

        // Aplicar estilo de borda em todas as células
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          },
          alignment: {
            vertical: 'center',
            horizontal: 'left',
            wrapText: false
          }
        };

        // Estilo específico para cabeçalhos (primeira linha)
        if (R === 0) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            font: { bold: true, color: { rgb: '000000' } },
            fill: { fgColor: { rgb: 'F2F2F2' } },
            alignment: {
              vertical: 'center',
              horizontal: 'center',
              wrapText: false
            }
          };
        }
      }
    }

    // Criar workbook e adicionar a worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

    // Exportar para arquivo .xlsx
    XLSX.writeFile(workbook, `${filename}.xlsx`, { 
      bookType: 'xlsx',
      type: 'binary',
      cellStyles: true
    });
  };

  const downloadPDF = async (data: any[], headers: string[], filename: string, employee: any) => {
    try {
      const doc = new jsPDF();
      
      // Adicionar logotipo no canto direito
      const logoUrl = '/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png';
      
      // Carregar a imagem como base64
      try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Adicionar logo no canto superior direito (x: 160, y: 10, width: 35, height: 20)
            doc.addImage(base64, 'PNG', 160, 10, 35, 20);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (logoError) {
        console.warn('Não foi possível carregar o logotipo:', logoError);
      }
      
      // Título
      doc.setFontSize(18);
      doc.text(`Relatório de ${reportType === 'ft' ? 'Folgas Trabalhadas' : 'Faltas'}`, 20, 20);
      
      // Informações do funcionário
      doc.setFontSize(12);
      doc.text(`Funcionário: ${employee.first_name} ${employee.last_name}`, 20, 35);
      doc.text(`Cargo: ${employee.positions?.title || 'Não informado'}`, 20, 45);
      doc.text(`Local de Trabalho: ${employee.condominiums?.name || 'Não informado'}`, 20, 55);
      doc.text(`Endereço: ${employee.condominiums?.address || 'Não informado'}`, 20, 65);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 75);

      // Tabela
      const tableData = data.map(row => headers.map(header => String(row[header] || '')));
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 85,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: reportType === 'absences' ? [220, 53, 69] : [59, 130, 246],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
      });

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar arquivo PDF');
    }
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
                Gere relatórios detalhados por funcionário
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

          {/* Seleção de Funcionário */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Selecionar Funcionário *</Label>
            <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {employee.positions?.title || 'Sem cargo'} - {employee.condominiums?.name || 'Sem condomínio'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Formato */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Formato de Exportação</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  exportFormat === 'xlsx' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setExportFormat('xlsx')}
              >
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Excel</p>
                  <p className="text-sm text-muted-foreground">.xlsx</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  exportFormat === 'pdf' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-border hover:border-red-300'
                }`}
                onClick={() => setExportFormat('pdf')}
              >
                <CardContent className="p-4 text-center">
                  <File className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="font-medium">PDF</p>
                  <p className="text-sm text-muted-foreground">.pdf</p>
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
              <p>• Nome</p>
              <p>• Cargo</p>
              <p>• Supervisor(a)</p>
              <p>• Condomínio</p>
              {reportType === 'ft' ? <p>• Valor</p> : <p>• Motivo</p>}
              <p>• Observações</p>
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