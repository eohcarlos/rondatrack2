import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme, ColorTheme } from '@/hooks/useThemeContext';
import { Check, Palette, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const themes: { id: ColorTheme; name: string; description: string; colors: string[]; gradient: string }[] = [
  {
    id: 'blue',
    name: 'Azul Oceano',
    description: 'Tema clássico e profissional',
    colors: ['hsl(207 89% 54%)', 'hsl(200 98% 39%)', 'hsl(213 94% 68%)'],
    gradient: 'from-blue-500 via-sky-500 to-cyan-500',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    description: 'Fresco e moderno',
    colors: ['hsl(160 84% 39%)', 'hsl(172 66% 50%)', 'hsl(160 84% 55%)'],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    id: 'purple',
    name: 'Violeta Royal',
    description: 'Elegante e sofisticado',
    colors: ['hsl(271 76% 53%)', 'hsl(280 68% 60%)', 'hsl(271 76% 64%)'],
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
  },
  {
    id: 'rose',
    name: 'Rosa Sunset',
    description: 'Vibrante e acolhedor',
    colors: ['hsl(346 77% 50%)', 'hsl(330 65% 55%)', 'hsl(346 77% 60%)'],
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-400',
  },
  {
    id: 'amber',
    name: 'Dourado Premium',
    description: 'Luxuoso e marcante',
    colors: ['hsl(38 92% 50%)', 'hsl(25 95% 53%)', 'hsl(38 92% 60%)'],
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
  },
  {
    id: 'slate',
    name: 'Cinza Executivo',
    description: 'Minimalista e discreto',
    colors: ['hsl(215 20% 40%)', 'hsl(215 14% 50%)', 'hsl(215 20% 50%)'],
    gradient: 'from-slate-500 via-gray-500 to-zinc-400',
  },
];

export const ThemesTab = memo(() => {
  const { colorTheme, setColorTheme, darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <Palette className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Temas</h2>
          <p className="text-sm text-muted-foreground">Personalize a aparência do app</p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <Card className="border-0 rounded-3xl shadow-lg overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                {darkMode === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-warning" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Modo {darkMode === 'dark' ? 'Escuro' : 'Claro'}</p>
                <p className="text-xs text-muted-foreground">Alternar entre claro e escuro</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="rounded-xl"
            >
              {darkMode === 'dark' ? <Sun className="h-4 w-4 mr-1.5" /> : <Moon className="h-4 w-4 mr-1.5" />}
              {darkMode === 'dark' ? 'Claro' : 'Escuro'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Cards */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Esquema de Cores
        </p>
        
        {themes.map((theme) => {
          const isActive = colorTheme === theme.id;
          
          return (
            <Card
              key={theme.id}
              className={`border-0 rounded-3xl shadow-lg cursor-pointer transition-all duration-300 overflow-hidden ${
                isActive 
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl scale-[1.02]' 
                  : 'hover:shadow-xl hover:-translate-y-0.5'
              }`}
              onClick={() => setColorTheme(theme.id)}
            >
              {/* Color preview bar */}
              <div className={`h-20 bg-gradient-to-r ${theme.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                </div>
                
                {/* Mini preview elements */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm" />
                  <div className="space-y-1">
                    <div className="w-16 h-2 bg-white/30 rounded-full" />
                    <div className="w-10 h-1.5 bg-white/20 rounded-full" />
                  </div>
                </div>

                {/* Selected check */}
                {isActive && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {theme.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Auto-save indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        <span>Salvo automaticamente</span>
      </div>
    </div>
  );
});

ThemesTab.displayName = 'ThemesTab';
