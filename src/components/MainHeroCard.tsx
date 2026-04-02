import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Sun, Moon, CloudSun, Sunrise, Activity, Sparkles } from 'lucide-react';
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
  const formattedDate = format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const totalActivity = stats.monthlyWorkedLeaves + stats.monthlyAbsences;
  const ftRatio = totalActivity > 0 ? Math.round((stats.monthlyWorkedLeaves / totalActivity) * 100) : 0;

  return (
    <Card className="relative overflow-hidden border-0 rounded-[1.75rem] shadow-2xl bg-gradient-to-br from-primary via-primary to-accent/80">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <CardContent className="relative p-5 sm:p-6">
        {/* Top: greeting + clock */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{greeting.emoji}</span>
              <span className="text-white/70 text-xs font-semibold uppercase tracking-[0.15em]">{greeting.text}</span>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-bold tracking-tight leading-tight">
              {userName || 'Usuário'}
            </h2>
            {companyName && (
              <p className="text-white/50 text-xs font-medium">{companyName}</p>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className="bg-white/[0.12] backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/[0.08]">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums leading-none">
                  {formattedTime}
                </span>
                <span className="text-sm text-white/40 font-mono tabular-nums leading-none">
                  :{formattedSeconds}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 pr-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-white/40 text-[10px] font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-white/[0.07] border border-white/[0.05]">
          <Calendar className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />
          <span className="text-white/60 text-xs font-medium truncate">{capitalizedDate}</span>
        </div>

        {/* Productivity */}
        <div className="p-3 rounded-2xl bg-white/[0.07] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Activity className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-white/60 text-[11px] font-semibold">Produtividade do mês</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold">{ftRatio}%</span>
            </div>
          </div>
          <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(52,211,153,0.4)]"
              style={{ width: `${ftRatio}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
