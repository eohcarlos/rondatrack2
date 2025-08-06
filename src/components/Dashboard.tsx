import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, User, UserCheck, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { EmployeeManagement } from './EmployeeManagement';
import { CondominiumManagement } from './CondominiumManagement';
import { WorkedLeavesTab } from './WorkedLeavesTab';
import { AbsencesTab } from './AbsencesTab';

import { PWAInstallPrompt } from './PWAInstallPrompt';

import { DailyPhrase } from './DailyPhrase';
import { ProfilePage } from '@/pages/Profile';
import { ReportsPage } from '@/pages/Reports';
import { WorkedLeavesPage } from '@/pages/WorkedLeaves';
import { AbsencesPage } from '@/pages/Absences';

interface DashboardProps {
  onLogout: () => void;
  onGoHome: () => void;
}

interface Profile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'supervisor' | 'gestor' | 'gerente';
}

interface Stats {
  totalEmployees: number;
  monthlyWorkedLeaves: number;
  monthlyAbsences: number;
  totalAbsences: number;
  totalCondominiums: number;
  totalWorkedLeaves: number;
}

export const Dashboard = ({ onLogout, onGoHome }: DashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, monthlyWorkedLeaves: 0, monthlyAbsences: 0, totalAbsences: 0, totalCondominiums: 0, totalWorkedLeaves: 0 });
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'reports' | 'ft' | 'absence'>('dashboard');
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

      // Total de FTs (todas)
      const { count: totalFtCount } = await supabase
        .from('worked_leaves')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEmployees: employeesCount || 0,
        monthlyWorkedLeaves: ftCount || 0,
        monthlyAbsences: absencesCount || 0,
        totalAbsences: totalAbsencesCount || 0,
        totalCondominiums: condominiumsCount || 0,
        totalWorkedLeaves: totalFtCount || 0,
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

  // Renderizar páginas separadas
  if (currentPage === 'profile') {
    return <ProfilePage onGoBack={() => setCurrentPage('dashboard')} />;
  }
  
  if (currentPage === 'reports') {
    return <ReportsPage onGoBack={() => setCurrentPage('dashboard')} />;
  }
  
  if (currentPage === 'ft') {
    return <WorkedLeavesPage onGoBack={() => setCurrentPage('dashboard')} />;
  }
  
  if (currentPage === 'absence') {
    return <AbsencesPage onGoBack={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                  RondaTrack <span className="text-primary">2</span>
                </h1>
                <p className="text-xs lg:text-sm text-muted-foreground">Sistema de Controle Profissional</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              {profile && (
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-foreground text-sm lg:text-base">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <Badge className={getRoleBadgeColor(profile.role)} variant="secondary">
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              )}
              <Button onClick={() => setCurrentPage('profile')} variant="outline" size="sm">
                <User className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Perfil</span>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">{/* Removido max-h-screen overflow-y-auto para permitir scroll natural */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-First Navigation - Vertical Stack */}
          <TabsList className="mb-6 h-auto p-0 bg-transparent">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
              <TabsTrigger 
                value="dashboard" 
                className="flex flex-col items-center gap-1 p-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground w-full"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="employees" 
                className="flex flex-col items-center gap-1 p-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground w-full"
              >
                <Users className="h-5 w-5" />
                <span>Funcionários</span>
              </TabsTrigger>
              <TabsTrigger 
                value="condominiums" 
                className="flex flex-col items-center gap-1 p-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground w-full"
              >
                <Building2 className="h-5 w-5" />
                <span>Condomínios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="worked-leaves" 
                className="flex flex-col items-center gap-1 p-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground w-full"
              >
                <Clock className="h-5 w-5" />
                <span>FT</span>
              </TabsTrigger>
              <TabsTrigger 
                value="absences" 
                className="flex flex-col items-center gap-1 p-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground w-full"
              >
                <Calendar className="h-5 w-5" />
                <span>Faltas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="flex flex-col items-center gap-1 p-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground w-full"
              >
                <Download className="h-5 w-5" />
                <span>Relatórios</span>
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Frase do Dia */}
            <DailyPhrase />

            {/* Stats Cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estatísticas do Mês Atual
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                  className="group hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-primary/5 cursor-pointer" 
                  onClick={() => setActiveTab('worked-leaves')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">FTs do Mês</CardTitle>
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.monthlyWorkedLeaves}</div>
                    <p className="text-xs text-muted-foreground">Folgas trabalhadas registradas</p>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-lg transition-all duration-300 border-destructive/20 bg-gradient-to-br from-card to-destructive/5 cursor-pointer"
                  onClick={() => setActiveTab('absences')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">Faltas do Mês</CardTitle>
                    <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                      <Calendar className="h-4 w-4 text-destructive" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.monthlyAbsences}</div>
                    <p className="text-xs text-muted-foreground">Faltas registradas no período</p>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-lg transition-all duration-300 border-accent/20 bg-gradient-to-br from-card to-accent/5 cursor-pointer"
                  onClick={() => setActiveTab('employees')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-accent">Funcionários</CardTitle>
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">Total ativos</p>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-lg transition-all duration-300 border-warning/20 bg-gradient-to-br from-card to-warning/5 cursor-pointer"
                  onClick={() => setActiveTab('condominiums')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-warning">Condomínios</CardTitle>
                    <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <Building2 className="h-4 w-4 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.totalCondominiums}</div>
                    <p className="text-xs text-muted-foreground">Locais cadastrados</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Ações Rápidas
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card 
                  className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group" 
                  onClick={() => setCurrentPage('ft')}
                >
                  <CardHeader className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">Registrar FT</CardTitle>
                        <CardDescription className="text-primary-foreground/90">Adicionar folga trabalhada</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group" 
                  onClick={() => setCurrentPage('absence')}
                >
                  <CardHeader className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">Registrar Falta</CardTitle>
                        <CardDescription className="text-destructive-foreground/90">Adicionar falta de funcionário</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              <Card 
                className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group mt-4" 
                onClick={() => setCurrentPage('reports')}
              >
                <CardHeader className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">Relatórios</CardTitle>
                      <CardDescription className="text-accent-foreground/90">Exportar dados em Excel/CSV</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

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
            <div className="text-center p-8">
              <p className="text-muted-foreground">Use os cards na Dashboard para acessar relatórios</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <PWAInstallPrompt />
    </div>
  );
};