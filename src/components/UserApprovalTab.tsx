import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Users, Clock, UserCheck } from 'lucide-react';

interface PendingUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  avatar_url?: string;
  created_at: string;
}

export const UserApprovalTab = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingUsers();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadPendingUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários pendentes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (approve) {
        // Aprovando usuário
        const { error } = await supabase
          .from('profiles')
          .update({
            approved: true,
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          })
          .eq('user_id', userId);

        if (error) throw error;

        toast({
          title: "Usuário aprovado!",
          description: "O usuário agora pode acessar o sistema.",
        });
      } else {
        // Rejeitando usuário - remover o perfil e o usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;

        toast({
          title: "Usuário rejeitado!",
          description: "O usuário foi removido do sistema.",
        });
      }

      await loadPendingUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao processar aprovação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gerente': return 'bg-destructive text-destructive-foreground';
      case 'gestor': return 'bg-warning text-warning-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'gerente': return 'Gerente';
      case 'gestor': return 'Gestor';
      default: return 'Supervisor';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-orange-900">Aprovação de Usuários</CardTitle>
              <CardDescription className="text-orange-700">
                Gerencie solicitações de acesso ao sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-orange-800">{pendingUsers.length} usuários aguardando aprovação</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum usuário pendente</p>
            <p className="text-muted-foreground">Todos os usuários foram aprovados ou não há solicitações pendentes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>
                        {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitação enviada em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApproval(user.user_id, true)}
                      disabled={isLoading}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleApproval(user.user_id, false)}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};