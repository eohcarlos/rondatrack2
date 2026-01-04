import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search, Building2, MapPin, Users, Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentCompanyId } from '@/lib/company';

interface Condominium {
  id: string;
  name: string;
  address: string;
  created_at: string;
  employee_count?: number;
}

interface CondominiumCardProps {
  condominium: Condominium;
  index: number;
  onEdit: (condominium: Condominium) => void;
  onDelete: (id: string, hasEmployees: boolean) => void;
  formatDate: (date: string) => string;
}

const CondominiumCard = memo(({ condominium, index, onEdit, onDelete, formatDate }: CondominiumCardProps) => {
  const initials = condominium.name.substring(0, 2).toUpperCase();
  const hasEmployees = (condominium.employee_count || 0) > 0;
  
  return (
    <div 
      className="group relative bg-gradient-to-br from-card/80 to-card border border-border/50 rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-tr-2xl rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Colored side accent */}
      <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />
      
      <div className="relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar com iniciais */}
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-primary-foreground font-bold text-sm">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background flex items-center justify-center shadow-sm">
                <Building2 className="h-2.5 w-2.5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-lg leading-tight">
                {condominium.name}
              </p>
            </div>
          </div>
          
          {/* Badge de funcionários */}
          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm ${
            hasEmployees 
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-muted/50 text-muted-foreground border border-border/50'
          }`}>
            <Users className="h-3.5 w-3.5" />
            {condominium.employee_count || 0}
          </div>
        </div>

        {/* Endereço */}
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
          <span className="break-words leading-relaxed">
            {condominium.address || 'Endereço não informado'}
          </span>
        </div>

        {/* Data de cadastro */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary/50" />
          <span>Cadastrado em {formatDate(condominium.created_at)}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-1 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
            onClick={() => onEdit(condominium)}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
            onClick={() => onDelete(condominium.id, hasEmployees)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
});

CondominiumCard.displayName = 'CondominiumCard';

export const CondominiumManagement = () => {
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondominium, setEditingCondominium] = useState<Condominium | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
        setLoading(false);
        return;
      }

      const { data: condominiumsData, error } = await supabase
        .from('condominiums')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

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
    } finally {
      setLoading(false);
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

    setSubmitting(true);

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
      setSubmitting(false);
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
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">{condominiums.length}</span>
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Gestão de Condomínios
              </h2>
              <p className="text-muted-foreground text-sm">Gerencie os condomínios do sistema</p>
            </div>
          </div>

          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setEditingCondominium(null);
                }}
                className="rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Condomínio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">
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
                    className="rounded-xl"
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
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1 rounded-xl">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingCondominium ? 'Atualizar' : 'Cadastrar'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar Premium */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Buscar condomínios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-md rounded-xl border-border/50 bg-card/50 backdrop-blur-sm focus:bg-card transition-colors"
        />
      </div>

      {/* Content Area */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/50 to-card border border-border/50 backdrop-blur-sm">
        {/* Header decorativo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">Condomínios Cadastrados</h3>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25">
                {filteredCondominiums.length}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
              <p className="text-muted-foreground text-sm">Carregando condomínios...</p>
            </div>
          ) : filteredCondominiums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-muted-foreground font-medium">Nenhum condomínio encontrado</p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  {searchTerm ? 'Tente uma busca diferente' : 'Adicione um novo condomínio para começar'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCondominiums.map((condominium, index) => (
                <CondominiumCard
                  key={condominium.id}
                  condominium={condominium}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
