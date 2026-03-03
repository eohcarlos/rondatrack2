import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ColorTheme = 'blue' | 'emerald' | 'purple';
export type DarkMode = 'light' | 'dark';

interface ThemeContextType {
  colorTheme: ColorTheme;
  darkMode: DarkMode;
  setColorTheme: (theme: ColorTheme) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorTheme: 'blue',
  darkMode: 'light',
  setColorTheme: () => {},
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_COLORS: Record<ColorTheme, Record<'light' | 'dark', Record<string, string>>> = {
  blue: {
    light: {
      '--primary': '207 89% 54%',
      '--primary-foreground': '0 0% 100%',
      '--primary-glow': '207 89% 65%',
      '--accent': '200 98% 39%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '213 94% 68%',
    },
    dark: {
      '--primary': '207 89% 54%',
      '--primary-foreground': '0 0% 100%',
      '--primary-glow': '207 89% 65%',
      '--accent': '200 98% 39%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '213 94% 68%',
    },
  },
  emerald: {
    light: {
      '--primary': '160 84% 39%',
      '--primary-foreground': '0 0% 100%',
      '--primary-glow': '160 84% 50%',
      '--accent': '172 66% 50%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '160 84% 55%',
    },
    dark: {
      '--primary': '160 84% 45%',
      '--primary-foreground': '0 0% 100%',
      '--primary-glow': '160 84% 55%',
      '--accent': '172 66% 50%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '160 84% 55%',
    },
  },
  purple: {
    light: {
      '--primary': '271 76% 53%',
      '--primary-foreground': '0 0% 100%',
      '--primary-glow': '271 76% 64%',
      '--accent': '280 68% 60%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '271 76% 64%',
    },
    dark: {
      '--primary': '271 76% 58%',
      '--primary-foreground': '0 0% 100%',
      '--primary-glow': '271 76% 68%',
      '--accent': '280 68% 65%',
      '--accent-foreground': '0 0% 100%',
      '--ring': '271 76% 64%',
    },
  },
};

function applyThemeColors(colorTheme: ColorTheme, darkMode: DarkMode) {
  const root = document.documentElement;
  const colors = THEME_COLORS[colorTheme][darkMode];
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('blue');
  const [darkMode, setDarkMode] = useState<DarkMode>('light');
  const [userId, setUserId] = useState<string | null>(null);

  // Load theme from localStorage first (fast), then from DB
  useEffect(() => {
    const savedColor = localStorage.getItem('color-theme') as ColorTheme | null;
    const savedDark = localStorage.getItem('theme') as DarkMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialDark = savedDark || (prefersDark ? 'dark' : 'light');
    const initialColor = savedColor || 'blue';
    
    setDarkMode(initialDark);
    setColorThemeState(initialColor);
    document.documentElement.classList.toggle('dark', initialDark === 'dark');
    applyThemeColors(initialColor, initialDark);

    // Load from DB
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from('profiles')
        .select('theme')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.theme && data.theme !== initialColor) {
            const dbTheme = data.theme as ColorTheme;
            setColorThemeState(dbTheme);
            localStorage.setItem('color-theme', dbTheme);
            applyThemeColors(dbTheme, initialDark);
          }
        });
    });
  }, []);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem('color-theme', theme);
    applyThemeColors(theme, darkMode);

    // Save to DB
    if (userId) {
      supabase
        .from('profiles')
        .update({ theme })
        .eq('user_id', userId)
        .then(() => {});
    }
  }, [darkMode, userId]);

  const toggleDarkMode = useCallback(() => {
    const newMode = darkMode === 'light' ? 'dark' : 'light';
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode);
    document.documentElement.classList.toggle('dark', newMode === 'dark');
    applyThemeColors(colorTheme, newMode);
  }, [darkMode, colorTheme]);

  return (
    <ThemeContext.Provider value={{ colorTheme, darkMode, setColorTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
