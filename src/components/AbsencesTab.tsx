import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, AlertTriangle, User, MapPin, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';

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

export const AbsencesTab = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAbsences();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('absences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'absences'
        },
        () => {
          loadAbsences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadAbsences = async () => {
    try {
      const { data, error } = await supabase
        .from('absences')
        .select(`
          *,
          employees!inner(
            id,
            first_name,
            last_name,
            shift,
            positions(title),
            condominiums(name)
          ),
          supervisor:profiles!supervisor_id(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setAbsences(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar faltas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getShiftLabel = (shift: string) => {
    const labels: { [key: string]: string } = {
      'manha': 'Manhã',
      'tarde': 'Tarde', 
      'noite': 'Noite',
      'madrugada': 'Madrugada'
    };
    return labels[shift] || shift;
  };

  const getShiftColor = (shift: string) => {
    const colors: { [key: string]: string } = {
      'manha': 'bg-yellow-100 text-yellow-800',
      'tarde': 'bg-orange-100 text-orange-800',
      'noite': 'bg-blue-100 text-blue-800',
      'madrugada': 'bg-purple-100 text-purple-800'
    };
    return colors[shift] || 'bg-gray-100 text-gray-800';
  };

  const getReasonColor = (reason: string) => {
    const colors: { [key: string]: string } = {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredAbsences = absences.filter(item =>
    item.employees.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employees.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employees.positions?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employees.condominiums?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getReasonLabel(item.reason).toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por funcionário, cargo, condomínio ou motivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Faltas ({filteredAbsences.length})</CardTitle>
          <CardDescription>
            Histórico completo das faltas registradas no sistema
          </CardDescription>
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
                {filteredAbsences.map((item) => (
                  <TableRow key={item.id}>
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
                        onClick={() => {
                          setSelectedEmployeeId(item.employees.id);
                          setShowEmployeeModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAbsences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma falta encontrada
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeDetailsModal
        employeeId={selectedEmployeeId}
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setSelectedEmployeeId(null);
        }}
      />
    </div>
  );
};