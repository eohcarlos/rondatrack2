import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useThemeContext";

export function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleDarkMode}
      className="border-border hover:bg-muted"
      aria-label="Alternar tema"
    >
      {darkMode === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
