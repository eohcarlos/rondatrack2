import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, Sun, Moon, CloudSun, Sunrise, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MainHeroCardProps {
  companyName?: string;
  userName?: string;
}

const getGreeting = (hour: number) => {
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', icon: Sunrise, color: 'from-amber-400 to-orange-500' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', icon: CloudSun, color: 'from-orange-400 to-rose-500' };
  if (hour >= 18 && hour < 22) return { text: 'Boa noite', icon: Sun, color: 'from-indigo-400 to-purple-600' };
  return { text: 'Boa madrugada', icon: Moon, color: 'from-slate-600 to-slate-800' };
};

export const MainHeroCard = memo(({ companyName, userName }: MainHeroCardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = getGreeting(hour);
  const GreetingIcon = greeting.icon;

  const formattedTime = format(currentTime, 'HH:mm:ss', { locale: ptBR });
  const formattedDate = format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedYear = format(currentTime, 'yyyy');

  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-accent shadow-2xl">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-white/5 to-transparent rounded-full" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      <CardContent className="relative p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left section - Greeting and Time */}
          <div className="space-y-4">
            {/* Greeting */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br ${greeting.color} flex items-center justify-center shadow-lg`}>
                <GreetingIcon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{greeting.text}</p>
                <h2 className="text-white text-xl lg:text-2xl font-bold tracking-tight">
                  {userName || 'Usuário'}
                </h2>
              </div>
            </div>

            {/* Company */}
            {companyName && (
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{companyName}</span>
              </div>
            )}
          </div>

          {/* Center/Right section - Time Display */}
          <div className="flex flex-col items-start lg:items-end gap-2">
            {/* Digital Clock */}
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl lg:text-6xl font-bold text-white tracking-tight font-mono tabular-nums">
                  {formattedTime.slice(0, 5)}
                </span>
                <span className="text-2xl lg:text-3xl font-semibold text-white/60 font-mono tabular-nums">
                  {formattedTime.slice(5)}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="h-4 w-4" />
              <span className="text-sm lg:text-base font-medium">{capitalizedDate}</span>
              <span className="text-white/50">&bull;</span>
              <span className="text-sm lg:text-base font-semibold text-white">{formattedYear}</span>
            </div>
          </div>
        </div>

        {/* Bottom decorative bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-white/60 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Última atualização em tempo real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
