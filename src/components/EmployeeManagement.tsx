import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search, Users, Phone, MapPin, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentCompanyId } from '@/lib/company';
import { useEmployees, Employee } from '@/hooks/useEmployees';

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
    'manha': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'tarde': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'noite': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'madrugada': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  };
  return colors[shift] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

// Memoized card component
const EmployeeCard = memo(({ 
  employee, 
  onEdit, 
  onDelete 
}: { 
  employee: Employee; 
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">{employee.positions?.title}</p>
        </div>
        <Badge variant={employee.active ? "default" : "secondary"} className="shrink-0">
          {employee.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{employee.condominiums?.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Badge className={getShiftColor(employee.shift)} variant="secondary">
            {getShiftLabel(employee.shift)}
          </Badge>
        </div>
        {employee.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{employee.phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
        <Button size="sm" variant="outline" onClick={() => onEdit(employee)} className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(employee.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

EmployeeCard.displayName = 'EmployeeCard';

export const EmployeeManagement = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [condominiumFilter, setCondominiumFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    positionId: '',
    condominiumId: '',
    shift: '',
    phone: '',
    age: ''
  });
  const { toast } = useToast();

  // Use optimized hook
  const { filteredEmployees, positions, condominiums, refetch } = useEmployees({
    searchTerm,
    condominiumFilter
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        name: formData.fullName.trim(),
        position_id: formData.positionId,
        condominium_id: formData.condominiumId,
        shift: formData.shift as 'manha' | 'tarde' | 'noite' | 'madrugada',
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        active: true
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        toast({ title: "Funcionário atualizado", description: "Os dados foram atualizados com sucesso." });
      } else {
        const companyId = getCurrentCompanyId();
        if (!companyId) throw new Error('Company ID não encontrado');

        const { error } = await supabase
          .from('employees')
          .insert([{ ...employeeData, company_id: companyId }]);

        if (error) throw error;
        toast({ title: "Funcionário adicionado", description: "O funcionário foi cadastrado com sucesso." });
      }

      resetForm();
      setShowAddForm(false);
      setEditingEmployee(null);
    } catch (error: any) {
      toast({ title: "Erro ao salvar funcionário", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [formData, editingEmployee, toast]);

  const handleEdit = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      fullName: `${employee.first_name} ${employee.last_name}`.trim(),
      positionId: employee.position_id,
      condominiumId: employee.condominium_id,
      shift: employee.shift,
      phone: employee.phone || '',
      age: employee.age ? String(employee.age) : ''
    });
    setShowAddForm(true);
  }, []);

  const handleDelete = useCallback(async (employeeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: false })
        .eq('id', employeeId);

      if (error) throw error;
      toast({ title: "Funcionário desativado", description: "O funcionário foi desativado do sistema." });
    } catch (error: any) {
      toast({ title: "Erro ao desativar funcionário", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const resetForm = useCallback(() => {
    setFormData({
      fullName: '',
      positionId: '',
      condominiumId: '',
      shift: '',
      phone: '',
      age: ''
    });
  }, []);

  const handleOpenDialog = useCallback(() => {
    resetForm();
    setEditingEmployee(null);
  }, [resetForm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="relative">
              <Users className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
            </div>
            Gestão de Funcionários
          </h2>
          <p className="text-muted-foreground">Gerencie os funcionários dos condomínios</p>
        </div>

        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
              <DialogDescription>Preencha os dados do funcionário</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Select value={formData.positionId} onValueChange={(value) => setFormData(prev => ({ ...prev, positionId: value }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder={positions.length === 0 ? "Nenhum cargo disponível" : "Selecione o cargo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        <p>Nenhum cargo cadastrado.</p>
                      </div>
                    ) : (
                      positions.map(position => (
                        <SelectItem key={position.id} value={position.id}>{position.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {positions.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    ⚠️ Nenhum cargo disponível. Cadastre um cargo antes de adicionar funcionário.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condominium">Condomínio</Label>
                <Select value={formData.condominiumId} onValueChange={(value) => setFormData(prev => ({ ...prev, condominiumId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o condomínio" />
                  </SelectTrigger>
                  <SelectContent>
                    {condominiums.map(condominium => (
                      <SelectItem key={condominium.id} value={condominium.id}>{condominium.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select value={formData.shift} onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="madrugada">Madrugada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="25"
                  />
                </div>
              </div>


              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : editingEmployee ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={condominiumFilter} onValueChange={setCondominiumFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por condomínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominiums.map((condo) => (
              <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Funcionários ({filteredEmployees.length})</h3>
        </div>
        
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum funcionário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard 
                key={employee.id} 
                employee={employee} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

EmployeeManagement.displayName = 'EmployeeManagement';
