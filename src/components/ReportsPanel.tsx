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
import { exportStyledExcel, type StyledRow } from '@/lib/excelExport';
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
        'Contrato': item.employees?.condominiums?.name || '',
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
        'Contrato': item.employees?.condominiums?.name || '',
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
        ? ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Contrato', 'Endereço', 'Turno', 'Local da FT', 'Valor', 'Observações', 'Data do Registro']
        : ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Contrato', 'Endereço', 'Turno', 'Motivo', 'Observações', 'Data do Registro'];

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

      // Paleta premium
      const isFT = reportType === 'ft';
      const brand: [number, number, number] = isFT ? [79, 70, 229] : [225, 29, 72];      // indigo / rose
      const brandDark: [number, number, number] = isFT ? [49, 46, 129] : [136, 19, 55];
      const accent: [number, number, number] = isFT ? [139, 92, 246] : [251, 113, 133]; // violet / pink
      const ink: [number, number, number] = [17, 24, 39];
      const sub: [number, number, number] = [107, 114, 128];
      const soft: [number, number, number] = [243, 244, 246];
      const line: [number, number, number] = [229, 231, 235];

      // Tentar logo
      let logoBase64: string | null = null;
      try {
        const logoUrl = '/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png';
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
      } catch (e) { /* logo opcional */ }

      // ---------- Pré-cálculos ----------
      const sortedData = [...data].sort((a, b) =>
        (a['Nome'] || '').localeCompare(b['Nome'] || '', 'pt-BR')
      );
      const grouped: Record<string, any[]> = {};
      sortedData.forEach(row => {
        const name = row['Nome'] || 'Sem nome';
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(row);
      });
      const employeeNames = Object.keys(grouped);

      let grandTotal = 0;
      let grandCount = 0;
      const subtotals: Record<string, number> = {};
      employeeNames.forEach(name => {
        const records = grouped[name];
        grandCount += records.length;
        if (isFT) {
          const sub = records.reduce((s, row) => {
            const m = (row['Valor'] || '').match(/R\$\s*([\d.,]+)/);
            if (m) {
              const v = parseFloat(m[1].replace(',', '.'));
              return s + (isNaN(v) ? 0 : v);
            }
            return s;
          }, 0);
          subtotals[name] = sub;
          grandTotal += sub;
        }
      });

      // ---------- Helpers ----------
      const drawGradientBar = (x: number, y: number, w: number, h: number, c1: number[], c2: number[]) => {
        const steps = 60;
        for (let i = 0; i < steps; i++) {
          const t = i / (steps - 1);
          const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
          const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
          const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
          doc.setFillColor(r, g, b);
          doc.rect(x + (w / steps) * i, y, w / steps + 0.5, h, 'F');
        }
      };

      const drawHeader = () => {
        // Faixa superior gradiente
        drawGradientBar(0, 0, pageWidth, 16, brand, accent);
        // Marca / título no topo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('RONDATRACK 2', 14, 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(isFT ? 'Folgas Trabalhadas' : 'Registro de Faltas', pageWidth - 14, 10, { align: 'right' });
      };

      const drawFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(line[0], line[1], line[2]);
        doc.setLineWidth(0.2);
        doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(sub[0], sub[1], sub[2]);
        doc.text('RondaTrack 2  ·  Relatório confidencial', 14, pageHeight - 5);
        doc.text(format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }), pageWidth / 2, pageHeight - 5, { align: 'center' });
        doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
      };

      // ---------- CAPA ----------
      // Fundo gradiente suave
      drawGradientBar(0, 0, pageWidth, pageHeight, brand, brandDark);
      // Overlay decorativo (círculos translúcidos via cinza)
      doc.setFillColor(255, 255, 255);
      doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
      doc.circle(pageWidth - 30, 30, 50, 'F');
      doc.circle(40, pageHeight - 30, 70, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));

      // Logo
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', 24, 24, 22, 22); } catch {}
      }

      // Tag
      doc.setFillColor(255, 255, 255);
      doc.setGState(new (doc as any).GState({ opacity: 0.18 }));
      doc.roundedRect(24, 56, 60, 9, 4, 4, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(isFT ? 'RELATÓRIO DE FOLGAS TRABALHADAS' : 'RELATÓRIO DE FALTAS', 28, 62);

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(34);
      doc.setTextColor(255, 255, 255);
      doc.text(isFT ? 'Folgas Trabalhadas' : 'Faltas Registradas', 24, 88);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      const periodText = startDate && endDate
        ? `${format(startDate, "dd 'de' MMMM", { locale: ptBR })} a ${format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
        : 'Todos os registros';
      doc.text(periodText, 24, 98);

      // Cards de resumo na capa
      const cardY = 115;
      const cardH = 32;
      const gap = 6;
      const cardW = (pageWidth - 48 - gap * 2) / 3;

      const drawSummaryCard = (x: number, label: string, value: string, sublabel?: string) => {
        doc.setFillColor(255, 255, 255);
        doc.setGState(new (doc as any).GState({ opacity: 0.95 }));
        doc.roundedRect(x, cardY, cardW, cardH, 4, 4, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(sub[0], sub[1], sub[2]);
        doc.text(label.toUpperCase(), x + 6, cardY + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(brand[0], brand[1], brand[2]);
        doc.text(value, x + 6, cardY + 20);
        if (sublabel) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(sub[0], sub[1], sub[2]);
          doc.text(sublabel, x + 6, cardY + 27);
        }
      };

      drawSummaryCard(24, 'Registros', String(grandCount), `${employeeNames.length} funcionário${employeeNames.length !== 1 ? 's' : ''}`);
      drawSummaryCard(24 + cardW + gap, isFT ? 'Valor total' : 'Período', isFT ? `R$ ${grandTotal.toFixed(2).replace('.', ',')}` : `${employeeNames.length}`, isFT ? 'Soma do período' : 'Funcionário(s) com faltas');
      drawSummaryCard(24 + (cardW + gap) * 2, 'Funcionários', String(employeeNames.length), employee ? `${employee.first_name} ${employee.last_name}` : 'Todos');

      // Rodapé da capa
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 24, pageHeight - 16);
      doc.text('RondaTrack 2', pageWidth - 24, pageHeight - 16, { align: 'right' });

      // ---------- PÁGINAS DE DADOS ----------
      doc.addPage();
      drawHeader();
      let currentY = 26;

      // Subtítulo de seção
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text('Detalhamento por funcionário', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(sub[0], sub[1], sub[2]);
      doc.text(periodText, 14, currentY + 5);
      currentY += 12;

      // Definir colunas
      const colDefs = isFT
        ? [
            { header: 'Data', key: 'Data', width: 22 },
            { header: 'Cargo', key: 'Cargo', width: 28 },
            { header: 'Contrato', key: 'Contrato', width: 35 },
            { header: 'Turno', key: 'Turno', width: 18 },
            { header: 'Local FT', key: 'Local da FT', width: 32 },
            { header: 'Supervisor', key: 'Supervisor(a)', width: 30 },
            { header: 'Valor (R$)', key: 'Valor', width: 22 },
            { header: 'Observações', key: 'Observações', width: 'auto' as any },
          ]
        : [
            { header: 'Data', key: 'Data', width: 22 },
            { header: 'Cargo', key: 'Cargo', width: 28 },
            { header: 'Contrato', key: 'Contrato', width: 35 },
            { header: 'Turno', key: 'Turno', width: 18 },
            { header: 'Supervisor', key: 'Supervisor(a)', width: 30 },
            { header: 'Motivo', key: 'Motivo', width: 28 },
            { header: 'Observações', key: 'Observações', width: 'auto' as any },
          ];

      const fixedWidth = colDefs.reduce((s, c) => s + (typeof c.width === 'number' ? c.width : 0), 0);
      const availableWidth = pageWidth - 28;
      const autoWidth = availableWidth - fixedWidth;
      const finalWidths = colDefs.map(c => typeof c.width === 'number' ? c.width : Math.max(autoWidth, 30));

      employeeNames.forEach((empName, empIndex) => {
        const records = grouped[empName];
        const recordCount = records.length;
        const subtotal = subtotals[empName] || 0;

        const neededSpace = 14 + (recordCount * 6) + 10 + 8;
        if (currentY + neededSpace > pageHeight - 18 && currentY > 30) {
          doc.addPage();
          drawHeader();
          currentY = 26;
        }

        // Cabeçalho do grupo: card com nome + iniciais
        const groupH = 12;
        // Sombra fake
        doc.setFillColor(brand[0], brand[1], brand[2]);
        doc.roundedRect(14, currentY, pageWidth - 28, groupH, 3, 3, 'F');

        // Iniciais avatar
        const initials = empName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
        doc.setFillColor(255, 255, 255);
        doc.setGState(new (doc as any).GState({ opacity: 0.22 }));
        doc.circle(22, currentY + 6, 3.6, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(initials || '?', 22, currentY + 7.2, { align: 'center' });

        // Nome
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(empName, 28, currentY + 7.5);

        // Badge contagem
        const countLabel = `${recordCount} ${isFT ? 'FT' : 'falta'}${recordCount > 1 ? 's' : ''}`;
        const badgeW = doc.getTextWidth(countLabel) + 8;
        doc.setFillColor(255, 255, 255);
        doc.setGState(new (doc as any).GState({ opacity: 0.22 }));
        doc.roundedRect(pageWidth - 14 - badgeW - (isFT ? 42 : 0), currentY + 3, badgeW, 6, 2.5, 2.5, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(countLabel, pageWidth - 14 - badgeW / 2 - (isFT ? 42 : 0), currentY + 7, { align: 'center' });

        if (isFT) {
          const valLabel = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
          const vW = doc.getTextWidth(valLabel) + 8;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(pageWidth - 14 - vW, currentY + 3, vW, 6, 2.5, 2.5, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(brand[0], brand[1], brand[2]);
          doc.text(valLabel, pageWidth - 14 - vW / 2, currentY + 7, { align: 'center' });
        }

        currentY += groupH + 1.5;

        // Tabela
        const tableHeaders = colDefs.map(c => c.header);
        const tableData = records.map(row =>
          colDefs.map(c => {
            let val = row[c.key] || '-';
            if (c.key === 'Valor') {
              val = String(val).replace('R$ ', '').replace('R$', '').trim();
              if (val === 'Nao informado' || val === 'Não informado') val = '-';
            }
            if (val === 'Sem observacoes' || val === 'Sem observações') val = '-';
            if (val === 'Nao informado' || val === 'Não informado') val = '-';
            return val;
          })
        );

        const columnStyles: Record<number, any> = {};
        finalWidths.forEach((w, i) => {
          columnStyles[i] = { cellWidth: w };
          if (colDefs[i].key === 'Valor') columnStyles[i].halign = 'right';
        });

        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY: currentY,
          margin: { left: 14, right: 14 },
          styles: {
            fontSize: 7.5,
            cellPadding: 2.2,
            lineColor: line,
            lineWidth: 0.15,
            textColor: ink,
            overflow: 'linebreak',
            valign: 'middle',
          },
          headStyles: {
            fillColor: soft,
            textColor: sub,
            fontStyle: 'bold',
            fontSize: 7,
            lineWidth: 0.15,
            lineColor: line,
            cellPadding: 2.5,
          },
          alternateRowStyles: {
            fillColor: [250, 250, 252],
          },
          columnStyles,
          tableLineColor: line,
          tableLineWidth: 0.15,
          didDrawPage: () => {
            // Quando autoTable pula página, redesenha o header
            const pageNumber = (doc as any).internal.getNumberOfPages();
            if (pageNumber > 2) {
              const cur = doc.getCurrentPageInfo().pageNumber;
              if (cur > 2) {
                drawHeader();
              }
            }
          },
        });

        currentY = (doc as any).lastAutoTable?.finalY || currentY + 20;
        currentY += 4;

        if (empIndex < employeeNames.length - 1) currentY += 2;
      });

      // ---------- TOTAL GERAL ----------
      if (currentY + 26 > pageHeight - 16) {
        doc.addPage();
        drawHeader();
        currentY = 30;
      }

      currentY += 4;
      const totalH = 22;
      drawGradientBar(14, currentY, pageWidth - 28, totalH, brand, accent);
      doc.setFillColor(255, 255, 255);
      doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
      doc.circle(pageWidth - 30, currentY + totalH / 2, 18, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL GERAL', 22, currentY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      if (isFT) {
        doc.text(`R$ ${grandTotal.toFixed(2).replace('.', ',')}`, 22, currentY + 17);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${grandCount} registros · ${employeeNames.length} funcionário${employeeNames.length > 1 ? 's' : ''}`, pageWidth - 22, currentY + 13, { align: 'right' });
      } else {
        doc.text(`${grandCount} faltas`, 22, currentY + 17);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${employeeNames.length} funcionário${employeeNames.length > 1 ? 's' : ''}`, pageWidth - 22, currentY + 13, { align: 'right' });
      }

      // ---------- Footer em todas as páginas (exceto capa) ----------
      const totalPages = doc.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i - 1, totalPages - 1);
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
              <p>• Contrato</p>
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
