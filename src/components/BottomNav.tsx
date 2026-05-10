import React from "react";
import { Users, Building2, Clock, Calendar, Download, Plus } from "lucide-react";

type BottomNavProps = {
  activeTab: string;
  onChange: (value: string) => void;
};

const sideItems: Array<{
  value: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { value: "employees", label: "Funcionários", Icon: Users },
  { value: "absences", label: "Faltas", Icon: Calendar },
  { value: "condominiums", label: "Contratos", Icon: Building2 },
  { value: "reports", label: "Relatórios", Icon: Download },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const ftActive = activeTab === "worked-leaves";

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="relative mx-3 mb-3">
        {/* Bar */}
        <div className="relative h-[68px] rounded-[28px] bg-background/85 backdrop-blur-2xl border border-border/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-5 h-full items-center px-1">
            {/* Left two */}
            {sideItems.slice(0, 2).map(({ value, label, Icon }) => {
              const active = activeTab === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange(value)}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  className="flex flex-col items-center justify-center gap-0.5 h-full"
                >
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[9px] font-semibold leading-none ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              );
            })}

            {/* Center placeholder for FAB */}
            <div aria-hidden className="h-full" />

            {/* Right two */}
            {sideItems.slice(2).map(({ value, label, Icon }) => {
              const active = activeTab === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange(value)}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  className="flex flex-col items-center justify-center gap-0.5 h-full"
                >
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[9px] font-semibold leading-none ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center FAB - FT */}
        <button
          type="button"
          onClick={() => onChange("worked-leaves")}
          aria-label="Folgas Trabalhadas"
          aria-current={ftActive ? "page" : undefined}
          className="absolute left-1/2 -translate-x-1/2 -top-7 flex flex-col items-center"
        >
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-[0_12px_28px_-6px_hsl(var(--primary)/0.55)] ring-4 ring-background transition-transform active:scale-95 ${
            ftActive
              ? "bg-gradient-to-br from-primary via-primary to-accent scale-105"
              : "bg-gradient-to-br from-primary to-accent"
          }`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/15 to-white/10" />
            <Clock className="h-7 w-7 text-primary-foreground relative" strokeWidth={2.5} />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent border-2 border-background flex items-center justify-center">
              <Plus className="h-3 w-3 text-accent-foreground" strokeWidth={3} />
            </div>
          </div>
          <span className="absolute -bottom-4 text-[9px] font-bold text-primary tracking-wide">FT</span>
        </button>
      </div>
    </nav>
  );
}
