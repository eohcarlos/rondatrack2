import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search, Building2, MapPin, Users, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentCompanyId } from '@/lib/company';

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
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        console.error('Company ID não encontrado');
        return;
      }

      // Carregar condomínios
      const { data: condominiumsData, error } = await supabase
        .from('condominiums')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      // Contar funcionários ativos por condomínio
      const condominiumsWithCount = await Promise.all(
        (condominiumsData || []).map(async (condominium) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('condominium_id', condominium.id)
            .eq('active', true)
            .eq('company_id', companyId);

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
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      const condominiumData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        company_id: companyId
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

      // Recarregar a lista de condomínios
      await loadCondominiums();

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

      // Recarregar a lista de condomínios
      await loadCondominiums();
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
            <div className="relative">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-background" />
            </div>
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
          {filteredCondominiums.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum condomínio encontrado
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCondominiums.map((condominium) => (
                <Card key={condominium.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">
                              {condominium.name}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          <Users className="h-3 w-3 mr-1" />
                          {condominium.employee_count || 0}
                        </Badge>
                      </div>

                      {/* Endereço */}
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="break-words">
                          {condominium.address || 'Endereço não informado'}
                        </span>
                      </div>

                      {/* Data de cadastro */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>Cadastrado em {formatDate(condominium.created_at)}</span>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEdit(condominium)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDelete(condominium.id, (condominium.employee_count || 0) > 0)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};