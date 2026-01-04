import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, AlertTriangle, User, MapPin, Eye, Calendar, Briefcase, MessageSquare, Sparkles, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import { getCurrentCompanyId } from '@/lib/company';

interface Absence {
  id: string;
  date: string;
  reason: string;
  observations: string | null;
  created_at: string;
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

const getReasonColor = (reason: string) => {
  const colors: Record<string, string> = {
    'doenca': 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25',
    'atestado': 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25',
    'Atestado médico': 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25',
    'falta_injustificada': 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-600/25',
    'Falta injustificada': 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-600/25',
    'Falta justificada': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
    'licenca': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
    'Licença médica': 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25',
    'ferias': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25',
    'outros': 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/25',
    'Outros': 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/25'
  };
  return colors[reason] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
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

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

// Premium card component
const AbsenceCard = memo(({ 
  item, 
  onViewDetails 
}: { 
  item: Absence; 
  onViewDetails: (id: string) => void;
}) => (
  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-destructive/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    {/* Gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {/* Decorative accent */}
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-destructive to-destructive/70" />
    
    <CardContent className="relative p-5 pl-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-lg shadow-destructive/25 shrink-0">
            <span className="text-lg font-bold text-destructive-foreground">
              {item.employees.first_name.charAt(0)}{item.employees.last_name?.charAt(0) || ''}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground break-words text-lg group-hover:text-destructive transition-colors">
              {item.employees.first_name} {item.employees.last_name}
            </p>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="break-words">{item.employees.positions?.title || 'Sem cargo'}</span>
            </p>
          </div>
        </div>
        <Badge className={`${getShiftColor(item.employees.shift)} shrink-0 px-3 py-1 text-xs font-semibold border-0`}>
          {getShiftLabel(item.employees.shift)}
        </Badge>
      </div>

      {/* Reason Badge */}
      <div className="flex justify-center mb-4">
        <Badge className={`${getReasonColor(item.reason)} px-4 py-1.5 text-xs font-semibold border-0`}>
          <ShieldAlert className="h-3 w-3 mr-1.5" />
          {getReasonLabel(item.reason)}
        </Badge>
      </div>

      {/* Info grid */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground break-words">{item.employees.condominiums?.name || 'N/A'}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-destructive/10 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm font-medium">{formatDate(item.date)}</span>
          </div>
          
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground truncate">{item.supervisor?.name || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Observations */}
      {item.observations && (
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl mb-4 border border-border/50">
          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-destructive/60" />
          <span className="break-words line-clamp-2">{item.observations}</span>
        </div>
      )}

      {/* Action */}
      <Button
        size="sm"
        variant="outline"
        className="w-full bg-background/50 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300"
        onClick={() => onViewDetails(item.employees.id)}
      >
        <Eye className="h-4 w-4 mr-1.5" />
        Ver Detalhes
      </Button>
    </CardContent>
  </Card>
));

AbsenceCard.displayName = 'AbsenceCard';

export const AbsencesTab = memo(() => {
  const [absences, setAbsences] = useState<Absence[]>([]);
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
      const [absencesResult, condominiumsResult] = await Promise.all([
        supabase
          .from('absences')
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

      if (absencesResult.error) throw absencesResult.error;
      if (condominiumsResult.error) throw condominiumsResult.error;

      setAbsences(absencesResult.data || []);
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
      .channel('absences-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, debouncedReload)
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [loadData, debouncedReload]);

  // Memoized filtered data
  const filteredAbsences = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return absences.filter(item => {
      const matchesSearch = !searchTerm ||
        item.employees.first_name.toLowerCase().includes(searchLower) ||
        item.employees.last_name.toLowerCase().includes(searchLower) ||
        item.employees.positions?.title?.toLowerCase().includes(searchLower) ||
        item.employees.condominiums?.name?.toLowerCase().includes(searchLower) ||
        getReasonLabel(item.reason).toLowerCase().includes(searchLower);

      const matchesCondominium = !selectedCondominium || selectedCondominium === 'all' || 
        item.employees.condominiums?.name === selectedCondominium;

      const matchesEmployee = !selectedEmployeeFilter || selectedEmployeeFilter === 'all' ||
        `${item.employees.first_name} ${item.employees.last_name}` === selectedEmployeeFilter;

      return matchesSearch && matchesCondominium && matchesEmployee;
    });
  }, [absences, searchTerm, selectedCondominium, selectedEmployeeFilter]);

  // Memoized month filters
  const { currentMonthAbsences, previousMonthAbsences } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = new Date(currentYear, currentMonth - 1);
    
    return {
      currentMonthAbsences: filteredAbsences.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }),
      previousMonthAbsences: filteredAbsences.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear();
      })
    };
  }, [filteredAbsences]);

  // Memoized employee names for filter
  const employeeNames = useMemo(() => 
    [...new Set(absences.map(item => `${item.employees.first_name} ${item.employees.last_name}`))],
    [absences]
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-destructive border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Carregando faltas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 via-card to-primary/10 p-6 border border-border/50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-destructive/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-xl shadow-destructive/25">
              <AlertTriangle className="h-7 w-7 text-destructive-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Faltas Registradas
                <Sparkles className="h-5 w-5 text-destructive" />
              </h2>
              <p className="text-muted-foreground">Acompanhe as faltas dos funcionários</p>
            </div>
          </div>

          {/* Stats mini card */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Este Mês</p>
              <p className="text-lg font-bold text-destructive">{currentMonthAbsences.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário, cargo ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50"
          />
        </div>
        
        <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
          <SelectTrigger className="h-11 bg-card border-border/50">
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
          <SelectTrigger className="h-11 bg-card border-border/50">
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

      {/* Current Month Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-destructive/5 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-destructive/5 to-transparent">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-lg shadow-destructive/25">
              <Calendar className="h-5 w-5 text-destructive-foreground" />
            </div>
            Mês Atual
            <div className="h-8 min-w-8 px-3 rounded-full bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground text-sm font-bold flex items-center justify-center shadow-lg shadow-destructive/25">
              {currentMonthAbsences.length}
            </div>
          </CardTitle>
          <CardDescription>Faltas registradas no mês atual</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {currentMonthAbsences.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhuma falta encontrada no mês atual</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentMonthAbsences.map((item, index) => (
                <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <AbsenceCard item={item} onViewDetails={handleViewDetails} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Month Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            Mês Anterior
            <div className="h-8 min-w-8 px-3 rounded-full bg-muted text-muted-foreground text-sm font-bold flex items-center justify-center">
              {previousMonthAbsences.length}
            </div>
          </CardTitle>
          <CardDescription>Faltas registradas no mês anterior</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {previousMonthAbsences.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhuma falta encontrada no mês anterior</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {previousMonthAbsences.map((item) => (
                <AbsenceCard key={item.id} item={item} onViewDetails={handleViewDetails} />
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

AbsencesTab.displayName = 'AbsencesTab';