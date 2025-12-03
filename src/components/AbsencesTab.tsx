import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, AlertTriangle, User, MapPin, Eye } from 'lucide-react';
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
    'tarde': 'Tarde', 
    'noite': 'Noite',
    'madrugada': 'Madrugada'
  };
  return labels[shift] || shift;
};

const getShiftColor = (shift: string) => {
  const colors: Record<string, string> = {
    'manha': 'bg-yellow-100 text-yellow-800',
    'tarde': 'bg-orange-100 text-orange-800',
    'noite': 'bg-blue-100 text-blue-800',
    'madrugada': 'bg-purple-100 text-purple-800'
  };
  return colors[shift] || 'bg-gray-100 text-gray-800';
};

const getReasonColor = (reason: string) => {
  const colors: Record<string, string> = {
    'doenca': 'bg-red-100 text-red-800',
    'atestado': 'bg-orange-100 text-orange-800',
    'falta_injustificada': 'bg-gray-100 text-gray-800',
    'licenca': 'bg-blue-100 text-blue-800',
    'ferias': 'bg-green-100 text-green-800',
    'outros': 'bg-purple-100 text-purple-800'
  };
  return colors[reason] || 'bg-gray-100 text-gray-800';
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

// Memoized row component
const AbsenceRow = memo(({ 
  item, 
  onViewDetails 
}: { 
  item: Absence; 
  onViewDetails: (id: string) => void;
}) => (
  <TableRow>
    <TableCell className="font-medium">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        {item.employees.first_name} {item.employees.last_name}
      </div>
    </TableCell>
    <TableCell>{item.employees.positions?.title}</TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        {item.employees.condominiums?.name}
      </div>
    </TableCell>
    <TableCell>
      <Badge className={getShiftColor(item.employees.shift)}>
        {getShiftLabel(item.employees.shift)}
      </Badge>
    </TableCell>
    <TableCell>{formatDate(item.date)}</TableCell>
    <TableCell>
      <Badge className={getReasonColor(item.reason)}>
        {getReasonLabel(item.reason)}
      </Badge>
    </TableCell>
    <TableCell>{item.supervisor?.name || 'N/A'}</TableCell>
    <TableCell>
      <div className="max-w-xs truncate" title={item.observations || ''}>
        {item.observations || 'Sem observações'}
      </div>
    </TableCell>
    <TableCell>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onViewDetails(item.employees.id)}
      >
        <Eye className="h-4 w-4 mr-1" />
        Ver Detalhes
      </Button>
    </TableCell>
  </TableRow>
));

AbsenceRow.displayName = 'AbsenceRow';

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
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando faltas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Faltas Registradas
          </h2>
          <p className="text-muted-foreground">Acompanhe as faltas dos funcionários</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário, cargo ou motivo..."
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
          <CardTitle>Mês Atual ({currentMonthAbsences.length})</CardTitle>
          <CardDescription>Faltas registradas no mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Data da Falta</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthAbsences.map((item) => (
                  <AbsenceRow key={item.id} item={item} onViewDetails={handleViewDetails} />
                ))}
              </TableBody>
            </Table>
          </div>
          {currentMonthAbsences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma falta encontrada no mês atual
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mês Anterior ({previousMonthAbsences.length})</CardTitle>
          <CardDescription>Faltas registradas no mês anterior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Data da Falta</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previousMonthAbsences.map((item) => (
                  <AbsenceRow key={item.id} item={item} onViewDetails={handleViewDetails} />
                ))}
              </TableBody>
            </Table>
          </div>
          {previousMonthAbsences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma falta encontrada no mês anterior
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
