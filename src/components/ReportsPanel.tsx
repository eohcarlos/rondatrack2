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
          location,
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
        'Local da FT': item.location || 'Não informado',
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
        ? ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Condomínio', 'Endereço', 'Turno', 'Local da FT', 'Valor', 'Observações', 'Data do Registro']
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
      noite: 'Noite'
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

    // Ordenar dados por nome do funcionário
    const sortedData = [...data].sort((a, b) => {
      const nameA = a['Nome'] || '';
      const nameB = b['Nome'] || '';
      return nameA.localeCompare(nameB, 'pt-BR');
    });

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
        const subtotalRow = headers.map((header) => {
          if (header === 'Nome') return `Subtotal: ${currentEmployee}`;
          if (header === 'Valor') return `R$ ${subtotal.toFixed(2)}`;
          return '';
        });
        groupedData.push(subtotalRow);
      }
    };
    
    sortedData.forEach((row) => {
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
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Carregar logo
      try {
        const logoUrl = '/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png';
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            doc.addImage(base64, 'PNG', pageWidth - 40, 5, 28, 28);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Logo nao carregado:', e);
      }

      // Cabecalho
      const accentColor = reportType === 'ft' ? [59, 130, 246] : [220, 53, 69];
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(14, 8, 4, 22, 'F');

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(reportType === 'ft' ? 'Relatorio de Folgas Trabalhadas' : 'Relatorio de Faltas', 22, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      let infoLine = '';
      if (startDate && endDate) {
        infoLine += `Periodo: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`;
      }
      infoLine += `    Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;
      if (employee) {
        infoLine += `    Funcionario: ${employee.first_name} ${employee.last_name}`;
      }
      doc.text(infoLine, 22, 26);

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, 34, pageWidth - 14, 34);

      let currentY = 38;

      // Ordenar por nome
      const sortedData = [...data].sort((a, b) => 
        (a['Nome'] || '').localeCompare(b['Nome'] || '', 'pt-BR')
      );

      // Agrupar por funcionario
      const grouped: Record<string, any[]> = {};
      sortedData.forEach(row => {
        const name = row['Nome'] || 'Sem nome';
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(row);
      });

      const employeeNames = Object.keys(grouped);
      let grandTotal = 0;
      let grandCount = 0;

      // Definir colunas para o PDF
      const colDefs = reportType === 'ft'
        ? [
            { header: 'Data', key: 'Data', width: 22 },
            { header: 'Cargo', key: 'Cargo', width: 28 },
            { header: 'Condominio', key: 'Condomínio', width: 35 },
            { header: 'Turno', key: 'Turno', width: 18 },
            { header: 'Local FT', key: 'Local da FT', width: 32 },
            { header: 'Supervisor', key: 'Supervisor(a)', width: 30 },
            { header: 'Valor (R$)', key: 'Valor', width: 22 },
            { header: 'Observacoes', key: 'Observações', width: 'auto' as any },
          ]
        : [
            { header: 'Data', key: 'Data', width: 22 },
            { header: 'Cargo', key: 'Cargo', width: 28 },
            { header: 'Condominio', key: 'Condomínio', width: 35 },
            { header: 'Turno', key: 'Turno', width: 18 },
            { header: 'Supervisor', key: 'Supervisor(a)', width: 30 },
            { header: 'Motivo', key: 'Motivo', width: 28 },
            { header: 'Observacoes', key: 'Observações', width: 'auto' as any },
          ];

      // Calcular largura auto
      const fixedWidth = colDefs.reduce((s, c) => s + (typeof c.width === 'number' ? c.width : 0), 0);
      const availableWidth = pageWidth - 28; // margins
      const autoWidth = availableWidth - fixedWidth;
      const finalWidths = colDefs.map(c => typeof c.width === 'number' ? c.width : Math.max(autoWidth, 30));

      employeeNames.forEach((empName, empIndex) => {
        const records = grouped[empName];
        const recordCount = records.length;
        
        // Calcular subtotal
        let subtotal = 0;
        if (reportType === 'ft') {
          subtotal = records.reduce((sum, row) => {
            const valorStr = row['Valor'] || '';
            const match = valorStr.match(/R\$\s*([\d.,]+)/);
            if (match) {
              const value = parseFloat(match[1].replace(',', '.'));
              return sum + (isNaN(value) ? 0 : value);
            }
            return sum;
          }, 0);
          grandTotal += subtotal;
        }
        grandCount += recordCount;

        // Estimar espaco necessario: header(8) + rows(5.5 each) + subtotal(8) + spacing(6)
        const neededSpace = 8 + (recordCount * 5.5) + 8 + 6;
        if (currentY + neededSpace > pageHeight - 20 && currentY > 40) {
          doc.addPage();
          currentY = 16;
        }

        // Nome do funcionario como header do grupo
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(14, currentY - 1, pageWidth - 28, 7, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${empName}  -  ${recordCount} registro${recordCount > 1 ? 's' : ''}`, 17, currentY + 4);
        currentY += 9;

        // Tabela do funcionario
        const tableHeaders = colDefs.map(c => c.header);
        const tableData = records.map(row => 
          colDefs.map(c => {
            let val = row[c.key] || '-';
            // Limpar simbolos do valor
            if (c.key === 'Valor') {
              val = val.replace('R$ ', '').replace('R$', '').trim();
              if (val === 'Nao informado') val = '-';
            }
            if (val === 'Sem observacoes' || val === 'Sem observações') val = '-';
            if (val === 'Nao informado' || val === 'Não informado') val = '-';
            return val;
          })
        );

        const columnStyles: Record<number, any> = {};
        finalWidths.forEach((w, i) => {
          columnStyles[i] = { cellWidth: w };
        });

        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY: currentY,
          margin: { left: 14, right: 14 },
          styles: {
            fontSize: 7,
            cellPadding: 1.5,
            lineColor: [220, 220, 220],
            lineWidth: 0.2,
            textColor: [40, 40, 40],
            overflow: 'ellipsize',
          },
          headStyles: {
            fillColor: [240, 242, 245],
            textColor: [60, 60, 60],
            fontStyle: 'bold',
            fontSize: 7,
            lineWidth: 0.2,
            lineColor: [200, 200, 200],
          },
          alternateRowStyles: {
            fillColor: [250, 250, 252],
          },
          columnStyles,
          tableLineColor: [220, 220, 220],
          tableLineWidth: 0.2,
        });

        currentY = (doc as any).lastAutoTable?.finalY || currentY + 20;

        // Subtotal do funcionario
        if (reportType === 'ft') {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, currentY, pageWidth - 28, 7, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text(`Subtotal ${empName}: R$ ${subtotal.toFixed(2).replace('.', ',')}  |  ${recordCount} FT${recordCount > 1 ? 's' : ''}`, 17, currentY + 4.5);
        } else {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, currentY, pageWidth - 28, 7, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text(`Subtotal ${empName}: ${recordCount} falta${recordCount > 1 ? 's' : ''}`, 17, currentY + 4.5);
        }
        currentY += 7;

        // Espaco entre funcionarios
        if (empIndex < employeeNames.length - 1) {
          currentY += 4;
        }
      });

      // Total geral
      if (currentY + 16 > pageHeight - 10) {
        doc.addPage();
        currentY = 16;
      }

      currentY += 4;
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.8);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 6;

      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(14, currentY - 2, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);

      if (reportType === 'ft') {
        doc.text(`TOTAL GERAL: R$ ${grandTotal.toFixed(2).replace('.', ',')}   |   ${grandCount} registros   |   ${employeeNames.length} funcionario${employeeNames.length > 1 ? 's' : ''}`, 20, currentY + 5);
      } else {
        doc.text(`TOTAL GERAL: ${grandCount} faltas   |   ${employeeNames.length} funcionario${employeeNames.length > 1 ? 's' : ''}`, 20, currentY + 5);
      }

      // Rodape em todas as paginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text(`RondaTrack - Pagina ${i} de ${totalPages}`, 14, pageHeight - 6);
        doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - 45, pageHeight - 6);
      }

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar arquivo PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 shadow-2xl shadow-purple-500/20">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-4 ring-white/20">
              <Download className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Exportar Relatórios
              </h2>
              <p className="text-white/70 text-sm sm:text-base">Gere relatórios detalhados com filtros</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-xl rounded-3xl bg-card">
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
    </div>
  );
};
