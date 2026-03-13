import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, Sun, Moon, CloudSun, Sunrise, Users, Building2, TrendingUp, Activity, Briefcase, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStats } from '@/hooks/useStats';

interface MainHeroCardProps {
  companyName?: string;
  userName?: string;
}

const getGreeting = (hour: number) => {
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', icon: Sunrise, color: 'from-amber-400 to-orange-500', bg: 'from-amber-500/20 to-orange-500/10' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', icon: CloudSun, color: 'from-orange-400 to-rose-500', bg: 'from-orange-500/20 to-rose-500/10' };
  if (hour >= 18 && hour < 22) return { text: 'Boa noite', icon: Sun, color: 'from-indigo-400 to-purple-600', bg: 'from-indigo-500/20 to-purple-500/10' };
  return { text: 'Boa madrugada', icon: Moon, color: 'from-slate-600 to-slate-800', bg: 'from-slate-500/20 to-slate-700/10' };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

export const MainHeroCard = memo(({ companyName, userName }: MainHeroCardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { stats } = useStats();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = getGreeting(hour);
  const GreetingIcon = greeting.icon;

  const formattedTime = format(currentTime, 'HH:mm:ss', { locale: ptBR });
  const formattedDate = format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedYear = format(currentTime, 'yyyy');
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Calculate daily productivity indicator
  const totalActivity = stats.monthlyWorkedLeaves + stats.monthlyAbsences;
  const ftRatio = totalActivity > 0 ? Math.round((stats.monthlyWorkedLeaves / totalActivity) * 100) : 0;

  const miniStats = [
    { icon: Clock, label: 'FTs Mês', value: stats.monthlyWorkedLeaves, color: 'text-primary bg-primary/15' },
    { icon: Calendar, label: 'Faltas', value: stats.monthlyAbsences, color: 'text-destructive bg-destructive/15' },
    { icon: Users, label: 'Equipe', value: stats.totalEmployees, color: 'text-accent bg-accent/15' },
    { icon: TrendingUp, label: 'Fat.', value: formatCurrency(stats.monthlyWorkedLeavesRevenue), color: 'text-emerald-500 bg-emerald-500/15', isString: true },
  ];

  return (
    <Card className="relative overflow-hidden border-0 rounded-[2rem] bg-gradient-to-br from-primary via-primary/95 to-accent shadow-2xl ring-1 ring-white/10">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} 
        />
      </div>

      <CardContent className="relative p-4 sm:p-5 lg:p-6 space-y-4">
        {/* Top Section: Greeting + Clock */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          {/* Mobile: Icon + Time row */}
          <div className="flex items-center justify-between sm:contents">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br ${greeting.color} flex items-center justify-center shadow-xl ring-2 ring-white/20 flex-shrink-0`}>
              <GreetingIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white drop-shadow-lg" />
            </div>

            {/* Time - Mobile */}
            <div className="flex flex-col items-end sm:hidden">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  {formattedTime.slice(0, 5)}
                </span>
                <span className="text-sm font-medium text-white/40 font-mono tabular-nums">
                  {formattedTime.slice(5)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-white/40 text-[10px]">Online</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white/60 text-[11px] sm:text-xs font-medium uppercase tracking-wider">{greeting.text}</p>
              {companyName && (
                <>
                  <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:block" />
                  <span className="text-white/50 text-[11px] sm:text-xs truncate hidden sm:block max-w-[120px]">{companyName}</span>
                </>
              )}
            </div>
            <h2 className="text-white text-base sm:text-lg lg:text-xl font-bold tracking-tight">
              {userName || 'Usuário'} 👋
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-white/60 text-xs sm:text-sm">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">{capitalizedDate}, {formattedYear}</span>
              </div>
              {companyName && (
                <span className="text-white/50 text-[11px] truncate sm:hidden">{companyName}</span>
              )}
            </div>
          </div>

          {/* Time - Desktop */}
          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <div className="flex items-baseline">
              <span className="text-3xl lg:text-4xl font-bold text-white font-mono tabular-nums">
                {formattedTime.slice(0, 5)}
              </span>
              <span className="text-lg lg:text-xl font-medium text-white/40 font-mono tabular-nums">
                {formattedTime.slice(5)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-white/40 text-xs">Online</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Mini Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {miniStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.12] transition-colors">
                <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-white font-bold text-sm tabular-nums leading-none">
                  {stat.isString ? stat.value : stat.value}
                </span>
                <span className="text-white/45 text-[9px] font-medium leading-none">{stat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Productivity Bar */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-[10px] font-medium">Produtividade do mês</span>
              <span className="text-emerald-400 text-[10px] font-bold">{ftRatio}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-1000 ease-out"
                style={{ width: `${ftRatio}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
