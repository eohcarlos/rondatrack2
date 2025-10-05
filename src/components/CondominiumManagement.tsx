import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search, Building2, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Condominium {
  id: string;
  name: string;
  address: string;
  created_at: string;
  employee_count?: number;
}

export const CondominiumManagement = () => {
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondominium, setEditingCondominium] = useState<Condominium | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCondominiums();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('condominiums-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'condominiums'
        },
        () => {
          loadCondominiums();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadCondominiums = async () => {
    try {
      // Carregar condomínios com contagem de funcionários
      const { data: condominiumsData, error } = await supabase
        .from('condominiums')
        .select(`
          *,
          employees!inner(id)
        `)
        .order('name');

      if (error) throw error;

      // Contar funcionários ativos por condomínio
      const condominiumsWithCount = await Promise.all(
        (condominiumsData || []).map(async (condominium) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('condominium_id', condominium.id)
            .eq('active', true);

          return {
            ...condominium,
            employee_count: count || 0
          };
        })
      );

      setCondominiums(condominiumsWithCount);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar condomínios",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do condomínio.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const condominiumData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null
      };

      if (editingCondominium) {
        const { error } = await supabase
          .from('condominiums')
          .update(condominiumData)
          .eq('id', editingCondominium.id);

        if (error) throw error;

        toast({
          title: "Condomínio atualizado",
          description: "Os dados foram atualizados com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('condominiums')
          .insert([condominiumData]);

        if (error) throw error;

        toast({
          title: "Condomínio adicionado",
          description: "O condomínio foi cadastrado com sucesso.",
        });
      }

      resetForm();
      setShowAddForm(false);
      setEditingCondominium(null);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar condomínio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (condominium: Condominium) => {
    setEditingCondominium(condominium);
    setFormData({
      name: condominium.name,
      address: condominium.address || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (condominiumId: string, hasEmployees: boolean) => {
    if (hasEmployees) {
      toast({
        title: "Não é possível excluir",
        description: "Este condomínio possui funcionários cadastrados. Remova os funcionários primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este condomínio?')) return;

    try {
      const { error } = await supabase
        .from('condominiums')
        .delete()
        .eq('id', condominiumId);

      if (error) throw error;

      toast({
        title: "Condomínio excluído",
        description: "O condomínio foi removido do sistema.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir condomínio",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredCondominiums = condominiums.filter(condominium =>
    condominium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (condominium.address && condominium.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Gestão de Condomínios
          </h2>
          <p className="text-muted-foreground">Gerencie os condomínios do sistema</p>
        </div>

        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingCondominium(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Condomínio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCondominium ? 'Editar Condomínio' : 'Novo Condomínio'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do condomínio
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Condomínio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Condomínio Jardim das Flores"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo do condomínio"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : (editingCondominium ? 'Atualizar' : 'Cadastrar')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar condomínios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Condomínios Cadastrados ({filteredCondominiums.length})</CardTitle>
          <CardDescription>
            Lista de todos os condomínios no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Funcionários</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCondominiums.map((condominium) => (
                  <TableRow key={condominium.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {condominium.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2 max-w-xs">
                        {condominium.address && (
                          <>
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground line-clamp-2">
                              {condominium.address}
                            </span>
                          </>
                        )}
                        {!condominium.address && (
                          <span className="text-sm text-muted-foreground italic">
                            Endereço não informado
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{condominium.employee_count || 0}</span>
                        <span className="text-sm text-muted-foreground">funcionários</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(condominium.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(condominium)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(condominium.id, (condominium.employee_count || 0) > 0)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCondominiums.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum condomínio encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};