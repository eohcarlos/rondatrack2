import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  return (
    <Card className="relative overflow-hidden border-0 rounded-[2rem] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.45)] bg-gradient-to-br from-primary via-primary to-accent">
      {/* Decorative layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-primary-foreground/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 left-1/2 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary-foreground)) 1px, transparent 0)',
          backgroundSize: '22px 22px'
        }} />
        {/* Glossy sheen */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary-foreground/10 to-transparent" />
      </div>

      <CardContent className="relative p-6 sm:p-7 text-primary-foreground">
        {/* Top row: greeting badge + clock */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/15 backdrop-blur-md border border-primary-foreground/20 shadow-sm">
            <span className="text-base leading-none">{greeting.emoji}</span>
            <span className="text-primary-foreground/90 text-[11px] font-bold uppercase tracking-[0.18em]">
              {greeting.text}
            </span>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-2xl px-4 py-2 border border-primary-foreground/20 shadow-lg">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums leading-none">
                  {formattedTime}
                </span>
                <span className="text-xs text-primary-foreground/60 font-mono tabular-nums leading-none">
                  :{formattedSeconds}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 pr-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
              </span>
              <span className="text-primary-foreground/70 text-[10px] font-semibold">Online</span>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1 mb-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.05] truncate drop-shadow-sm">
            {userName || 'Usuário'}
          </h2>
          {companyName && (
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground/70" />
              <p className="text-primary-foreground/75 text-sm font-semibold truncate">
                {companyName}
              </p>
            </div>
          )}
        </div>

        {/* Date pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-foreground/12 border border-primary-foreground/18 backdrop-blur-sm max-w-full">
          <Calendar className="h-3.5 w-3.5 text-primary-foreground/80 flex-shrink-0" />
          <span className="text-primary-foreground/90 text-xs font-semibold truncate">
            {capitalizedDate}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
