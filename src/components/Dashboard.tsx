import { useState, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, User, Activity, TrendingUp, BarChart3, Briefcase, Sparkles, DollarSign } from 'lucide-react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { DailyPhrase } from './DailyPhrase';
import { BottomNav } from './BottomNav';
import { useUserRole } from '@/hooks/useUserRole';
import { ThemeToggle } from './ThemeToggle';
import { useStats } from '@/hooks/useStats';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import {
  LazyEmployeeManagement,
  LazyCondominiumManagement,
  LazyPositionManagement,
  LazyWorkedLeavesTab,
  LazyAbsencesTab,
  LazyReportsPanel,
  LazyAIReportsTab,
  WithSuspense
} from './LazyComponents';

interface DashboardProps {
  onLogout: () => void;
  onGoHome: () => void;
  companyName?: string;
}

// Memoized stat card component
const StatCard = memo(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  colorClass,
  onClick 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ElementType;
  colorClass: string;
  onClick?: () => void;
}) => (
  <Card 
    className={`group hover:shadow-xl transition-all duration-300 border-${colorClass}/20 bg-gradient-to-br from-card to-${colorClass}/5 cursor-pointer hover:scale-105`} 
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className={`text-base font-semibold text-${colorClass}`}>{title}</CardTitle>
      <div className={`w-12 h-12 bg-${colorClass}/10 rounded-xl flex items-center justify-center group-hover:bg-${colorClass}/20 transition-colors`}>
        <Icon className={`h-6 w-6 text-${colorClass}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Memoized header component
const DashboardHeader = memo(({ 
  companyName, 
  profile, 
  isAdmin, 
  isLoadingRole,
  onLogout,
  onNavigateProfile,
  onNavigateAdmin
}: {
  companyName?: string;
  profile: { first_name: string; last_name: string; role: string; avatar_url?: string } | null;
  isAdmin: boolean;
  isLoadingRole: boolean;
  onLogout: () => void;
  onNavigateProfile: () => void;
  onNavigateAdmin: () => void;
}) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'gerente': return 'Gerente';
      case 'gestor': return 'Gestor';
      default: return 'Supervisor';
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-sm group-hover:blur-md transition-all opacity-50"></div>
              <div className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-2.5 flex items-center justify-center shadow-lg">
                <img 
                  src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
                  alt="RondaTrack Logo" 
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent lg:text-xl text-left py-0 my-0 px-0 mx-[30px]">
                RondaTrack
              </h1>
              {companyName && (
                <p className="text-xs text-muted-foreground font-medium px-0 mx-[30px]">{companyName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {profile && (
              <div className="hidden md:flex items-center gap-3 mr-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm leading-tight">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(profile.role)}</p>
                </div>
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile.avatar_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-sm">
                    {profile.first_name.charAt(0)}{profile.last_name?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            <ThemeToggle />
            
            <Button onClick={onNavigateProfile} variant="ghost" size="sm" className="hover:bg-muted rounded-xl">
              <User className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Perfil</span>
            </Button>
            
            {!isLoadingRole && isAdmin && (
              <Button onClick={onNavigateAdmin} variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl">
                <Shield className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Admin</span>
              </Button>
            )}
            
            <Button onClick={onLogout} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive rounded-xl">
              <LogOut className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

// Currency formatter - memoized
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const Dashboard = memo(({ onLogout, onGoHome, companyName }: DashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use optimized hooks
  const { stats } = useStats();
  const { profile } = useProfile();
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();

  // Memoized callbacks
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    onLogout();
  }, [onLogout]);

  const handleNavigateProfile = useCallback(() => navigate('/dashboard/profile'), [navigate]);
  const handleNavigateAdmin = useCallback(() => navigate('/dashboard/admin'), [navigate]);
  const handleNavigateFT = useCallback(() => navigate('/dashboard/ft'), [navigate]);
  const handleNavigateAbsence = useCallback(() => navigate('/dashboard/absence'), [navigate]);
  const handleNavigateReports = useCallback(() => navigate('/dashboard/reports'), [navigate]);
  
  const setTabDashboard = useCallback(() => setActiveTab('dashboard'), []);
  const setTabEmployees = useCallback(() => setActiveTab('employees'), []);
  const setTabWorkedLeaves = useCallback(() => setActiveTab('worked-leaves'), []);
  const setTabAbsences = useCallback(() => setActiveTab('absences'), []);
  const setTabCondominiums = useCallback(() => setActiveTab('condominiums'), []);

  // Memoized formatted values
  const monthlyRevenue = useMemo(() => formatCurrency(stats.monthlyWorkedLeavesRevenue), [stats.monthlyWorkedLeavesRevenue]);
  const totalRevenue = useMemo(() => formatCurrency(stats.totalWorkedLeavesRevenue), [stats.totalWorkedLeavesRevenue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <DashboardHeader
        companyName={companyName}
        profile={profile}
        isAdmin={isAdmin}
        isLoadingRole={isLoadingRole}
        onLogout={handleLogout}
        onNavigateProfile={handleNavigateProfile}
        onNavigateAdmin={handleNavigateAdmin}
      />

      <div className="container mx-auto px-6 lg:px-12 py-8 pb-24 sm:pb-8 space-y-8 overflow-x-hidden max-w-[1600px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <DailyPhrase />

            {/* Stats do Mês Atual */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                Estatísticas do Mês Atual
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                <Card className="group hover:shadow-xl transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-primary/5 cursor-pointer hover:scale-105" onClick={setTabWorkedLeaves}>
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

                <Card className="group hover:shadow-xl transition-all duration-300 border-destructive/20 bg-gradient-to-br from-card to-destructive/5 cursor-pointer hover:scale-105" onClick={setTabAbsences}>
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

                <Card className="group hover:shadow-xl transition-all duration-300 border-success/20 bg-gradient-to-br from-card to-success/5 cursor-pointer hover:scale-105" onClick={setTabWorkedLeaves}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-success">Faturamento FT Mês</CardTitle>
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{monthlyRevenue}</div>
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
                <Card className="group hover:shadow-xl transition-all duration-300 border-primary/10 bg-gradient-to-br from-card to-primary/3 cursor-pointer hover:scale-105" onClick={setTabWorkedLeaves}>
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

                <Card className="group hover:shadow-xl transition-all duration-300 border-destructive/10 bg-gradient-to-br from-card to-destructive/3 cursor-pointer hover:scale-105" onClick={setTabAbsences}>
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
                <Card className="group hover:shadow-xl transition-all duration-300 border-accent/20 bg-gradient-to-br from-card to-accent/5 cursor-pointer hover:scale-105" onClick={setTabEmployees}>
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

                <Card className="group hover:shadow-xl transition-all duration-300 border-warning/20 bg-gradient-to-br from-card to-warning/5 cursor-pointer hover:scale-105" onClick={setTabCondominiums}>
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

                <Card className="group hover:shadow-xl transition-all duration-300 border-success/20 bg-gradient-to-br from-card to-success/5 cursor-pointer hover:scale-105" onClick={setTabWorkedLeaves}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold text-success">Faturamento Total FT</CardTitle>
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{totalRevenue}</div>
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
                <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl" onClick={handleNavigateFT}>
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

                <Button className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl" onClick={handleNavigateAbsence}>
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

                <Button className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-auto p-6 rounded-xl" onClick={handleNavigateReports}>
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
            <WithSuspense>
              <LazyEmployeeManagement />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="positions">
            <WithSuspense>
              <LazyPositionManagement />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="condominiums">
            <WithSuspense>
              <LazyCondominiumManagement />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="worked-leaves">
            <WithSuspense>
              <LazyWorkedLeavesTab />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="absences">
            <WithSuspense>
              <LazyAbsencesTab />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="reports">
            <WithSuspense>
              <LazyReportsPanel onClose={setTabDashboard} />
            </WithSuspense>
          </TabsContent>
          
          <TabsContent value="ai">
            <WithSuspense>
              <LazyAIReportsTab />
            </WithSuspense>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      <PWAInstallPrompt />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
