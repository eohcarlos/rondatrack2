import { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Plus, Download, Clock, Users, Building2, Calendar, Shield, User, Activity, TrendingUp, TrendingDown, BarChart3, DollarSign, ChevronRight, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { MainHeroCard } from './MainHeroCard';

import { SidebarMenu } from './SidebarMenu';

import { useUserRole } from '@/hooks/useUserRole';
import { ThemeToggle } from './ThemeToggle';
import { useStats } from '@/hooks/useStats';
import { useProfile } from '@/hooks/useProfile';
import { useCountAnimation, useCurrencyAnimation } from '@/hooks/useCountAnimation';
import { supabase } from '@/integrations/supabase/client';
import {
  LazyEmployeeManagement,
  LazyCondominiumManagement,
  LazyPositionManagement,
  LazyWorkedLeavesTab,
  LazyAbsencesTab,
  LazyReportsPanel,
  LazyAIReportsTab,
  LazyScheduleTab,
  LazyThemesTab,
  WithSuspense
} from './LazyComponents';

// Animated number component
const AnimatedNumber = memo(({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const animatedValue = useCountAnimation(value, duration);
  return <>{animatedValue}</>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// Animated currency component  
const AnimatedCurrency = memo(({ value, duration = 1200 }: { value: number; duration?: number }) => {
  const animatedValue = useCurrencyAnimation(value, duration);
  return <>{animatedValue}</>;
});
AnimatedCurrency.displayName = 'AnimatedCurrency';

interface DashboardProps {
  onLogout: () => void;
  onGoHome: () => void;
  companyName?: string;
}

// Trend badge component
const TrendBadge = memo(({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) => {
  if (previous === 0 && current === 0) return null;
  const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);
  const isUp = diff >= 0;
  
  return (
    <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
      isUp 
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
    }`}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(diff)}%{suffix}
    </div>
  );
});
TrendBadge.displayName = 'TrendBadge';

// Mini progress bar
const MiniProgress = memo(({ value, max, color }: { value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mt-2">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
MiniProgress.displayName = 'MiniProgress';

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

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
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
    const current = window.history.state ?? {};
    if (current?.rt !== 'rt_dashboard_tab') {
      window.history.pushState({ ...current, rt: 'rt_dashboard_tab' }, '', window.location.href);
    }
  }, [activeTab]);
  
  const { stats } = useStats();
  const { profile } = useProfile();
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();

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

  // Combined max for progress bars
  const maxMonthly = useMemo(() => Math.max(stats.monthlyWorkedLeaves, stats.monthlyAbsences, stats.previousMonthWorkedLeaves, stats.previousMonthAbsences, 1), [stats]);

  return (
    <>
      
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

      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20 transition-all duration-300 overflow-x-hidden ${isSidebarOpen ? 'blur-sm' : ''}`}>
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

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="container mx-auto px-4 lg:px-8 pt-20 lg:pt-24 pb-32 sm:pb-12 space-y-8 max-w-[1600px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="space-y-6 mt-0">
            {/* Premium Hero Card */}
            <MainHeroCard 
              companyName={companyName} 
              userName={profile?.first_name}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleNavigateFT}
                className="group flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">Registrar FT</span>
              </button>

              <button 
                onClick={handleNavigateAbsence}
                className="group flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">Registrar Falta</span>
              </button>
            </div>

            {/* Primary Stats Grid - Premium Cards with Trends */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {/* FTs do Mês */}
              <Card className="relative overflow-hidden border-0 rounded-3xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-4 lg:p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                      <Clock className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <TrendBadge current={stats.monthlyWorkedLeaves} previous={stats.previousMonthWorkedLeaves} />
                  </div>
                  <p className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={stats.monthlyWorkedLeaves} duration={800} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">FTs este mês</p>
                  <MiniProgress value={stats.monthlyWorkedLeaves} max={maxMonthly} color="bg-gradient-to-r from-primary to-primary/70" />
                </CardContent>
              </Card>

              {/* Faltas do Mês */}
              <Card className="relative overflow-hidden border-0 rounded-3xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-4 lg:p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-lg shadow-destructive/25">
                      <Calendar className="h-5 w-5 text-destructive-foreground" />
                    </div>
                    <TrendBadge current={stats.monthlyAbsences} previous={stats.previousMonthAbsences} />
                  </div>
                  <p className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={stats.monthlyAbsences} duration={900} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Faltas este mês</p>
                  <MiniProgress value={stats.monthlyAbsences} max={maxMonthly} color="bg-gradient-to-r from-destructive to-destructive/70" />
                </CardContent>
              </Card>

              {/* Faturamento do Mês */}
              <Card className="relative overflow-hidden border-0 rounded-3xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-4 lg:p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Zap className="h-3 w-3" />
                      Mês
                    </div>
                  </div>
                  <p className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                    <AnimatedCurrency value={stats.monthlyWorkedLeavesRevenue} duration={1200} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Faturamento FT</p>
                  <MiniProgress value={stats.monthlyWorkedLeavesRevenue} max={Math.max(stats.totalWorkedLeavesRevenue, 1)} color="bg-gradient-to-r from-emerald-500 to-emerald-400" />
                </CardContent>
              </Card>

              {/* Funcionários */}
              <Card className="relative overflow-hidden border-0 rounded-3xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-4 lg:p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/25">
                      <Users className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">Ativos</span>
                  </div>
                  <p className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={stats.totalEmployees} duration={1000} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Funcionários</p>
                  <MiniProgress value={stats.totalEmployees} max={Math.max(stats.totalEmployees, 1)} color="bg-gradient-to-r from-accent to-accent/70" />
                </CardContent>
              </Card>
            </div>

            {/* Premium Charts Section */}
            <DashboardCharts />

            {/* Secondary Stats + Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: More Stats */}
              <Card className="lg:col-span-2 border-0 rounded-3xl bg-card/50 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Resumo Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/15 hover:border-violet-500/30 transition-colors">
                      <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                        <AnimatedNumber value={stats.previousMonthWorkedLeaves} duration={1100} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">FTs mês anterior</p>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/15 hover:border-rose-500/30 transition-colors">
                      <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                        <AnimatedNumber value={stats.previousMonthAbsences} duration={1000} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">Faltas mês anterior</p>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/15 hover:border-cyan-500/30 transition-colors">
                      <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">
                        <AnimatedNumber value={stats.totalCondominiums} duration={900} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">Condomínios</p>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/15 hover:border-amber-500/30 transition-colors">
                      <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                        <AnimatedCurrency value={stats.totalWorkedLeavesRevenue} duration={1400} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">Fat. Total FT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Quick Link */}
              <Card 
                className="border-0 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 shadow-xl cursor-pointer hover:shadow-2xl hover:shadow-slate-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group overflow-hidden relative"
                onClick={handleNavigateReports}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/15 rounded-full blur-xl" />
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center relative z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 backdrop-blur-sm flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform ring-4 ring-amber-400/30">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">Relatórios</h3>
                  <p className="text-sm text-white/80">Gerar e exportar dados</p>
                  <div className="flex items-center gap-1 mt-3 text-amber-400 group-hover:gap-2 transition-all">
                    <span className="text-xs font-medium">Acessar</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
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
          
          <TabsContent value="schedule">
            <WithSuspense>
              <LazyScheduleTab />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="ai">
            <WithSuspense>
              <LazyAIReportsTab />
            </WithSuspense>
          </TabsContent>

          <TabsContent value="themes">
            <WithSuspense>
              <LazyThemesTab />
            </WithSuspense>
          </TabsContent>
        </Tabs>
        </div>
      </main>
      
      <PWAInstallPrompt />
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
