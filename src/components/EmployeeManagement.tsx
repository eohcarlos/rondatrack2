import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search, Users, Phone, MapPin, Clock, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentCompanyId } from '@/lib/company';
import { useEmployees, Employee } from '@/hooks/useEmployees';

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

// Premium card component
const EmployeeCard = memo(({ 
  employee, 
  onEdit, 
  onDelete 
}: { 
  employee: Employee; 
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    {/* Gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {/* Decorative corner */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    
    <CardContent className="relative p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
            <span className="text-lg font-bold text-primary-foreground">
              {employee.first_name.charAt(0)}{employee.last_name?.charAt(0) || ''}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground truncate text-lg group-hover:text-primary transition-colors">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">{employee.positions?.title}</p>
          </div>
        </div>
        <Badge className={`${getShiftColor(employee.shift)} shrink-0 px-3 py-1 text-xs font-semibold border-0`}>
          {getShiftLabel(employee.shift)}
        </Badge>
      </div>
      
      {/* Info grid */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-medium text-foreground truncate">{employee.condominiums?.name}</span>
        </div>
        
        {employee.phone && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{employee.phone}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEdit(employee)} 
          className="flex-1 bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          <Edit className="h-4 w-4 mr-1.5" />
          Editar
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onDelete(employee.id)}
          className="bg-background/50 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300"
        >
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
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 border border-border/50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/25">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Gestão de Funcionários
                <Sparkles className="h-5 w-5 text-primary" />
              </h2>
              <p className="text-muted-foreground">Gerencie os funcionários dos condomínios</p>
            </div>
          </div>

          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Select value={formData.positionId} onValueChange={(value) => setFormData(prev => ({ ...prev, positionId: value }))} required>
                    <SelectTrigger className="h-11">
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
                    <SelectTrigger className="h-11">
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
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
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
                      className="h-11"
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
                      className="h-11"
                    />
                  </div>
                </div>


                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/80">
                    {loading ? 'Salvando...' : editingEmployee ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="h-11">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50"
          />
        </div>
        <Select value={condominiumFilter} onValueChange={setCondominiumFilter}>
          <SelectTrigger className="h-11 bg-card border-border/50">
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

      {/* Results Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Funcionários</h3>
        <div className="h-8 min-w-8 px-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg shadow-primary/25">
          {filteredEmployees.length}
        </div>
      </div>
      
      {/* Grid */}
      {filteredEmployees.length === 0 ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/30">
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Nenhum funcionário encontrado</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Adicione um novo funcionário para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((employee, index) => (
            <div key={employee.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <EmployeeCard 
                employee={employee} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

EmployeeManagement.displayName = 'EmployeeManagement';