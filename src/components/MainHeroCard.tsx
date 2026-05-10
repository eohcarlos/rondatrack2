import { useState, useEffect, memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Activity, Sparkles, TrendingUp, TrendingDown, Clock, CalendarX, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStats } from '@/hooks/useStats';

interface MainHeroCardProps {
  companyName?: string;
  userName?: string;
}

const getGreeting = (hour: number) => {
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
  if (hour >= 18 && hour < 22) return { text: 'Boa noite', emoji: '🌙' };
  return { text: 'Boa madrugada', emoji: '✨' };
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

export const MainHeroCard = memo(({ companyName, userName }: MainHeroCardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { stats } = useStats();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = getGreeting(hour);

  const formattedTime = format(currentTime, 'HH:mm', { locale: ptBR });
  const formattedSeconds = format(currentTime, 'ss', { locale: ptBR });
  const formattedDate = format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const { ftRatio, ftDiff, ftTrendUp, level, levelColor } = useMemo(() => {
    const total = stats.monthlyWorkedLeaves + stats.monthlyAbsences;
    const ratio = total > 0 ? Math.round((stats.monthlyWorkedLeaves / total) * 100) : 0;

    const prev = stats.previousMonthWorkedLeaves;
    const cur = stats.monthlyWorkedLeaves;
    const diff = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);

    let lvl = 'Iniciando';
    let color = 'text-white/70';
    if (ratio >= 90) { lvl = 'Excelente'; color = 'text-emerald-300'; }
    else if (ratio >= 75) { lvl = 'Ótimo'; color = 'text-emerald-300'; }
    else if (ratio >= 50) { lvl = 'Bom'; color = 'text-amber-300'; }
    else if (total > 0) { lvl = 'Atenção'; color = 'text-rose-300'; }

    return { ftRatio: ratio, ftDiff: Math.abs(diff), ftTrendUp: diff >= 0, level: lvl, levelColor: color };
  }, [stats]);

  return (
    <Card className="relative overflow-hidden border-0 rounded-[2rem] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.45)] bg-gradient-to-br from-primary via-primary to-accent">
      {/* Decorative layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-primary-foreground/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary-foreground)) 1px, transparent 0)',
          backgroundSize: '22px 22px'
        }} />
      </div>

      <CardContent className="relative p-5 sm:p-6 text-primary-foreground">
        {/* Top: greeting + clock */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{greeting.emoji}</span>
              <span className="text-primary-foreground/75 text-[11px] font-bold uppercase tracking-[0.18em]">
                {greeting.text}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight truncate">
              {userName || 'Usuário'}
            </h2>
            {companyName && (
              <p className="text-primary-foreground/65 text-xs font-semibold truncate">{companyName}</p>
            )}
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-primary-foreground/20 shadow-lg">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none">
                  {formattedTime}
                </span>
                <span className="text-sm text-primary-foreground/60 font-mono tabular-nums leading-none">
                  :{formattedSeconds}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 pr-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
              </span>
              <span className="text-primary-foreground/60 text-[10px] font-semibold">Online</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-primary-foreground/10 border border-primary-foreground/15 backdrop-blur-sm">
          <Calendar className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
          <span className="text-primary-foreground/80 text-xs font-semibold truncate">{capitalizedDate}</span>
        </div>

        {/* Productivity ring + level */}
        <div className="p-4 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 backdrop-blur-sm mb-3">
          <div className="flex items-center gap-4">
            {/* Circular ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.9155"
                  fill="none"
                  stroke="hsl(var(--primary-foreground) / 0.15)"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.9155"
                  fill="none"
                  stroke="url(#prodGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${ftRatio}, 100`}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(110,231,183,0.6))' }}
                />
                <defs>
                  <linearGradient id="prodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(110 231 183)" />
                    <stop offset="100%" stopColor="rgb(94 234 212)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold leading-none tabular-nums">{ftRatio}%</span>
                <Sparkles className="h-2.5 w-2.5 text-emerald-300 mt-0.5" />
              </div>
            </div>

            {/* Right side */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-primary-foreground/75 text-[11px] font-bold uppercase tracking-wider">
                  Produtividade
                </span>
              </div>
              <p className={`text-base font-bold ${levelColor} leading-tight`}>{level}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {ftTrendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-300" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-300" />
                )}
                <span className={`text-[10px] font-bold ${ftTrendUp ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {ftDiff}%
                </span>
                <span className="text-primary-foreground/55 text-[10px] font-medium">vs mês anterior</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/15 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-emerald-300" />
              <span className="text-primary-foreground/65 text-[9px] font-bold uppercase tracking-wider">FT</span>
            </div>
            <p className="text-lg font-extrabold leading-none tabular-nums">{stats.monthlyWorkedLeaves}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/15 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-1">
              <CalendarX className="h-3 w-3 text-rose-300" />
              <span className="text-primary-foreground/65 text-[9px] font-bold uppercase tracking-wider">Faltas</span>
            </div>
            <p className="text-lg font-extrabold leading-none tabular-nums">{stats.monthlyAbsences}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/15 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-amber-300" />
              <span className="text-primary-foreground/65 text-[9px] font-bold uppercase tracking-wider">Mês</span>
            </div>
            <p className="text-sm font-extrabold leading-none tabular-nums truncate">
              {formatBRL(stats.monthlyWorkedLeavesRevenue)}
            </p>
          </div>
        </div>

        {/* Goal hint */}
        <div className="flex items-center gap-1.5 mt-3 px-2">
          <Target className="h-3 w-3 text-primary-foreground/55" />
          <span className="text-[10px] text-primary-foreground/55 font-medium">
            {ftRatio >= 75 ? 'Meta superada — continue assim!' : 'Meta sugerida: 75% de aproveitamento'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
