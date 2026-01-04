import { useState, useCallback, memo, useMemo, useEffect } from 'react';
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
  iconBg,
  onClick 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  onClick?: () => void;
}) => (
  <Card 
    className={`group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-0 ${gradient}`}
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
      <CardTitle className="text-sm font-semibold text-foreground/90">{title}</CardTitle>
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
                RondaTrack
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
          <TabsContent value="dashboard" className="space-y-8 mt-0">
            <MainHeroCard companyName={companyName} userName={profile?.first_name} />

            {/* Stats do Mês Atual */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Estatísticas do Mês</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <StatCard
                  title="FTs do Mês"
                  value={stats.monthlyWorkedLeaves}
                  description="Folgas trabalhadas registradas"
                  icon={Clock}
                  gradient="bg-gradient-to-br from-card via-card to-primary/10 border border-primary/20 shadow-lg"
                  iconBg="bg-gradient-to-br from-primary to-primary/70"
                  onClick={setTabWorkedLeaves}
                />

                <StatCard
                  title="Faltas do Mês"
                  value={stats.monthlyAbsences}
                  description="Faltas registradas no período"
                  icon={Calendar}
                  gradient="bg-gradient-to-br from-card via-card to-destructive/10 border border-destructive/20 shadow-lg"
                  iconBg="bg-gradient-to-br from-destructive to-destructive/70"
                  onClick={setTabAbsences}
                />

                <StatCard
                  title="Faturamento FT Mês"
                  value={monthlyRevenue}
                  description="Total em folgas trabalhadas"
                  icon={DollarSign}
                  gradient="bg-gradient-to-br from-card via-card to-emerald-500/10 border border-emerald-500/20 shadow-lg"
                  iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  onClick={setTabWorkedLeaves}
                />
              </div>
            </div>

            {/* Stats do Mês Anterior */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted-foreground/50 to-muted-foreground/30 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Mês Anterior</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <StatCard
                  title="FTs do Mês Anterior"
                  value={stats.previousMonthWorkedLeaves}
                  description="Folgas trabalhadas no mês passado"
                  icon={Clock}
                  gradient="bg-gradient-to-br from-card via-card to-muted/50 border border-border/50 shadow-md"
                  iconBg="bg-gradient-to-br from-primary/70 to-primary/50"
                  onClick={setTabWorkedLeaves}
                />

                <StatCard
                  title="Faltas do Mês Anterior"
                  value={stats.previousMonthAbsences}
                  description="Faltas registradas no mês passado"
                  icon={Calendar}
                  gradient="bg-gradient-to-br from-card via-card to-muted/50 border border-border/50 shadow-md"
                  iconBg="bg-gradient-to-br from-destructive/70 to-destructive/50"
                  onClick={setTabAbsences}
                />
              </div>
            </div>

            {/* Stats Gerais */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Estatísticas Gerais</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <StatCard
                  title="Funcionários"
                  value={stats.totalEmployees}
                  description="Total ativos"
                  icon={Users}
                  gradient="bg-gradient-to-br from-card via-card to-accent/10 border border-accent/20 shadow-lg"
                  iconBg="bg-gradient-to-br from-accent to-accent/70"
                  onClick={setTabEmployees}
                />

                <StatCard
                  title="Condomínios"
                  value={stats.totalCondominiums}
                  description="Locais cadastrados"
                  icon={Building2}
                  gradient="bg-gradient-to-br from-card via-card to-warning/10 border border-warning/20 shadow-lg"
                  iconBg="bg-gradient-to-br from-warning to-warning/70"
                  onClick={setTabCondominiums}
                />

                <StatCard
                  title="Faturamento Total FT"
                  value={totalRevenue}
                  description="Total acumulado de FTs"
                  icon={DollarSign}
                  gradient="bg-gradient-to-br from-card via-card to-emerald-500/10 border border-emerald-500/20 shadow-lg"
                  iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  onClick={setTabWorkedLeaves}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Ações Rápidas</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Button 
                  className="group relative overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-500 h-auto p-5 rounded-2xl border-0" 
                  onClick={handleNavigateFT}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="flex items-center space-x-4 w-full relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-lg font-bold">Registrar FT</div>
                      <div className="text-sm opacity-90">Adicionar folga trabalhada</div>
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Button>

                <Button 
                  className="group relative overflow-hidden bg-gradient-to-r from-destructive via-destructive to-destructive/90 text-destructive-foreground shadow-xl hover:shadow-2xl transition-all duration-500 h-auto p-5 rounded-2xl border-0" 
                  onClick={handleNavigateAbsence}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="flex items-center space-x-4 w-full relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-lg font-bold">Registrar Falta</div>
                      <div className="text-sm opacity-90">Adicionar falta de funcionário</div>
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Button>

                <Button 
                  className="group relative overflow-hidden bg-gradient-to-r from-accent via-accent to-accent/90 text-accent-foreground shadow-xl hover:shadow-2xl transition-all duration-500 h-auto p-5 rounded-2xl border-0" 
                  onClick={handleNavigateReports}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="flex items-center space-x-4 w-full relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Download className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-lg font-bold">Relatórios</div>
                      <div className="text-sm opacity-90">Gerar relatórios do sistema</div>
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
      
        <PWAInstallPrompt />
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
