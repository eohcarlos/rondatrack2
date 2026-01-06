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
    <Card className="relative overflow-hidden border-0 rounded-[2rem] bg-gradient-to-br from-primary via-primary/95 to-accent shadow-2xl ring-1 ring-white/10">
      {/* Premium animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main glow orbs */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} 
        />
      </div>

      <CardContent className="relative p-5 lg:p-6">
        <div className="flex items-center gap-5">
          {/* Greeting icon */}
          <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br ${greeting.color} flex items-center justify-center shadow-xl ring-2 ring-white/20 flex-shrink-0`}>
            <GreetingIcon className="h-7 w-7 lg:h-8 lg:w-8 text-white drop-shadow-lg" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{greeting.text}</p>
              {companyName && (
                <>
                  <span className="w-1 h-1 bg-white/30 rounded-full" />
                  <span className="text-white/50 text-xs truncate">{companyName}</span>
                </>
              )}
            </div>
            <h2 className="text-white text-lg lg:text-xl font-bold tracking-tight truncate">
              {userName || 'Usuário'} 👋
            </h2>
            
            {/* Date */}
            <div className="flex items-center gap-2 mt-1.5 text-white/60 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>{capitalizedDate}, {formattedYear}</span>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex flex-col items-end flex-shrink-0">
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-white/40 text-xs">Online</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
