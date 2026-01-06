import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Briefcase, Search, Sparkles, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getCurrentCompanyId } from '@/lib/company';
import { Textarea } from '@/components/ui/textarea';

interface Position {
  id: string;
  title: string;
  description: string | null;
  employee_count?: number;
}

const PositionCard = memo(({ 
  position, 
  onEdit, 
  onDelete 
}: { 
  position: Position; 
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent to-accent/50 rounded-r-full" />
    
    <CardContent className="relative p-5 pl-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/25 shrink-0">
            <Briefcase className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground text-lg group-hover:text-accent transition-colors">
              {position.title}
            </h3>
            {position.employee_count !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{position.employee_count} funcionário{position.employee_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {position.description && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{position.description}</p>
        </div>
      )}
      
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEdit(position)} 
          className="flex-1 bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-all duration-300"
        >
          <Edit className="h-4 w-4 mr-1.5" />
          Editar
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onDelete(position.id)}
          className="flex-1 bg-background/50 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Excluir
        </Button>
      </div>
    </CardContent>
  </Card>
));

PositionCard.displayName = 'PositionCard';

export const PositionManagement = memo(() => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        console.error('Company ID não encontrado');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('company_id', companyId)
        .order('title');

      if (error) throw error;

      // Count employees per position
      const positionsWithCount = await Promise.all(
        (data || []).map(async (position) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('position_id', position.id)
            .eq('active', true);

          return {
            ...position,
            employee_count: count || 0
          };
        })
      );

      setPositions(positionsWithCount);
    } catch (error: any) {
      console.error('Erro ao carregar cargos:', error);
      toast({
        title: "Erro ao carregar cargos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      const positionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        company_id: companyId
      };

      if (editingPosition) {
        const { error } = await supabase
          .from('positions')
          .update(positionData)
          .eq('id', editingPosition.id);

        if (error) throw error;

        toast({
          title: "Cargo atualizado",
          description: "O cargo foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('positions')
          .insert([positionData]);

        if (error) throw error;

        toast({
          title: "Cargo adicionado",
          description: "O cargo foi cadastrado com sucesso.",
        });
      }

      resetForm();
      setShowAddForm(false);
      setEditingPosition(null);
      loadPositions();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cargo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingPosition, toast]);

  const handleEdit = useCallback((position: Position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      description: position.description || ''
    });
    setShowAddForm(true);
  }, []);

  const handleDelete = useCallback(async (positionId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cargo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: "Cargo excluído",
        description: "O cargo foi removido com sucesso.",
      });

      loadPositions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cargo",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: ''
    });
  }, []);

  const filteredPositions = positions.filter(position =>
    position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Carregando cargos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-card to-primary/10 p-6 border border-border/50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-xl shadow-accent/25">
                <Briefcase className="h-7 w-7 text-accent-foreground" />
              </div>
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary ring-2 ring-background flex items-center justify-center">
                <span className="text-[9px] text-primary-foreground font-bold">{positions.length}</span>
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Gestão de Cargos
                <Sparkles className="h-5 w-5 text-accent" />
              </h2>
              <p className="text-muted-foreground">Gerencie os cargos dos funcionários</p>
            </div>
          </div>

          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setEditingPosition(null);
                }}
                className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg shadow-accent/25 transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingPosition ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
                <DialogDescription>Preencha os dados do cargo</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Cargo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Porteiro, Zelador, Síndico"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição das responsabilidades do cargo"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1 h-11 bg-gradient-to-r from-accent to-accent/80">
                    {submitting ? 'Salvando...' : (editingPosition ? 'Atualizar' : 'Cadastrar')}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-card border-border/50"
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Cargos Cadastrados</h3>
        <div className="h-7 min-w-7 px-2.5 rounded-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground text-sm font-bold flex items-center justify-center shadow-lg shadow-accent/25">
          {filteredPositions.length}
        </div>
      </div>

      {/* Positions Grid */}
      {filteredPositions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground font-medium">
              {searchTerm ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado ainda'}
            </p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              {searchTerm ? 'Tente uma busca diferente' : 'Clique em "Novo Cargo" para começar'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPositions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

PositionManagement.displayName = 'PositionManagement';
