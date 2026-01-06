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

      <CardContent className="relative p-8 lg:p-10">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Greeting with premium icon */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${greeting.color} flex items-center justify-center shadow-2xl ring-4 ring-white/20 backdrop-blur-sm`}>
              <GreetingIcon className="h-10 w-10 lg:h-12 lg:w-12 text-white drop-shadow-lg" />
            </div>
            <div className="space-y-1">
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest">{greeting.text}</p>
              <h2 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">
                {userName || 'Usuário'} 👋
              </h2>
            </div>
          </div>

          {/* Premium Time Display - Central Focus */}
          <div className="relative py-6">
            {/* Glow behind time */}
            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl" />
            <div className="relative flex flex-col items-center gap-3">
              {/* Large Clock Display */}
              <div className="flex items-baseline">
                <span className="text-6xl lg:text-8xl font-extrabold text-white tracking-tighter font-mono tabular-nums drop-shadow-lg">
                  {formattedTime.slice(0, 5)}
                </span>
                <span className="text-3xl lg:text-4xl font-bold text-white/50 font-mono tabular-nums ml-1">
                  {formattedTime.slice(5)}
                </span>
              </div>
              
              {/* Date Badge */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10">
                <Calendar className="h-4 w-4 text-white/70" />
                <span className="text-sm lg:text-base font-medium text-white/90">{capitalizedDate}</span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <span className="text-sm lg:text-base font-bold text-white">{formattedYear}</span>
              </div>
            </div>
          </div>

          {/* Company badge */}
          {companyName && (
            <div className="flex items-center gap-2 text-white/60 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{companyName}</span>
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <div className="mt-8 pt-5 border-t border-white/10">
          <div className="flex items-center justify-center gap-6 text-white/50 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Atualização em tempo real</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span>Sistema Online</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MainHeroCard.displayName = 'MainHeroCard';
