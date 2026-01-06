import { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, User, Activity, TrendingUp, BarChart3, DollarSign, ChevronRight } from 'lucide-react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { MainHeroCard } from './MainHeroCard';

import { SidebarMenu } from './SidebarMenu';
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

// Premium stat card component
const StatCard = memo(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  gradient,
  iconBg
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}) => (
  <Card 
    className={`group relative overflow-hidden transition-all duration-300 border-0 ${gradient}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
      <CardTitle className="text-sm font-semibold text-foreground/90">{title}</CardTitle>
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">{value}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-full opacity-50" />
  </Card>
));

StatCard.displayName = 'StatCard';

// Premium header component
const DashboardHeader = memo(({ 
  companyName, 
  profile, 
  isAdmin, 
  isLoadingRole,
  onLogout,
  onNavigateProfile,
  onNavigateAdmin,
  onMenuOpen
}: {
  companyName?: string;
  profile: { first_name: string; last_name: string; role: string; avatar_url?: string } | null;
  isAdmin: boolean;
  isLoadingRole: boolean;
  onLogout: () => void;
  onNavigateProfile: () => void;
  onNavigateAdmin: () => void;
  onMenuOpen: () => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'gerente': return 'Gerente';
      case 'gestor': return 'Gestor';
      default: return 'Supervisor';
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/70 backdrop-blur-xl shadow-lg border-b border-border/50' 
        : 'bg-background/40 backdrop-blur-sm border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Menu Button - Always visible */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuOpen}
              className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <img 
              src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
              alt="RondaTrack Logo" 
              className="w-10 h-10 lg:w-11 lg:h-11 object-contain"
              loading="lazy"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent lg:text-xl">
                RondaTrack 2
              </h1>
              {companyName && (
                <p className="text-xs text-muted-foreground font-medium hidden sm:block">{companyName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Profile avatar - always visible */}
            {profile && (
              <button 
                onClick={onNavigateProfile}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9 ring-2 ring-primary/30 ring-offset-1 ring-offset-background shadow-md">
                  <AvatarImage src={profile.avatar_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-sm">
                    {profile.first_name.charAt(0)}{profile.last_name?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col text-left">
                  <p className="font-semibold text-foreground text-sm leading-tight">
                    {profile.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(profile.role)}</p>
                </div>
              </button>
            )}
            
            <ThemeToggle />
            
            <Button onClick={onNavigateProfile} variant="ghost" size="sm" className="hover:bg-primary/10 rounded-xl hidden lg:flex">
              <User className="h-4 w-4 mr-2" />
              <span>Perfil</span>
            </Button>
            
            {!isLoadingRole && isAdmin && (
              <Button onClick={onNavigateAdmin} variant="ghost" size="sm" className="text-warning hover:bg-warning/10 rounded-xl hidden lg:flex">
                <Shield className="h-4 w-4 mr-2" />
                <span>Admin</span>
              </Button>
            )}
            
            <Button onClick={onLogout} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive rounded-xl hidden lg:flex">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair</span>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Evita que o botão "Voltar" feche o PWA quando o usuário está em alguma aba interna.
  // Regra: se estiver em qualquer aba (activeTab != 'dashboard'), "Voltar" retorna para o dashboard.
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    // Marca a entrada base do /dashboard no histórico
    const current = window.history.state ?? {};
    if (current?.rt !== 'rt_dashboard_base') {
      window.history.replaceState({ ...current, rt: 'rt_dashboard_base' }, '', window.location.href);
    }

    const handlePopState = () => {
      if (window.location.pathname === '/dashboard' && activeTabRef.current !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') return;

    // Cria uma única entrada "fantasma" no histórico quando sai do dashboard.
    // Assim, o back volta para o dashboard (em vez de sair do app).
    const current = window.history.state ?? {};
    if (current?.rt !== 'rt_dashboard_tab') {
      window.history.pushState({ ...current, rt: 'rt_dashboard_tab' }, '', window.location.href);
    }
  }, [activeTab]);
  
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
  
  const handleOpenSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  
  const setTabDashboard = useCallback(() => setActiveTab('dashboard'), []);
  const setTabEmployees = useCallback(() => setActiveTab('employees'), []);
  const setTabWorkedLeaves = useCallback(() => setActiveTab('worked-leaves'), []);
  const setTabAbsences = useCallback(() => setActiveTab('absences'), []);
  const setTabCondominiums = useCallback(() => setActiveTab('condominiums'), []);

  // Memoized formatted values
  const monthlyRevenue = useMemo(() => formatCurrency(stats.monthlyWorkedLeavesRevenue), [stats.monthlyWorkedLeavesRevenue]);
  const totalRevenue = useMemo(() => formatCurrency(stats.totalWorkedLeavesRevenue), [stats.totalWorkedLeavesRevenue]);

  return (
    <>
      {/* Sidebar Menu - rendered outside main container */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
        isAdmin={isAdmin}
        onNavigateProfile={handleNavigateProfile}
        onNavigateAdmin={handleNavigateAdmin}
        onLogout={handleLogout}
        companyName={companyName}
      />

      <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-all duration-300 ${isSidebarOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <DashboardHeader
          companyName={companyName}
          profile={profile}
          isAdmin={isAdmin}
          isLoadingRole={isLoadingRole}
          onLogout={handleLogout}
          onNavigateProfile={handleNavigateProfile}
          onNavigateAdmin={handleNavigateAdmin}
          onMenuOpen={handleOpenSidebar}
        />

      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-24 pb-24 sm:pb-8 space-y-8 overflow-x-hidden max-w-[1600px] transition-all duration-300`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="space-y-6 mt-0">
            {/* Welcome + Quick Actions - Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 lg:p-8 text-primary-foreground shadow-2xl">
              <div className="absolute inset-0 bg-white/5 opacity-50" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                      Bem-vindo de volta
                    </p>
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                      {profile?.first_name || 'Usuário'}! 👋
                    </h1>
                    <p className="text-primary-foreground/70 text-sm">
                      {companyName || 'Gerencie sua equipe com eficiência'}
                    </p>
                  </div>
                  
                  {/* Quick Actions - Prominent */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleNavigateFT}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-12 px-6 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      Registrar FT
                    </Button>
                    <Button 
                      onClick={handleNavigateAbsence}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm h-12 px-6 rounded-xl font-semibold transition-all hover:scale-105"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Registrar Falta
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - Compact Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* FTs do Mês */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Este mês</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats.monthlyWorkedLeaves}</p>
                  <p className="text-xs text-muted-foreground mt-1">FTs registradas</p>
                </CardContent>
              </Card>

              {/* Faltas do Mês */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-destructive/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-md">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">Este mês</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats.monthlyAbsences}</p>
                  <p className="text-xs text-muted-foreground mt-1">Faltas registradas</p>
                </CardContent>
              </Card>

              {/* Faturamento do Mês */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-emerald-500/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">Este mês</span>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{monthlyRevenue}</p>
                  <p className="text-xs text-muted-foreground mt-1">Faturamento FT</p>
                </CardContent>
              </Card>

              {/* Funcionários */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-accent/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">Total</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats.totalEmployees}</p>
                  <p className="text-xs text-muted-foreground mt-1">Funcionários ativos</p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats + Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: More Stats */}
              <Card className="lg:col-span-2 border-0 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Resumo Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-xl font-bold text-foreground">{stats.previousMonthWorkedLeaves}</p>
                      <p className="text-xs text-muted-foreground">FTs mês anterior</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-xl font-bold text-foreground">{stats.previousMonthAbsences}</p>
                      <p className="text-xs text-muted-foreground">Faltas mês anterior</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-xl font-bold text-foreground">{stats.totalCondominiums}</p>
                      <p className="text-xs text-muted-foreground">Condomínios</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-lg font-bold text-foreground">{totalRevenue}</p>
                      <p className="text-xs text-muted-foreground">Fat. Total FT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Quick Link */}
              <Card 
                className="border-0 bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                onClick={handleNavigateReports}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                    <Download className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">Relatórios</h3>
                  <p className="text-xs text-muted-foreground">Gerar e exportar dados</p>
                  <ChevronRight className="h-5 w-5 text-accent mt-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
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
      
        <PWAInstallPrompt />
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
