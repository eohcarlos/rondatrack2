import React from "react";
import { BarChart3, Users, Building2, Clock, Calendar, Download } from "lucide-react";

type BottomNavProps = {
  activeTab: string;
  onChange: (value: string) => void;
};

const items: Array<{
  value: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { value: "dashboard", label: "Dashboard", Icon: BarChart3 },
  { value: "employees", label: "Funcionários", Icon: Users },
  { value: "condominiums", label: "Condomínios", Icon: Building2 },
  { value: "worked-leaves", label: "FT", Icon: Clock },
  { value: "absences", label: "Faltas", Icon: Calendar },
  { value: "reports", label: "Relatórios", Icon: Download },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="container mx-auto px-2">
        <ul className="grid grid-cols-6">
          {items.map(({ value, label, Icon }) => {
            const active = activeTab === value;
            const color = active ? "text-primary" : "text-muted-foreground";
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => onChange(value)}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  className={`w-full py-2 flex flex-col items-center justify-center gap-1 ${color}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] leading-none">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
