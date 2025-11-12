import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/company';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, User, UserCheck, Activity, TrendingUp, BarChart3, Briefcase, Sparkles, DollarSign } from 'lucide-react';
import { EmployeeManagement } from './EmployeeManagement';
import { CondominiumManagement } from './CondominiumManagement';
import { PositionManagement } from './PositionManagement';
import { WorkedLeavesTab } from './WorkedLeavesTab';
import { AbsencesTab } from './AbsencesTab';
import { ReportsPanel } from './ReportsPanel';
import { AIReportsTab } from './AIReportsTab';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { DailyPhrase } from './DailyPhrase';
import { BottomNav } from './BottomNav';
import { useUserRole } from '@/hooks/useUserRole';
import { ThemeToggle } from './ThemeToggle';
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
  avatar_url?: string;
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
  monthlyWorkedLeavesRevenue: number;
  totalWorkedLeavesRevenue: number;
}
export const Dashboard = ({
  onLogout,
  onGoHome,
  companyName
}: DashboardProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    monthlyWorkedLeaves: 0,
    monthlyAbsences: 0,
    totalAbsences: 0,
    totalCondominiums: 0,
    totalWorkedLeaves: 0,
    previousMonthWorkedLeaves: 0,
    previousMonthAbsences: 0,
    monthlyWorkedLeavesRevenue: 0,
    totalWorkedLeavesRevenue: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    toast
  } = useToast();
  const {
    isAdmin,
    isLoading: isLoadingRole
  } = useUserRole();

  // Recarrega stats quando voltar para o dashboard
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Recarregando stats ao voltar para dashboard...');
      loadStats();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  useEffect(() => {
    loadProfile();
    loadStats();
    setupRealtimeSubscription();
  }, []);
  const setupRealtimeSubscription = () => {
    const channels = [supabase.channel('employees-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'employees'
    }, loadStats), supabase.channel('worked-leaves-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'worked_leaves'
    }, loadStats), supabase.channel('absences-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'absences'
    }, loadStats), supabase.channel('condominiums-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'condominiums'
    }, loadStats)];
    channels.forEach(channel => channel.subscribe());
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  };
  const loadProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const loadStats = async () => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) return;

      // Total de funcionários
      const {
        count: employeesCount
      } = await supabase.from('employees').select('*', {
        count: 'exact',
        head: true
      }).eq('active', true).eq('company_id', companyId);

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
        mesAtual: {
          inicio: startOfMonth,
          fim: startOfNextMonth
        },
        mesAnterior: {
          inicio: startOfPrevMonth,
          fim: startOfMonth
        }
      });

      // FTs do mês atual
      const {
        count: ftCount
      } = await supabase.from('worked_leaves').select('*', {
        count: 'exact',
        head: true
      }).gte('date', startOfMonth).lt('date', startOfNextMonth).eq('company_id', companyId);

      // FTs do mês anterior
      const {
        count: prevFtCount,
        data: prevFtData,
        error: prevFtError
      } = await supabase.from('worked_leaves').select('*', {
        count: 'exact',
        head: false
      }).gte('date', startOfPrevMonth).lt('date', startOfMonth).eq('company_id', companyId);
      console.log('📊 FTs mês anterior:', {
        count: prevFtCount,
        data: prevFtData,
        error: prevFtError
      });

      // Faltas do mês atual
      const {
        count: absencesCount
      } = await supabase.from('absences').select('*', {
        count: 'exact',
        head: true
      }).gte('date', startOfMonth).lt('date', startOfNextMonth).eq('company_id', companyId);

      // Faltas do mês anterior
      const {
        count: prevAbsencesCount,
        data: prevAbsencesData,
        error: prevAbsencesError
      } = await supabase.from('absences').select('*', {
        count: 'exact',
        head: false
      }).gte('date', startOfPrevMonth).lt('date', startOfMonth).eq('company_id', companyId);
      console.log('📊 Faltas mês anterior:', {
        count: prevAbsencesCount,
        data: prevAbsencesData,
        error: prevAbsencesError
      });

      // Total de faltas
      const {
        count: totalAbsencesCount
      } = await supabase.from('absences').select('*', {
        count: 'exact',
        head: true
      }).eq('company_id', companyId);

      // Total de condomínios
      const {
        count: condominiumsCount
      } = await supabase.from('condominiums').select('*', {
        count: 'exact',
        head: true
      }).eq('company_id', companyId);

      // Total de FTs (todas)
      const {
        count: totalFtCount
      } = await supabase.from('worked_leaves').select('*', {
        count: 'exact',
        head: true
      }).eq('company_id', companyId);

      // Faturamento de FTs do mês atual
      const {
        data: monthlyFtRevenue
      } = await supabase.from('worked_leaves').select('amount').gte('date', startOfMonth).lt('date', startOfNextMonth).eq('company_id', companyId);

      // Faturamento total de FTs
      const {
        data: totalFtRevenue
      } = await supabase.from('worked_leaves').select('amount').eq('company_id', companyId);
      const monthlyRevenue = monthlyFtRevenue?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      const totalRevenue = totalFtRevenue?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      const newStats = {
        totalEmployees: employeesCount || 0,
        monthlyWorkedLeaves: ftCount || 0,
        monthlyAbsences: absencesCount || 0,
        totalAbsences: totalAbsencesCount || 0,
        totalCondominiums: condominiumsCount || 0,
        totalWorkedLeaves: totalFtCount || 0,
        previousMonthWorkedLeaves: prevFtCount || 0,
        previousMonthAbsences: prevAbsencesCount || 0,
        monthlyWorkedLeavesRevenue: monthlyRevenue,
        totalWorkedLeavesRevenue: totalRevenue
      };
      console.log('📈 Stats atualizadas:', newStats);
      setStats(newStats);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gerente':
        return 'bg-destructive text-destructive-foreground';
      case 'gestor':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'gerente':
        return 'Gerente';
      case 'gestor':
        return 'Gestor';
      default:
        return 'Supervisor';
    }
  };

  // Dashboard sempre renderiza apenas o dashboard principal

  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header - Moderno e Elegante */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo e Branding */}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-sm group-hover:blur-md transition-all opacity-50"></div>
                <div className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-2.5 flex items-center justify-center shadow-lg">
                  <img src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" alt="RondaTrack Logo" className="w-full h-full object-contain" onError={e => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                  const icon = img.nextElementSibling as HTMLElement;
                  if (icon) icon.style.display = 'flex';
                }} />
                  <Shield className="h-6 w-6 text-primary-foreground hidden" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent lg:text-xl text-left py-0 my-0 mx-0 px-[30px]">RondaTrack</h1>
                {companyName && <p className="text-xs text-muted-foreground font-medium px-[30px]">{companyName}</p>}
              </div>
            </div>

            {/* User Info e Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {profile && <div className="hidden md:flex items-center gap-3 mr-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="text-right">
                    <p className="font-semibold text-foreground text-sm leading-tight">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(profile.role)}</p>
                  </div>
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                    <AvatarImage src={profile.avatar_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-sm">
                      {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>}
              
              <ThemeToggle />
              
              <Button onClick={() => navigate('/dashboard/profile')} variant="ghost" size="sm" className="hover:bg-muted rounded-xl">
                <User className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Perfil</span>
              </Button>
              
              {!isLoadingRole && isAdmin && <Button onClick={() => navigate('/dashboard/admin')} variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl">
                  <Shield className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Admin</span>
                </Button>}
              
              <Button onClick={handleLogout} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive rounded-xl">
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 lg:px-12 py-8 pb-24 sm:pb-8 space-y-8 overflow-x-hidden max-w-[1600px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs - Grid on Desktop */}
          <TabsList className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 mb-8 h-auto p-2 bg-card/50 backdrop-blur-sm gap-2 w-full rounded-xl border border-border/50 shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Users className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Funcionários</span>
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Briefcase className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Cargos</span>
            </TabsTrigger>
            <TabsTrigger value="condominiums" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Building2 className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Condomínios</span>
            </TabsTrigger>
            <TabsTrigger value="worked-leaves" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>FT</span>
            </TabsTrigger>
            <TabsTrigger value="absences" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Faltas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Download className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center justify-center gap-2 p-4 text-sm lg:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-muted/50">
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>IA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Frase do Dia */}
            <DailyPhrase />

            {/* Stats Cards */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                Estatísticas do Mês Atual
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                <Card className="group hover:shadow-xl transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-primary/5 cursor-pointer hover:scale-105" onClick={() => setActiveTab('worked-leaves')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-primary">FTs do Mês</CardTitle>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.monthlyWorkedLeaves}</div>
                    <p className="text-sm text-muted-foreground">Folgas trabalhadas registradas</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-destructive/20 bg-gradient-to-br from-card to-destructive/5 cursor-pointer hover:scale-105" onClick={() => setActiveTab('absences')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-destructive">Faltas do Mês</CardTitle>
                    <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                      <Calendar className="h-6 w-6 text-destructive" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.monthlyAbsences}</div>
                    <p className="text-sm text-muted-foreground">Faltas registradas no período</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-success/20 bg-gradient-to-br from-card to-success/5 cursor-pointer hover:scale-105" onClick={() => setActiveTab('worked-leaves')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-success">Faturamento FT Mês</CardTitle>
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(stats.monthlyWorkedLeavesRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total em folgas trabalhadas</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Stats do Mês Anterior */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
                Estatísticas do Mês Anterior
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                <Card className="group hover:shadow-xl transition-all duration-300 border-primary/10 bg-gradient-to-br from-card to-primary/3 cursor-pointer hover:scale-105" onClick={() => setActiveTab('worked-leaves')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-primary/80">FTs do Mês Anterior</CardTitle>
                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Clock className="h-6 w-6 text-primary/70" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.previousMonthWorkedLeaves}</div>
                    <p className="text-sm text-muted-foreground">Folgas trabalhadas no mês passado</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-destructive/10 bg-gradient-to-br from-card to-destructive/3 cursor-pointer hover:scale-105" onClick={() => setActiveTab('absences')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-destructive/80">Faltas do Mês Anterior</CardTitle>
                    <div className="w-12 h-12 bg-destructive/5 rounded-xl flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                      <Calendar className="h-6 w-6 text-destructive/70" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.previousMonthAbsences}</div>
                    <p className="text-sm text-muted-foreground">Faltas registradas no mês passado</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Stats Gerais */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-accent" />
                Estatísticas Gerais
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">

                <Card className="group hover:shadow-xl transition-all duration-300 border-accent/20 bg-gradient-to-br from-card to-accent/5 cursor-pointer hover:scale-105" onClick={() => setActiveTab('employees')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-accent">Funcionários</CardTitle>
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.totalEmployees}</div>
                    <p className="text-sm text-muted-foreground">Total ativos</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-warning/20 bg-gradient-to-br from-card to-warning/5 cursor-pointer hover:scale-105" onClick={() => setActiveTab('condominiums')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-warning">Condomínios</CardTitle>
                    <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <Building2 className="h-6 w-6 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.totalCondominiums}</div>
                    <p className="text-sm text-muted-foreground">Locais cadastrados</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 border-success/20 bg-gradient-to-br from-card to-success/5 cursor-pointer hover:scale-105" onClick={() => setActiveTab('worked-leaves')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-success">Faturamento Total FT</CardTitle>
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(stats.totalWorkedLeavesRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total acumulado de FTs</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Plus className="h-6 w-6 text-primary" />
                Ações Rápidas
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl" onClick={() => navigate('/dashboard/ft')}>
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

                <Button className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl" onClick={() => navigate('/dashboard/absence')}>
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

                <Button className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl" onClick={() => navigate('/dashboard/reports')}>
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
    </div>;
};