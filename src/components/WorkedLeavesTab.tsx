import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, User, MapPin, Eye, DollarSign, Download, Clock, Briefcase, MessageSquare, Sparkles, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import { WorkedLeaveDetailsModal } from './WorkedLeaveDetailsModal';
import { WorkedLeaveForm, WorkedLeaveEditData } from './WorkedLeaveForm';
import { getCurrentCompanyId } from '@/lib/company';
import * as XLSX from 'xlsx';

interface WorkedLeave {
  id: string;
  date: string;
  observations: string | null;
  amount: number | null;
  work_shift: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  created_at: string;
  employee_id: string;
  supervisor_id: string;
  employees: {
    id: string;
    first_name: string;
    last_name: string;
    positions: { title: string };
    condominiums: { name: string };
    shift: string;
  };
  supervisor: {
    name: string;
  };
}

// Memoized helper functions
const getShiftLabel = (shift: string) => {
  const labels: Record<string, string> = {
    'manha': 'Manhã',
    'noite': 'Noite'
  };
  return labels[shift] || shift;
};

const getShiftColor = (shift: string) => {
  const colors: Record<string, string> = {
    'manha': 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-400/25',
    'noite': 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
  };
  return colors[shift] || 'bg-muted text-muted-foreground';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

// Premium card component - mobile optimized
const WorkedLeaveCard = memo(({ 
  item, 
  onViewDetails,
  onEdit,
  onDelete,
}: { 
  item: WorkedLeave; 
  onViewDetails: (item: WorkedLeave) => void;
  onEdit: (item: WorkedLeave) => void;
  onDelete: (item: WorkedLeave) => void;
}) => (
  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    {/* Gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {/* Decorative accent */}
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
    
    <CardContent className="relative p-4 pl-5">
      {/* Header - stack on mobile */}
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <span className="text-sm font-bold text-white">
              {item.employees.first_name.charAt(0)}{item.employees.last_name?.charAt(0) || ''}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
              {item.employees.first_name} {item.employees.last_name}
            </p>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 truncate">
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.employees.positions?.title || 'Sem cargo'}</span>
            </p>
          </div>
          <Badge className={`${getShiftColor(item.employees.shift)} shrink-0 px-2 py-0.5 text-[10px] font-semibold border-0`}>
            {getShiftLabel(item.employees.shift)}
          </Badge>
        </div>
      </div>

      {/* Info grid - optimized for mobile */}
      <div className="space-y-2 mb-3">
        {/* Location - where the FT was done */}
        {item.location && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium block">Local da FT</span>
              <span className="text-xs font-medium text-foreground truncate block">{item.location}</span>
            </div>
          </div>
        )}

        {/* Original condominium */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground truncate">{item.employees.condominiums?.name || 'N/A'}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Calendar className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-xs font-medium truncate">{formatDate(item.date)}</span>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">
              {item.amount ? `R$ ${Number(item.amount).toFixed(0)}` : '-'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground truncate">{item.supervisor?.name || 'N/A'}</span>
        </div>
      </div>

      {/* Observations */}
      {item.observations && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg mb-3 border border-border/50">
          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
          <span className="line-clamp-2">{item.observations}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-9 text-xs bg-background/50 backdrop-blur-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300"
          onClick={() => onViewDetails(item)}
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          Detalhes
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3 text-xs bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3 text-xs bg-background/50 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

WorkedLeaveCard.displayName = 'WorkedLeaveCard';

export const WorkedLeavesTab = memo(() => {
  const [workedLeaves, setWorkedLeaves] = useState<WorkedLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondominium, setSelectedCondominium] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('');
  const [condominiums, setCondominiums] = useState<{id: string, name: string}[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedWorkedLeave, setSelectedWorkedLeave] = useState<WorkedLeave | null>(null);
  const [showWorkedLeaveModal, setShowWorkedLeaveModal] = useState(false);
  const [showNewFTDialog, setShowNewFTDialog] = useState(false);
  const [editingFT, setEditingFT] = useState<WorkedLeaveEditData | null>(null);
  const [deletingFT, setDeletingFT] = useState<WorkedLeave | null>(null);
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadData = useCallback(async () => {
    const companyId = getCurrentCompanyId();
    if (!companyId) return;

    try {
      const [workedLeavesResult, condominiumsResult] = await Promise.all([
        supabase
          .from('worked_leaves')
          .select(`
            *,
            employees!inner(
              id, first_name, last_name, shift,
              positions(title),
              condominiums(name)
            ),
            supervisor:profiles!supervisor_id(name)
          `)
          .eq('company_id', companyId)
          .order('date', { ascending: false }),
        supabase
          .from('condominiums')
          .select('id, name')
          .eq('company_id', companyId)
          .order('name')
      ]);

      if (!mountedRef.current) return;

      if (workedLeavesResult.error) throw workedLeavesResult.error;
      if (condominiumsResult.error) throw condominiumsResult.error;

      setWorkedLeaves(workedLeavesResult.data || []);
      setCondominiums(condominiumsResult.data || []);
    } catch (error: any) {
      if (mountedRef.current) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  // Debounced reload
  const debouncedReload = useCallback(() => {
    const timeoutId = setTimeout(loadData, 300);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    channelRef.current = supabase
      .channel('worked-leaves-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worked_leaves' }, debouncedReload)
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [loadData, debouncedReload]);

  // Memoized filtered data
  const filteredWorkedLeaves = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return workedLeaves.filter(item => {
      const matchesSearch = !searchTerm ||
        item.employees.first_name.toLowerCase().includes(searchLower) ||
        item.employees.last_name.toLowerCase().includes(searchLower) ||
        item.employees.positions?.title?.toLowerCase().includes(searchLower) ||
        item.employees.condominiums?.name?.toLowerCase().includes(searchLower);

      const matchesCondominium = !selectedCondominium || selectedCondominium === 'all' || 
        item.employees.condominiums?.name === selectedCondominium;

      const matchesEmployee = !selectedEmployeeFilter || selectedEmployeeFilter === 'all' ||
        `${item.employees.first_name} ${item.employees.last_name}` === selectedEmployeeFilter;

      return matchesSearch && matchesCondominium && matchesEmployee;
    });
  }, [workedLeaves, searchTerm, selectedCondominium, selectedEmployeeFilter]);

  // Memoized month filters - using string parsing to avoid timezone issues
  const { currentMonthWorkedLeaves, previousMonthWorkedLeaves, totalCurrentMonth } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const currentMonthData = filteredWorkedLeaves.filter(item => {
      // Parse date string directly to avoid timezone conversion issues
      const [year, month] = item.date.split('-').map(Number);
      return month === currentMonth && year === currentYear;
    });

    const totalValue = currentMonthData.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    return {
      currentMonthWorkedLeaves: currentMonthData,
      previousMonthWorkedLeaves: filteredWorkedLeaves.filter(item => {
        const [year, month] = item.date.split('-').map(Number);
        return month === prevMonth && year === prevYear;
      }),
      totalCurrentMonth: totalValue
    };
  }, [filteredWorkedLeaves]);

  // Group worked leaves by employee
  const groupByEmployee = useCallback((items: WorkedLeave[]) => {
    const grouped: Record<string, { employee: WorkedLeave['employees']; items: WorkedLeave[]; totalAmount: number }> = {};
    
    items.forEach(item => {
      const employeeKey = item.employee_id;
      if (!grouped[employeeKey]) {
        grouped[employeeKey] = {
          employee: item.employees,
          items: [],
          totalAmount: 0
        };
      }
      grouped[employeeKey].items.push(item);
      grouped[employeeKey].totalAmount += item.amount || 0;
    });

    return Object.entries(grouped).sort((a, b) => 
      `${a[1].employee.first_name} ${a[1].employee.last_name}`.localeCompare(
        `${b[1].employee.first_name} ${b[1].employee.last_name}`
      )
    );
  }, []);

  const groupedCurrentMonth = useMemo(() => groupByEmployee(currentMonthWorkedLeaves), [currentMonthWorkedLeaves, groupByEmployee]);
  const groupedPreviousMonth = useMemo(() => groupByEmployee(previousMonthWorkedLeaves), [previousMonthWorkedLeaves, groupByEmployee]);

  // Memoized employee names for filter
  const employeeNames = useMemo(() => 
    [...new Set(workedLeaves.map(item => `${item.employees.first_name} ${item.employees.last_name}`))],
    [workedLeaves]
  );

  // Callbacks
  const handleViewDetails = useCallback((workedLeave: WorkedLeave) => {
    setSelectedWorkedLeave(workedLeave);
    setShowWorkedLeaveModal(true);
  }, []);

  const handleEdit = useCallback((item: WorkedLeave) => {
    setEditingFT({
      id: item.id,
      employee_id: item.employee_id,
      date: item.date,
      supervisor_id: item.supervisor_id,
      observations: item.observations,
      amount: item.amount,
      work_shift: item.work_shift,
      start_time: item.start_time,
      end_time: item.end_time,
      location: item.location,
    });
  }, []);

  const handleDelete = useCallback((item: WorkedLeave) => {
    setDeletingFT(item);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingFT) return;
    try {
      const { error } = await supabase.from('worked_leaves').delete().eq('id', deletingFT.id);
      if (error) throw error;
      toast({ title: "FT excluída", description: "Folga trabalhada excluída com sucesso." });
      loadData();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } finally {
      setDeletingFT(null);
    }
  }, [deletingFT, loadData, toast]);

  const handleCloseWorkedLeaveModal = useCallback(() => {
    setShowWorkedLeaveModal(false);
    setSelectedWorkedLeave(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowEmployeeModal(false);
    setSelectedEmployeeId(null);
  }, []);

  const exportToExcel = useCallback(() => {
    try {
      const dataToExport = filteredWorkedLeaves.map(item => ({
        'Data': formatDate(item.date),
        'Nome': `${item.employees.first_name} ${item.employees.last_name}`,
        'Cargo': item.employees.positions?.title || 'N/A',
        'Supervisor(a)': item.supervisor?.name || 'N/A',
        'Condomínio': item.employees.condominiums?.name || 'N/A',
        'Valor': item.amount ? `R$ ${Number(item.amount).toFixed(2)}` : 'Não informado',
        'Observações': item.observations || 'Sem observações',
        'Data do Registro': formatDate(item.created_at.split('T')[0])
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Folgas Trabalhadas');

      worksheet['!cols'] = [
        { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 28 },
        { wch: 28 }, { wch: 18 }, { wch: 40 }, { wch: 20 }
      ];

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Relatorio_FT_${today}.xlsx`);

      toast({ title: "Exportação concluída", description: "Relatório em Excel baixado!" });
    } catch (error: any) {
      toast({ title: "Erro ao exportar", description: error.message, variant: "destructive" });
    }
  }, [filteredWorkedLeaves, toast]);

  const exportToCSV = useCallback(() => {
    try {
      const headers = ['Data', 'Nome', 'Cargo', 'Supervisor(a)', 'Condomínio', 'Valor', 'Observações', 'Data do Registro'];
      const dataToExport = filteredWorkedLeaves.map(item => [
        formatDate(item.date),
        `${item.employees.first_name} ${item.employees.last_name}`,
        item.employees.positions?.title || 'N/A',
        item.supervisor?.name || 'N/A',
        item.employees.condominiums?.name || 'N/A',
        item.amount ? `R$ ${Number(item.amount).toFixed(2)}` : 'Não informado',
        item.observations || 'Sem observações',
        formatDate(item.created_at.split('T')[0])
      ]);

      const csvContent = [headers.join(','), ...dataToExport.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Relatorio_FT_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({ title: "Exportação concluída", description: "Relatório em CSV baixado!" });
    } catch (error: any) {
      toast({ title: "Erro ao exportar", description: error.message, variant: "destructive" });
    }
  }, [filteredWorkedLeaves, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Carregando folgas trabalhadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 shadow-2xl shadow-emerald-500/20">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-4 ring-white/20">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                Folgas Trabalhadas
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </h2>
              <p className="text-white/70 text-sm sm:text-base">Acompanhe as FTs dos funcionários</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowNewFTDialog(true)}
            className="bg-white text-emerald-700 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova FT
          </Button>
        </div>

        {/* Stats row inside header */}
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
          <div className="text-center">
            <p className="text-xl sm:text-3xl font-bold text-white">{currentMonthWorkedLeaves.length}</p>
            <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Este Mês</p>
          </div>
          <div className="text-center border-x border-white/20">
            <p className="text-lg sm:text-3xl font-bold text-white">R$ {totalCurrentMonth.toFixed(0)}</p>
            <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Faturamento</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-3xl font-bold text-white">{previousMonthWorkedLeaves.length}</p>
            <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Mês Anterior</p>
          </div>
        </div>
      </div>

      {/* Search and Filters - Premium Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-card border-0 shadow-lg rounded-2xl text-base"
          />
        </div>
        
        <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
          <SelectTrigger className="h-12 bg-card border-0 shadow-lg rounded-2xl">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por condomínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominiums.map((condo) => (
              <SelectItem key={condo.id} value={condo.name}>{condo.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
          <SelectTrigger className="h-12 bg-card border-0 shadow-lg rounded-2xl">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por funcionário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os funcionários</SelectItem>
            {employeeNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month Tabs */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-12 rounded-2xl bg-muted/50 p-1 shadow-lg">
          <TabsTrigger value="current" className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <Calendar className="h-4 w-4 mr-2" />
            Mês Atual ({currentMonthWorkedLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="previous" className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-muted-foreground/80 data-[state=active]:to-muted-foreground data-[state=active]:text-white data-[state=active]:shadow-lg">
            <Calendar className="h-4 w-4 mr-2" />
            Mês Anterior ({previousMonthWorkedLeaves.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-emerald-500/5 overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/5 to-transparent">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Mês Atual
                <div className="h-8 min-w-8 px-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  {currentMonthWorkedLeaves.length}
                </div>
              </CardTitle>
              <CardDescription>Folgas trabalhadas registradas no mês atual</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {currentMonthWorkedLeaves.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhuma folga encontrada no mês atual</p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-3">
                  {groupedCurrentMonth.map(([employeeId, { employee, items, totalAmount }], index) => (
                    <AccordionItem 
                      key={employeeId} 
                      value={employeeId}
                      className="border-0 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <AccordionTrigger className="px-3 sm:px-5 py-3 sm:py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-4 pr-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                              <span className="text-sm sm:text-lg font-bold text-white">
                                {employee.first_name.charAt(0)}{employee.last_name?.charAt(0) || ''}
                              </span>
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-bold text-foreground text-sm sm:text-lg truncate">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                <Briefcase className="h-3 w-3 shrink-0" />
                                <span className="truncate">{employee.positions?.title || 'Sem cargo'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-13 sm:ml-0">
                            <Badge className={`${getShiftColor(employee.shift)} px-2 py-0.5 text-[10px] sm:text-xs font-semibold border-0`}>
                              {getShiftLabel(employee.shift)}
                            </Badge>
                            <div className="text-right">
                              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {totalAmount.toFixed(0)}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{items.length} FT{items.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 sm:px-5 pb-4 sm:pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2">
                          {items.map((item) => (
                            <WorkedLeaveCard key={item.id} item={item} onViewDetails={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previous" className="mt-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                Mês Anterior
                <div className="h-8 min-w-8 px-3 rounded-full bg-muted text-muted-foreground text-sm font-bold flex items-center justify-center">
                  {previousMonthWorkedLeaves.length}
                </div>
              </CardTitle>
              <CardDescription>Folgas trabalhadas registradas no mês anterior</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {previousMonthWorkedLeaves.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhuma folga encontrada no mês anterior</p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-3">
                  {groupedPreviousMonth.map(([employeeId, { employee, items, totalAmount }]) => (
                    <AccordionItem 
                      key={employeeId} 
                      value={employeeId}
                      className="border-0 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden"
                    >
                      <AccordionTrigger className="px-3 sm:px-5 py-3 sm:py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-4 pr-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center shrink-0">
                              <span className="text-sm sm:text-lg font-bold text-muted-foreground">
                                {employee.first_name.charAt(0)}{employee.last_name?.charAt(0) || ''}
                              </span>
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-bold text-foreground text-sm sm:text-lg truncate">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                <Briefcase className="h-3 w-3 shrink-0" />
                                <span className="truncate">{employee.positions?.title || 'Sem cargo'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-13 sm:ml-0">
                            <Badge className={`${getShiftColor(employee.shift)} px-2 py-0.5 text-[10px] sm:text-xs font-semibold border-0`}>
                              {getShiftLabel(employee.shift)}
                            </Badge>
                            <div className="text-right">
                              <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                                R$ {totalAmount.toFixed(0)}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{items.length} FT{items.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 sm:px-5 pb-4 sm:pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2">
                          {items.map((item) => (
                            <WorkedLeaveCard key={item.id} item={item} onViewDetails={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WorkedLeaveDetailsModal
        isOpen={showWorkedLeaveModal}
        onClose={handleCloseWorkedLeaveModal}
        workedLeave={selectedWorkedLeave}
      />

      <EmployeeDetailsModal
        employeeId={selectedEmployeeId}
        isOpen={showEmployeeModal}
        onClose={handleCloseModal}
      />

      <Dialog open={showNewFTDialog} onOpenChange={setShowNewFTDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
          <WorkedLeaveForm 
            onClose={() => setShowNewFTDialog(false)} 
            onSuccess={() => {
              setShowNewFTDialog(false);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingFT} onOpenChange={(open) => { if (!open) setEditingFT(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
          {editingFT && (
            <WorkedLeaveForm 
              editData={editingFT}
              onClose={() => setEditingFT(null)} 
              onSuccess={() => {
                setEditingFT(null);
                loadData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingFT} onOpenChange={(open) => { if (!open) setDeletingFT(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Folga Trabalhada</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta FT de{' '}
              <strong>{deletingFT?.employees.first_name} {deletingFT?.employees.last_name}</strong>
              {deletingFT?.date ? ` do dia ${formatDate(deletingFT.date)}` : ''}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

WorkedLeavesTab.displayName = 'WorkedLeavesTab';