import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Droplets, Wind, MapPin, Thermometer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWeather } from '@/hooks/useWeather';

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
  const { data: weather, loading: weatherLoading } = useWeather();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = getGreeting(hour);

  const formattedTime = format(currentTime, 'HH:mm', { locale: ptBR });
  const formattedSeconds = format(currentTime, 'ss', { locale: ptBR });
  const dayNumber = format(currentTime, 'dd');
  const weekday = format(currentTime, 'EEEE', { locale: ptBR });
  const monthYear = format(currentTime, "MMM 'de' yyyy", { locale: ptBR });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Card className="relative overflow-hidden border-0 rounded-[2rem] shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.6)] bg-gradient-to-br from-primary via-primary to-accent">
      {/* Decorative layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-primary-foreground/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 left-1/2 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary-foreground)) 1px, transparent 0)',
          backgroundSize: '22px 22px'
        }} />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary-foreground/10 to-transparent" />
      </div>

      <CardContent className="relative p-6 sm:p-7 text-primary-foreground">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-5">
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

        {/* Calendar tile (premium) */}
        <div className="flex items-stretch gap-3 mb-4">
          <div className="relative rounded-2xl overflow-hidden bg-primary-foreground shadow-xl shrink-0 w-[78px] flex flex-col">
            <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider text-center py-1">
              {cap(format(currentTime, 'MMM', { locale: ptBR }))}
            </div>
            <div className="flex-1 flex items-center justify-center bg-primary-foreground">
              <span className="text-primary text-[40px] font-extrabold leading-none tabular-nums">
                {dayNumber}
              </span>
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-md p-3 flex flex-col justify-center min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary-foreground/60 mb-0.5">
              Hoje
            </div>
            <div className="text-base font-bold truncate leading-tight">{cap(weekday)}</div>
            <div className="text-xs text-primary-foreground/70 font-semibold truncate">{cap(monthYear)}</div>
          </div>
        </div>

        {/* Weather widget */}
        <div className="relative rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-md p-4 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl" />
          {weatherLoading && !weather ? (
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm animate-pulse">
              Carregando clima…
            </div>
          ) : weather ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-4xl leading-none drop-shadow-lg">{weather.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tabular-nums leading-none">{weather.temperature}°</span>
                      <span className="text-primary-foreground/70 text-xs font-semibold">C</span>
                    </div>
                    <p className="text-primary-foreground/90 text-xs font-semibold mt-0.5 truncate">
                      {weather.condition}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary-foreground/15 border border-primary-foreground/20 shrink-0 max-w-[55%]">
                  <MapPin className="h-3 w-3 text-primary-foreground/80 shrink-0" />
                  <span className="text-[11px] font-bold truncate">{weather.city}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-primary-foreground/15">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-primary-foreground/70" />
                  <div className="leading-tight">
                    <div className="text-[9px] text-primary-foreground/60 uppercase font-bold tracking-wider">Sensação</div>
                    <div className="text-xs font-bold tabular-nums">{weather.feelsLike}°</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-primary-foreground/70" />
                  <div className="leading-tight">
                    <div className="text-[9px] text-primary-foreground/60 uppercase font-bold tracking-wider">Umidade</div>
                    <div className="text-xs font-bold tabular-nums">{weather.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-primary-foreground/70" />
                  <div className="leading-tight">
                    <div className="text-[9px] text-primary-foreground/60 uppercase font-bold tracking-wider">Vento</div>
                    <div className="text-xs font-bold tabular-nums">{weather.windSpeed} km/h</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-primary-foreground/70 text-xs">Clima indisponível</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
