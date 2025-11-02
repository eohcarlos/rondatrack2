import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/company';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, User, UserCheck, Activity, TrendingUp, BarChart3, Briefcase, Sparkles } from 'lucide-react';
import { EmployeeManagement } from './EmployeeManagement';
import { CondominiumManagement } from './CondominiumManagement';
import { PositionManagement } from './PositionManagement';
import { WorkedLeavesTab } from './WorkedLeavesTab';
import { AbsencesTab } from './AbsencesTab';
import { ReportsPanel } from './ReportsPanel';
import { AIReportsTab } from './AIReportsTab';
import { PWAInstallPrompt } from './PWAInstallPrompt';

import { DailyPhrase } from './DailyPhrase';
import { ProfilePage } from '@/pages/Profile';
import { ReportsPage } from '@/pages/Reports';
import { WorkedLeavesPage } from '@/pages/WorkedLeaves';
import { AbsencesPage } from '@/pages/Absences';
import { BottomNav } from './BottomNav';
import { AdminPage } from '@/pages/Admin';
import { useUserRole } from '@/hooks/useUserRole';
interface DashboardProps {
  onLogout: () => void;
  onGoHome: () => void;
  companyName?: string;
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
  previousMonthWorkedLeaves: number;
  previousMonthAbsences: number;
}

export const Dashboard = ({ onLogout, onGoHome, companyName }: DashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, monthlyWorkedLeaves: 0, monthlyAbsences: 0, totalAbsences: 0, totalCondominiums: 0, totalWorkedLeaves: 0, previousMonthWorkedLeaves: 0, previousMonthAbsences: 0 });
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'reports' | 'ft' | 'absence' | 'admin'>('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();

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
      const companyId = getCurrentCompanyId();
      if (!companyId) return;

      // Total de funcionários
      const { count: employeesCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .eq('company_id', companyId);

      // Faixas de data do mês atual (local, evitando fuso)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const next = new Date(year, month, 1); // próximo mês, dia 1
      const nextYear = next.getFullYear();
      const nextMonth = next.getMonth() + 1;
      const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      // Faixas de data do mês anterior
      const prevMonth = new Date(year, month - 2, 1); // mês anterior
      const prevYear = prevMonth.getFullYear();
      const prevMonthNum = prevMonth.getMonth() + 1;
      const startOfPrevMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`;

      console.log('📅 Datas calculadas:', {
        mesAtual: { inicio: startOfMonth, fim: startOfNextMonth },
        mesAnterior: { inicio: startOfPrevMonth, fim: startOfMonth }
      });

      // FTs do mês atual
      const { count: ftCount } = await supabase
        .from('worked_leaves')
        .select('*', { count: 'exact', head: true })
        .gte('date', startOfMonth)
        .lt('date', startOfNextMonth)
        .eq('company_id', companyId);

      // FTs do mês anterior
      const { count: prevFtCount, data: prevFtData, error: prevFtError } = await supabase
        .from('worked_leaves')
        .select('*', { count: 'exact', head: false })
        .gte('date', startOfPrevMonth)
        .lt('date', startOfMonth)
        .eq('company_id', companyId);

      console.log('📊 FTs mês anterior:', { count: prevFtCount, data: prevFtData, error: prevFtError });

      // Faltas do mês atual
      const { count: absencesCount } = await supabase
        .from('absences')
        .select('*', { count: 'exact', head: true })
        .gte('date', startOfMonth)
        .lt('date', startOfNextMonth)
        .eq('company_id', companyId);

      // Faltas do mês anterior
      const { count: prevAbsencesCount, data: prevAbsencesData, error: prevAbsencesError } = await supabase
        .from('absences')
        .select('*', { count: 'exact', head: false })
        .gte('date', startOfPrevMonth)
        .lt('date', startOfMonth)
        .eq('company_id', companyId);

      console.log('📊 Faltas mês anterior:', { count: prevAbsencesCount, data: prevAbsencesData, error: prevAbsencesError });

      // Total de faltas
      const { count: totalAbsencesCount } = await supabase
        .from('absences')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Total de condomínios
      const { count: condominiumsCount } = await supabase
        .from('condominiums')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Total de FTs (todas)
      const { count: totalFtCount } = await supabase
        .from('worked_leaves')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const newStats = {
        totalEmployees: employeesCount || 0,
        monthlyWorkedLeaves: ftCount || 0,
        monthlyAbsences: absencesCount || 0,
        totalAbsences: totalAbsencesCount || 0,
        totalCondominiums: condominiumsCount || 0,
        totalWorkedLeaves: totalFtCount || 0,
        previousMonthWorkedLeaves: prevFtCount || 0,
        previousMonthAbsences: prevAbsencesCount || 0,
      };

      console.log('📈 Stats atualizadas:', newStats);
      
      setStats(newStats);
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

  if (currentPage === 'admin' && isAdmin) {
    return <AdminPage onGoBack={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur-xl border-b border-primary/20" style={{ boxShadow: 'var(--shadow-elegant)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow p-2 flex items-center justify-center shadow-lg">
                <img 
                  src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
                  alt="RondaTrack Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                    const icon = img.nextElementSibling as HTMLElement;
                    if (icon) icon.style.display = 'flex';
                  }}
                />
                <Shield className="h-7 w-7 text-primary-foreground hidden" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  RondaTrack <span className="text-primary">2</span>
                </h1>
                <div className="flex flex-col">
                  <p className="text-xs lg:text-sm text-muted-foreground font-medium">Sistema de Controle Profissional</p>
                  {companyName && (
                    <p className="text-xs text-primary font-semibold">{companyName}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-3">
              {profile && (
                <div className="text-right hidden sm:block mr-2">
                  <p className="font-semibold text-foreground text-sm lg:text-base">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <Badge className={`${getRoleBadgeColor(profile.role)} shadow-sm`} variant="secondary">
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              )}
              <Button 
                onClick={() => setCurrentPage('profile')} 
                variant="outline" 
                size="sm"
                className="hover:bg-primary/10 hover:border-primary transition-all duration-300"
              >
                <User className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Perfil</span>
              </Button>
              {!isLoadingRole && isAdmin && (
                <Button 
                  onClick={() => setCurrentPage('admin')} 
                  variant="outline" 
                  size="sm" 
                  className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Shield className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Admin</span>
                </Button>
              )}
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
              >
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6 overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs - Grid on Desktop */}
          <TabsList className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-8 mb-6 h-auto p-0 bg-transparent gap-2 w-full">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="employees" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Users className="h-5 w-5" />
              <span>Funcionários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="positions" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Briefcase className="h-5 w-5" />
              <span>Cargos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="condominiums" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Building2 className="h-5 w-5" />
              <span>Condomínios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="worked-leaves" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Clock className="h-5 w-5" />
              <span>FT</span>
            </TabsTrigger>
            <TabsTrigger 
              value="absences" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Calendar className="h-5 w-5" />
              <span>Faltas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Download className="h-5 w-5" />
              <span>Relatórios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span>IA</span>
            </TabsTrigger>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Stats do Mês Anterior */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Estatísticas do Mês Anterior
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card 
                  className="group hover:shadow-lg transition-all duration-300 border-primary/10 bg-gradient-to-br from-card to-primary/3 cursor-pointer" 
                  onClick={() => setActiveTab('worked-leaves')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary/80">FTs do Mês Anterior</CardTitle>
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Clock className="h-4 w-4 text-primary/70" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.previousMonthWorkedLeaves}</div>
                    <p className="text-xs text-muted-foreground">Folgas trabalhadas no mês passado</p>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-lg transition-all duration-300 border-destructive/10 bg-gradient-to-br from-card to-destructive/3 cursor-pointer"
                  onClick={() => setActiveTab('absences')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-destructive/80">Faltas do Mês Anterior</CardTitle>
                    <div className="w-8 h-8 bg-destructive/5 rounded-lg flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                      <Calendar className="h-4 w-4 text-destructive/70" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.previousMonthAbsences}</div>
                    <p className="text-xs text-muted-foreground">Faltas registradas no mês passado</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Stats Gerais */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Estatísticas Gerais
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl"
                  onClick={() => setCurrentPage('ft')}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold text-white">Registrar FT</div>
                      <div className="text-sm text-primary-foreground/90">Adicionar folga trabalhada</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl"
                  onClick={() => setCurrentPage('absence')}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold text-white">Registrar Falta</div>
                      <div className="text-sm text-destructive-foreground/90">Adicionar falta de funcionário</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl"
                  onClick={() => setCurrentPage('reports')}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold text-white">Relatórios</div>
                      <div className="text-sm text-accent-foreground/90">Gerar relatórios do sistema</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="positions">
            <PositionManagement />
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
          
          <TabsContent value="ai">
            <AIReportsTab />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      
      <PWAInstallPrompt />
    </div>
  );
};