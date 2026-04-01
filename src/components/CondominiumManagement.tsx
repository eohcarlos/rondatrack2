import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search, Building2, MapPin, Users, Calendar, Loader2, Eye, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentCompanyId } from '@/lib/company';

interface Condominium {
  id: string;
  name: string;
  address: string;
  created_at: string;
  employee_count?: number;
}

interface CondEmployee {
  id: string;
  first_name: string;
  last_name: string | null;
  shift: string;
  positions: { title: string } | null;
}

interface CondominiumCardProps {
  condominium: Condominium;
  index: number;
  onEdit: (condominium: Condominium) => void;
  onDelete: (id: string, hasEmployees: boolean) => void;
  onViewEmployees: (condominium: Condominium) => void;
  formatDate: (date: string) => string;
}

const CondominiumCard = memo(({ condominium, index, onEdit, onDelete, onViewEmployees, formatDate }: CondominiumCardProps) => {
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
            onClick={() => onViewEmployees(condominium)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Funcionários
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
            onClick={() => onEdit(condominium)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
            onClick={() => onDelete(condominium.id, hasEmployees)}
          >
            <Trash2 className="h-3.5 w-3.5" />
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
  const [viewingEmployees, setViewingEmployees] = useState<Condominium | null>(null);
  const [condEmployees, setCondEmployees] = useState<CondEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
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
        title: "Erro ao carregar contratos",
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
        description: "Por favor, informe o nome do contrato.",
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
          title: "Contrato atualizado",
          description: "Os dados foram atualizados com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('condominiums')
          .insert([condominiumData]);

        if (error) throw error;

        toast({
          title: "Contrato adicionado",
          description: "O contrato foi cadastrado com sucesso.",
        });
      }

      await loadCondominiums();

      resetForm();
      setShowAddForm(false);
      setEditingCondominium(null);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar contrato",
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
        description: "Este contrato possui funcionários cadastrados. Remova os funcionários primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    try {
      const { error } = await supabase
        .from('condominiums')
        .delete()
        .eq('id', condominiumId);

      if (error) throw error;

      toast({
        title: "Contrato excluído",
        description: "O contrato foi removido do sistema.",
      });

      await loadCondominiums();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir contrato",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewEmployees = async (condominium: Condominium) => {
    setViewingEmployees(condominium);
    setLoadingEmployees(true);
    try {
      const companyId = getCurrentCompanyId();
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, shift, positions(title)')
        .eq('condominium_id', condominium.id)
        .eq('active', true)
        .eq('company_id', companyId!)
        .order('first_name');
      if (error) throw error;
      setCondEmployees((data as any) || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoadingEmployees(false);
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
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 sm:p-8 shadow-2xl shadow-blue-500/20">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-4 ring-white/20">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                Contratos
              </h2>
              <p className="text-white/70 text-sm sm:text-base">Gerencie os contratos do sistema</p>
            </div>
          </div>

          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setEditingCondominium(null);
                }}
                className="bg-white text-blue-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-card">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingCondominium ? 'Editar Contrato' : 'Novo Contrato'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do contrato
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Contrato *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Contrato Jardim das Flores"
                    className="rounded-xl h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Endereço completo do contrato"
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1 rounded-xl h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingCondominium ? 'Atualizar' : 'Cadastrar'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl h-11">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats row inside header */}
        <div className="relative grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/20">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{condominiums.length}</p>
            <p className="text-white/60 text-xs mt-1">Total</p>
          </div>
          <div className="text-center border-l border-white/20">
            <p className="text-3xl font-bold text-white">
              {condominiums.reduce((sum, c) => sum + (c.employee_count || 0), 0)}
            </p>
            <p className="text-white/60 text-xs mt-1">Funcionários</p>
          </div>
        </div>
      </div>

      {/* Search Bar Premium */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar contratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card border-0 shadow-lg rounded-2xl text-base"
        />
      </div>

      {/* Content Area */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/50 to-card border border-border/50 backdrop-blur-sm">
        {/* Header decorativo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">Contratos Cadastrados</h3>
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
              <p className="text-muted-foreground text-sm">Carregando contratos...</p>
            </div>
          ) : filteredCondominiums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-muted-foreground font-medium">Nenhum contrato encontrado</p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  {searchTerm ? 'Tente uma busca diferente' : 'Adicione um novo contrato para começar'}
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
                  onViewEmployees={handleViewEmployees}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Dialog de Funcionários do Condomínio */}
      <Dialog open={!!viewingEmployees} onOpenChange={(open) => { if (!open) setViewingEmployees(null); }}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Funcionários
            </DialogTitle>
            <DialogDescription>
              {viewingEmployees?.name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : condEmployees.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Users className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Nenhum funcionário ativo neste contrato</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {condEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">
                      {emp.first_name.charAt(0)}{emp.last_name?.charAt(0) || ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {emp.positions?.title || 'Sem cargo'}
                    </p>
                  </div>
                  <Badge className={`shrink-0 text-[10px] border-0 ${
                    emp.shift === 'manha' 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' 
                      : emp.shift === 'noite' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {emp.shift === 'manha' ? 'Manhã' : emp.shift === 'noite' ? 'Noite' : emp.shift}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
