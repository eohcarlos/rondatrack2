import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, Home } from 'lucide-react';
import { WorkedLeaveForm } from './WorkedLeaveForm';
import { AbsenceForm } from './AbsenceForm';
import { ReportsPanel } from './ReportsPanel';
import { EmployeeManagement } from './EmployeeManagement';
import { CondominiumManagement } from './CondominiumManagement';
import { WorkedLeavesTab } from './WorkedLeavesTab';
import { AbsencesTab } from './AbsencesTab';

interface DashboardProps {
  onLogout: () => void;
  onGoHome: () => void;
}

interface Profile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  role: 'supervisor' | 'gestor' | 'gerente';
}

interface Stats {
  totalEmployees: number;
  monthlyWorkedLeaves: number;
  monthlyAbsences: number;
  totalAbsences: number;
  totalCondominiums: number;
}

export const Dashboard = ({ onLogout, onGoHome }: DashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, monthlyWorkedLeaves: 0, monthlyAbsences: 0, totalAbsences: 0, totalCondominiums: 0 });
  const [activeForm, setActiveForm] = useState<'ft' | 'absence' | 'reports' | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    loadStats();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channels = [
      supabase.channel('employees-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, loadStats),
      supabase.channel('worked-leaves-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'worked_leaves' }, loadStats),
      supabase.channel('absences-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, loadStats),
      supabase.channel('condominiums-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'condominiums' }, loadStats)
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      // Total de funcionários
      const { count: employeesCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // FTs do mês atual
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { count: ftCount } = await supabase
        .from('worked_leaves')
        .select('*', { count: 'exact', head: true })
        .gte('date', `${currentMonth}-01`)
        .lt('date', `${currentMonth}-32`);

      // Faltas do mês atual
      const { count: absencesCount } = await supabase
        .from('absences')
        .select('*', { count: 'exact', head: true })
        .gte('date', `${currentMonth}-01`)
        .lt('date', `${currentMonth}-32`);

      // Total de faltas
      const { count: totalAbsencesCount } = await supabase
        .from('absences')
        .select('*', { count: 'exact', head: true });

      // Total de condomínios
      const { count: condominiumsCount } = await supabase
        .from('condominiums')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEmployees: employeesCount || 0,
        monthlyWorkedLeaves: ftCount || 0,
        monthlyAbsences: absencesCount || 0,
        totalAbsences: totalAbsencesCount || 0,
        totalCondominiums: condominiumsCount || 0,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
                alt="RondaTrack Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                  const icon = img.nextElementSibling as HTMLElement;
                  if (icon) icon.style.display = 'flex';
                }}
              />
              <Shield className="h-6 w-6 text-primary hidden" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                RondaTrack <span className="text-primary">2</span>
              </h1>
              <p className="text-sm text-muted-foreground">Sistema de Controle Profissional</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="text-right">
                <p className="font-medium text-foreground">
                  {profile.first_name} {profile.last_name}
                </p>
                <Badge className={getRoleBadgeColor(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>
            )}
            <Button onClick={onGoHome} variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Funcionários</span>
            </TabsTrigger>
            <TabsTrigger value="condominiums" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Condomínios</span>
            </TabsTrigger>
            <TabsTrigger value="worked-leaves" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">FT</span>
            </TabsTrigger>
            <TabsTrigger value="absences" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Faltas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">Total de funcionários cadastrados</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">FTs do Mês</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.monthlyWorkedLeaves}</div>
                  <p className="text-xs text-muted-foreground">Folgas trabalhadas no mês atual</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faltas do Mês</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.monthlyAbsences}</div>
                  <p className="text-xs text-muted-foreground">Faltas registradas no mês atual</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Faltas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.totalAbsences}</div>
                  <p className="text-xs text-muted-foreground">Todas as faltas registradas</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Condomínios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalCondominiums}</div>
                  <p className="text-xs text-muted-foreground">Total de condomínios cadastrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => setActiveForm('ft')}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Plus className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Registrar FT</CardTitle>
                      <CardDescription>Adicionar folga trabalhada</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => setActiveForm('absence')}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                      <Calendar className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Registrar Falta</CardTitle>
                      <CardDescription>Adicionar falta de funcionário</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => setActiveForm('reports')}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Relatórios</CardTitle>
                      <CardDescription>Exportar dados em Excel/CSV</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Forms */}
            {activeForm === 'ft' && (
              <WorkedLeaveForm 
                onClose={() => setActiveForm(null)} 
                onSuccess={() => {
                  setActiveForm(null);
                  loadStats();
                }}
              />
            )}

            {activeForm === 'absence' && (
              <AbsenceForm 
                onClose={() => setActiveForm(null)} 
                onSuccess={() => {
                  setActiveForm(null);
                  loadStats();
                }}
              />
            )}

            {activeForm === 'reports' && (
              <ReportsPanel onClose={() => setActiveForm(null)} />
            )}
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="condominiums">
            <CondominiumManagement />
          </TabsContent>

          <TabsContent value="worked-leaves">
            <WorkedLeavesTab />
          </TabsContent>

          <TabsContent value="absences">
            <AbsencesTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel onClose={() => setActiveTab('dashboard')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};