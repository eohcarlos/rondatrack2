import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Trash2, Edit, Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  name: string;
  code: string;
  created_at: string;
  employee_count?: number;
  condominium_count?: number;
  worked_leaves_count?: number;
  absences_count?: number;
}

export const AdminPanel = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('companies-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, loadCompanies)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, loadCompanies)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar estatísticas para cada empresa
      const companiesWithStats = await Promise.all(
        (companiesData || []).map(async (company) => {
          const [
            { count: employeeCount },
            { count: condominiumCount },
            { count: workedLeavesCount },
            { count: absencesCount }
          ] = await Promise.all([
            supabase
              .from('employees')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id)
              .eq('active', true),
            supabase
              .from('condominiums')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id),
            supabase
              .from('worked_leaves')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id),
            supabase
              .from('absences')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id)
          ]);

          return {
            ...company,
            employee_count: employeeCount || 0,
            condominium_count: condominiumCount || 0,
            worked_leaves_count: workedLeavesCount || 0,
            absences_count: absencesCount || 0,
          };
        })
      );

      setCompanies(companiesWithStats);
    } catch (error: any) {
      console.error('Error loading companies:', error);
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
          })
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: "✅ Empresa atualizada!",
          description: "A empresa foi atualizada com sucesso.",
        });
      } else {
        // Create new company
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        // Criar cargos padrão para a nova empresa
        const defaultPositions = [
          { title: 'Porteiro', description: 'Responsável pela portaria', company_id: newCompany.id },
          { title: 'Zelador', description: 'Responsável pela manutenção', company_id: newCompany.id },
          { title: 'Síndico', description: 'Administração do condomínio', company_id: newCompany.id },
          { title: 'Faxineiro', description: 'Responsável pela limpeza', company_id: newCompany.id },
          { title: 'Jardineiro', description: 'Manutenção de jardins e áreas verdes', company_id: newCompany.id },
          { title: 'Assistente', description: 'Assistente administrativo', company_id: newCompany.id },
          { title: 'Gerente', description: 'Gerente operacional', company_id: newCompany.id }
        ];

        const { error: positionsError } = await supabase
          .from('positions')
          .insert(defaultPositions);

        if (positionsError) {
          console.error('Erro ao criar cargos padrão:', positionsError);
        }

        toast({
          title: "✅ Empresa criada!",
          description: `A empresa "${formData.name}" foi criada com cargos padrão.`,
        });
      }

      setFormData({ name: '', code: '' });
      setEditingCompany(null);
      setIsDialogOpen(false);
      await loadCompanies();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Erro ao salvar empresa",
        description: error.message || "Não foi possível salvar a empresa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${name}"? Todos os dados relacionados serão perdidos.`)) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Empresa excluída",
        description: `A empresa "${name}" foi removida com sucesso.`,
      });

      await loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCompany(null);
      setFormData({ name: '', code: '' });
    }
  };

  const totalStats = {
    employees: companies.reduce((sum, c) => sum + (c.employee_count || 0), 0),
    condominiums: companies.reduce((sum, c) => sum + (c.condominium_count || 0), 0),
    workedLeaves: companies.reduce((sum, c) => sum + (c.worked_leaves_count || 0), 0),
    absences: companies.reduce((sum, c) => sum + (c.absences_count || 0), 0),
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">Painel do Administrador</CardTitle>
              <CardDescription className="text-primary-foreground/90">
                Gerenciar empresas do sistema
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany ? 'Atualize os dados da empresa' : 'Adicione uma nova empresa ao sistema'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Grupo Silver"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Acesso *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="Ex: SILVER2024"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este código será usado pelos funcionários para se registrarem
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleDialogClose(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : editingCompany ? 'Atualizar' : 'Criar Empresa'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Empresas</p>
                  <p className="text-3xl font-bold text-primary">{companies.length}</p>
                </div>
                <Building2 className="h-10 w-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Funcionários</p>
                  <p className="text-3xl font-bold text-accent">{totalStats.employees}</p>
                </div>
                <Users className="h-10 w-10 text-accent/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Condomínios</p>
                  <p className="text-3xl font-bold text-warning">{totalStats.condominiums}</p>
                </div>
                <Building2 className="h-10 w-10 text-warning/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Registros</p>
                  <p className="text-3xl font-bold text-destructive">
                    {totalStats.workedLeaves + totalStats.absences}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-destructive/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-center">Funcionários</TableHead>
                <TableHead className="text-center">Condomínios</TableHead>
                <TableHead className="text-center">FTs</TableHead>
                <TableHead className="text-center">Faltas</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground">{company.name}</p>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{company.code}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold">
                      <Users className="h-3 w-3 mr-1" />
                      {company.employee_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold">
                      <Building2 className="h-3 w-3 mr-1" />
                      {company.condominium_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold text-primary border-primary/50">
                      <Clock className="h-3 w-3 mr-1" />
                      {company.worked_leaves_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold text-destructive border-destructive/50">
                      <Calendar className="h-3 w-3 mr-1" />
                      {company.absences_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(company.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(company.id, company.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                      <p>Nenhuma empresa cadastrada</p>
                      <p className="text-xs">Clique em "Nova Empresa" para começar</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
