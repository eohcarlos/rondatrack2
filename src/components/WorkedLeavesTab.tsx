import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, User, MapPin, Eye, DollarSign, Download, Clock, Briefcase, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import { getCurrentCompanyId } from '@/lib/company';
import * as XLSX from 'xlsx';

interface WorkedLeave {
  id: string;
  date: string;
  observations: string | null;
  amount: number | null;
  work_shift: string | null;
  created_at: string;
  employee_id: string;
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
    'tarde': 'Tarde', 
    'noite': 'Noite',
    'madrugada': 'Madrugada'
  };
  return labels[shift] || shift;
};

const getShiftColor = (shift: string) => {
  const colors: Record<string, string> = {
    'manha': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'tarde': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'noite': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'madrugada': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  };
  return colors[shift] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

// Memoized card component
const WorkedLeaveCard = memo(({ 
  item, 
  onViewDetails 
}: { 
  item: WorkedLeave; 
  onViewDetails: (id: string) => void;
}) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-4">
      <div className="flex flex-col gap-3">
        {/* Header com nome e turno */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground break-words">
                {item.employees.first_name} {item.employees.last_name}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3 shrink-0" />
                <span className="break-words">{item.employees.positions?.title || 'Sem cargo'}</span>
              </p>
            </div>
          </div>
          <Badge className={`${getShiftColor(item.employees.shift)} shrink-0`}>
            {getShiftLabel(item.employees.shift)}
          </Badge>
        </div>

        {/* Informações */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-words">{item.employees.condominiums?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Data: {formatDate(item.date)}</span>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <User className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-words">Supervisor: {item.supervisor?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
            {item.amount ? (
              <span className="font-medium text-green-700 dark:text-green-400">
                R$ {Number(item.amount).toFixed(2)}
              </span>
            ) : (
              <span className="text-muted-foreground">Não informado</span>
            )}
          </div>
        </div>

        {/* Observações */}
        {item.observations && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-words">{item.observations}</span>
          </div>
        )}

        {/* Ações */}
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-1"
          onClick={() => onViewDetails(item.employees.id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalhes
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

  // Memoized month filters
  const { currentMonthWorkedLeaves, previousMonthWorkedLeaves } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = new Date(currentYear, currentMonth - 1);
    
    return {
      currentMonthWorkedLeaves: filteredWorkedLeaves.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }),
      previousMonthWorkedLeaves: filteredWorkedLeaves.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear();
      })
    };
  }, [filteredWorkedLeaves]);

  // Memoized employee names for filter
  const employeeNames = useMemo(() => 
    [...new Set(workedLeaves.map(item => `${item.employees.first_name} ${item.employees.last_name}`))],
    [workedLeaves]
  );

  // Callbacks
  const handleViewDetails = useCallback((employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setShowEmployeeModal(true);
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
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando folgas trabalhadas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Folgas Trabalhadas
          </h2>
          <p className="text-muted-foreground">Acompanhe as folgas trabalhadas dos funcionários</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
              <Download className="h-4 w-4 mr-2" />
              Baixar em Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
              <Download className="h-4 w-4 mr-2" />
              Baixar em CSV (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
          <SelectTrigger>
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
          <SelectTrigger>
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

      <Card>
        <CardHeader>
          <CardTitle>Mês Atual ({currentMonthWorkedLeaves.length})</CardTitle>
          <CardDescription>Folgas trabalhadas registradas no mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          {currentMonthWorkedLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma folga encontrada no mês atual
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentMonthWorkedLeaves.map((item) => (
                <WorkedLeaveCard key={item.id} item={item} onViewDetails={handleViewDetails} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mês Anterior ({previousMonthWorkedLeaves.length})</CardTitle>
          <CardDescription>Folgas trabalhadas registradas no mês anterior</CardDescription>
        </CardHeader>
        <CardContent>
          {previousMonthWorkedLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma folga encontrada no mês anterior
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previousMonthWorkedLeaves.map((item) => (
                <WorkedLeaveCard key={item.id} item={item} onViewDetails={handleViewDetails} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeDetailsModal
        employeeId={selectedEmployeeId}
        isOpen={showEmployeeModal}
        onClose={handleCloseModal}
      />
    </div>
  );
});

WorkedLeavesTab.displayName = 'WorkedLeavesTab';
