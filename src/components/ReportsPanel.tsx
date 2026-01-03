import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { X, Download, FileText, Clock, Calendar, File, Users, CalendarRange } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCurrentCompanyId } from '@/lib/company';
import * as XLSX from 'xlsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ReportsPanelProps {
  onClose: () => void;
}

export const ReportsPanel = ({ onClose }: ReportsPanelProps) => {
  const [reportType, setReportType] = useState<'ft' | 'absences'>('ft');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [exportAllEmployees, setExportAllEmployees] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [periodFilter, setPeriodFilter] = useState<'month' | 'lastMonth' | 'custom'>('month');
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (periodFilter === 'month') {
      setStartDate(startOfMonth(new Date()));
      setEndDate(endOfMonth(new Date()));
    } else if (periodFilter === 'lastMonth') {
      const lastMonth = subMonths(new Date(), 1);
      setStartDate(startOfMonth(lastMonth));
      setEndDate(endOfMonth(lastMonth));
    }
  }, [periodFilter]);

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

  const fetchReportData = async (employeeId?: string) => {
    const companyId = getCurrentCompanyId();
    if (!companyId) throw new Error('Company ID não encontrado');

    const dateStart = startDate ? format(startDate, 'yyyy-MM-dd') : null;
    const dateEnd = endDate ? format(endDate, 'yyyy-MM-dd') : null;

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
            condominiums (name, address),
            shift
          ),
          supervisor_profile:profiles!supervisor_id (name),
          created_by_profile:profiles!created_by (name)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (dateStart) {
        query = query.gte('date', dateStart);
      }
      if (dateEnd) {
        query = query.lte('date', dateEnd);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(item => ({
        'Data': format(new Date(item.date + 'T00:00:00'), 'dd/MM/yyyy'),
        'Nome': `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`.trim(),
        'Cargo': item.employees?.positions?.title || '',
        'Supervisor(a)': item.supervisor_profile?.name || '',
        'Condomínio': item.employees?.condominiums?.name || '',
        'Endereço': item.employees?.condominiums?.address || '',
        'Turno': getShiftLabel(item.employees?.shift || ''),
        'Valor': item.amount ? `R$ ${Number(item.amount).toFixed(2)}` : 'Não informado',
        'Observações': item.observations || 'Sem observações',
        'Data do Registro': format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      })) || [];
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
            condominiums (name, address),
            shift
          ),
          supervisor_profile:profiles!supervisor_id (name),
          created_by_profile:profiles!created_by (name)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (dateStart) {
        query = query.gte('date', dateStart);
      }
      if (dateEnd) {
        query = query.lte('date', dateEnd);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(item => ({
        'Data': format(new Date(item.date + 'T00:00:00'), 'dd/MM/yyyy'),
        'Nome': `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`.trim(),
        'Cargo': item.employees?.positions?.title || '',
        'Supervisor(a)': item.supervisor_profile?.name || '',
        'Condomínio': item.employees?.condominiums?.name || '',
        'Endereço': item.employees?.condominiums?.address || '',
        'Turno': getShiftLabel(item.employees?.shift || ''),
        'Motivo': getReasonLabel(item.reason),
        'Observações': item.observations || 'Sem observações',
        'Data do Registro': format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      })) || [];
    }
  };

  const handleExport = async () => {
    if (!exportAllEmployees && !selectedEmployeeId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um funcionário ou marque 'Todos os funcionários'.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let data;
      let filename;
      let headers;
      let employee = null;

      if (exportAllEmployees) {
        data = await fetchReportData();
        const period = startDate && endDate 
          ? `${format(startDate, 'dd-MM-yyyy')}_a_${format(endDate, 'dd-MM-yyyy')}`
          : 'completo';
        filename = reportType === 'ft' 
          ? `folgas_trabalhadas_todos_${period}`
          : `faltas_todos_${period}`;
      } else {
        employee = employees.find(emp => emp.id === selectedEmployeeId);
        if (!employee) {
          throw new Error('Funcionário não encontrado');
        }
        data = await fetchReportData(selectedEmployeeId);
        const period = startDate && endDate 
          ? `${format(startDate, 'dd-MM-yyyy')}_a_${format(endDate, 'dd-MM-yyyy')}`
          : '';
        filename = reportType === 'ft'
          ? `folgas_trabalhadas_${employee.first_name}_${employee.last_name}${period ? '_' + period : ''}`
          : `faltas_${employee.first_name}_${employee.last_name}${period ? '_' + period : ''}`;
      }

      headers = reportType === 'ft'
        ? ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Condomínio', 'Endereço', 'Turno', 'Valor', 'Observações', 'Data do Registro']
        : ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Condomínio', 'Endereço', 'Turno', 'Motivo', 'Observações', 'Data do Registro'];

      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há registros para o período selecionado.",
        });
        return;
      }

      if (exportFormat === 'pdf') {
        await downloadPDF(data, headers, filename, employee);
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
    const shifts: Record<string, string> = {
      manha: 'Manhã',
      tarde: 'Tarde', 
      noite: 'Noite',
      madrugada: 'Madrugada'
    };
    return shifts[shift] || shift || 'Não informado';
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
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
    // Calcular valor total para relatório de FT
    let totalValue = 0;
    if (reportType === 'ft') {
      totalValue = data.reduce((sum, row) => {
        const valorStr = row['Valor'] || '';
        const match = valorStr.match(/R\$\s*([\d.,]+)/);
        if (match) {
          const value = parseFloat(match[1].replace(',', '.'));
          return sum + (isNaN(value) ? 0 : value);
        }
        return sum;
      }, 0);
    }

    // Adicionar informações do período no início
    const periodInfo = startDate && endDate
      ? `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`
      : 'Período: Todos os registros';

    const reportTitle = reportType === 'ft' ? 'Relatório de Folgas Trabalhadas' : 'Relatório de Faltas';
    const generatedAt = `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;

    // Agrupar dados por funcionário e adicionar subtotal + linha em branco entre cada um
    const groupedData: any[][] = [];
    let currentEmployee = '';
    let employeeRecords: any[] = [];
    
    const addEmployeeSubtotal = () => {
      if (employeeRecords.length > 0 && reportType === 'ft') {
        // Calcular subtotal do funcionário
        const subtotal = employeeRecords.reduce((sum, row) => {
          const valorStr = row['Valor'] || '';
          const match = valorStr.match(/R\$\s*([\d.,]+)/);
          if (match) {
            const value = parseFloat(match[1].replace(',', '.'));
            return sum + (isNaN(value) ? 0 : value);
          }
          return sum;
        }, 0);
        
        // Adicionar linha de subtotal
        const subtotalRow = headers.map((header, idx) => {
          if (header === 'Nome') return `Subtotal: ${currentEmployee}`;
          if (header === 'Valor') return `R$ ${subtotal.toFixed(2)}`;
          if (header === 'Data') return `${employeeRecords.length} registro(s)`;
          return '';
        });
        groupedData.push(subtotalRow);
      }
    };
    
    data.forEach((row) => {
      const employeeName = row['Nome'];
      
      // Se mudou de funcionário
      if (employeeName !== currentEmployee) {
        // Adicionar subtotal do funcionário anterior (se houver)
        addEmployeeSubtotal();
        
        // Adicionar linha em branco entre funcionários (se não for o primeiro)
        if (currentEmployee !== '') {
          groupedData.push(headers.map(() => '')); // Linha em branco
        }
        
        currentEmployee = employeeName;
        employeeRecords = [];
      }
      
      groupedData.push(headers.map(header => row[header] || ''));
      employeeRecords.push(row);
    });
    
    // Adicionar subtotal do último funcionário
    addEmployeeSubtotal();

    // Criar worksheet com os dados
    const worksheetData = [
      [reportTitle],
      [periodInfo],
      [generatedAt],
      [], // Linha vazia
      headers,
      ...groupedData
    ];

    // Adicionar linha de total para FT
    if (reportType === 'ft') {
      worksheetData.push([]); // Linha vazia
      worksheetData.push(['', '', '', '', '', '', '', `VALOR TOTAL: R$ ${totalValue.toFixed(2)}`, '', '']);
      worksheetData.push([`Total de Registros: ${data.length}`, '', '', '', '', '', '', '', '', '']);
    } else {
      worksheetData.push([]); // Linha vazia
      worksheetData.push([`Total de Registros: ${data.length}`, '', '', '', '', '', '', '', '', '']);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Calcular largura automática das colunas considerando todos os dados
    const colWidths = headers.map((header, colIndex) => {
      const headerLength = header.length;
      const dataLengths = worksheetData.slice(4).map(row => String(row[colIndex] || '').length);
      const maxDataLength = Math.max(...dataLengths, 0);
      return { wch: Math.max(headerLength, maxDataLength, 12) + 4 };
    });
    worksheet['!cols'] = colWidths;

    // Mesclar células do título
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
    ];

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
      // Usar orientação padrão (portrait) para PDF
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
            // Adicionar logo no canto superior direito
            doc.addImage(base64, 'PNG', 168, 6, 30, 30);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (logoError) {
        console.warn('Não foi possível carregar o logotipo:', logoError);
      }
      
      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Relatório de ${reportType === 'ft' ? 'Folgas Trabalhadas' : 'Faltas'}`, 20, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      let currentY = 32;

      // Período
      if (startDate && endDate) {
        doc.text(`Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`, 20, currentY);
        currentY += 7;
      }

      // Informações do funcionário ou indicação de todos
      if (employee) {
        doc.text(`Funcionário: ${employee.first_name} ${employee.last_name}`, 20, currentY);
        currentY += 5;
        doc.text(`Cargo: ${employee.positions?.title || 'Não informado'}`, 20, currentY);
        currentY += 5;
        doc.text(`Local: ${employee.condominiums?.name || 'Não informado'}`, 20, currentY);
        currentY += 5;
      } else {
        doc.text(`Escopo: Todos os funcionários`, 20, currentY);
        currentY += 5;
      }
      
      doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, currentY);
      currentY += 10;

      // Tabela com colunas otimizadas para PDF portrait
      // Usar colunas reduzidas para caber em portrait
      const pdfHeaders = ['Data', 'Nome', 'Cargo', 'Condomínio', reportType === 'ft' ? 'Valor' : 'Motivo', 'Observações'];
      const pdfData = data.map(row => [
        row['Data'],
        row['Nome'],
        row['Cargo'],
        row['Condomínio'],
        reportType === 'ft' ? row['Valor'] : row['Motivo'],
        row['Observações']
      ]);

      autoTable(doc, {
        head: [pdfHeaders],
        body: pdfData,
        startY: currentY,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: reportType === 'absences' ? [220, 53, 69] : [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Data
          1: { cellWidth: 35 }, // Nome
          2: { cellWidth: 25 }, // Cargo
          3: { cellWidth: 35 }, // Condomínio
          4: { cellWidth: 25 }, // Valor/Motivo
          5: { cellWidth: 40 }, // Observações
        },
      });

      // Adicionar totais no final
      const finalY = (doc as any).lastAutoTable?.finalY || currentY + 50;

      if (reportType === 'ft') {
        const totalValue = data.reduce((sum, row) => {
          const valorStr = row['Valor'] || '';
          const match = valorStr.match(/R\$\s*([\d.,]+)/);
          if (match) {
            const value = parseFloat(match[1].replace(',', '.'));
            return sum + (isNaN(value) ? 0 : value);
          }
          return sum;
        }, 0);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 20, finalY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de Registros: ${data.length}`, 20, finalY + 18);
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total de Registros: ${data.length}`, 20, finalY + 10);
      }

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
                Gere relatórios detalhados com filtros personalizados
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
            <Label className="text-base font-medium flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Período do Relatório
            </Label>
            
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={periodFilter === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodFilter('month')}
              >
                Mês Atual
              </Button>
              <Button
                type="button"
                variant={periodFilter === 'lastMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodFilter('lastMonth')}
              >
                Mês Anterior
              </Button>
              <Button
                type="button"
                variant={periodFilter === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodFilter('custom')}
              >
                Personalizado
              </Button>
            </div>

            {periodFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {startDate && endDate && (
              <Badge variant="secondary" className="text-xs">
                {format(startDate, 'dd/MM/yyyy')} até {format(endDate, 'dd/MM/yyyy')}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Seleção de Funcionário */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Selecionar Funcionário</Label>
            
            <div className="flex items-center space-x-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
              <Checkbox 
                id="all-employees" 
                checked={exportAllEmployees}
                onCheckedChange={(checked) => {
                  setExportAllEmployees(checked as boolean);
                  if (checked) {
                    setSelectedEmployeeId('');
                  }
                }}
              />
              <label 
                htmlFor="all-employees" 
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                <Users className="h-4 w-4 text-accent" />
                Exportar todos os funcionários
              </label>
            </div>

            {!exportAllEmployees && (
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
            )}
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
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
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
            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
              <p>• Data</p>
              <p>• Nome</p>
              <p>• Cargo</p>
              <p>• Supervisor(a)</p>
              <p>• Condomínio</p>
              <p>• Endereço</p>
              <p>• Turno</p>
              {reportType === 'ft' ? <p>• Valor</p> : <p>• Motivo</p>}
              <p>• Observações</p>
              <p>• Data do Registro</p>
            </div>
            {reportType === 'ft' && (
              <p className="text-xs text-accent mt-2 font-medium">
                * Inclui valor total e contagem de registros
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleExport} variant="default" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? "Exportando..." : exportAllEmployees ? "Exportar Todos" : "Exportar Relatório"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
