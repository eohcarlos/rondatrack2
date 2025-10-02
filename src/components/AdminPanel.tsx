import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Trash2, Edit, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Company {
  id: string;
  name: string;
  code: string;
  created_at: string;
  employee_count?: number;
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
  }, []);

  const loadCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de funcionários para cada empresa
      const companiesWithCount = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('active', true);

          return {
            ...company,
            employee_count: count || 0,
          };
        })
      );

      setCompanies(companiesWithCount);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            code: formData.code,
          })
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: "Empresa atualizada!",
          description: "A empresa foi atualizada com sucesso.",
        });
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            code: formData.code,
          });

        if (error) throw error;

        toast({
          title: "Empresa criada!",
          description: "A nova empresa foi criada com sucesso.",
        });
      }

      setFormData({ name: '', code: '' });
      setEditingCompany(null);
      setIsDialogOpen(false);
      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar empresa",
        description: error.message,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Empresa excluída",
        description: "A empresa foi removida com sucesso.",
      });

      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
    setFormData({ name: '', code: '' });
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Acesso *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="Ex: SILVER2024"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : editingCompany ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Empresas</p>
                  <p className="text-2xl font-bold text-primary">{companies.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Funcionários</p>
                  <p className="text-2xl font-bold text-accent">
                    {companies.reduce((sum, c) => sum + (c.employee_count || 0), 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média por Empresa</p>
                  <p className="text-2xl font-bold text-warning">
                    {companies.length > 0 
                      ? Math.round(companies.reduce((sum, c) => sum + (c.employee_count || 0), 0) / companies.length)
                      : 0
                    }
                  </p>
                </div>
                <Users className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-center">Funcionários</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>
                  <code className="px-2 py-1 bg-muted rounded text-sm">{company.code}</code>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-semibold">
                    {company.employee_count || 0}
                  </Badge>
                </TableCell>
                <TableCell>
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
                      onClick={() => handleDelete(company.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma empresa cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
