import React from "react";
import { Users, Building2, Clock, Calendar, FileText, Plus } from "lucide-react";

type BottomNavProps = {
  activeTab: string;
  onChange: (value: string) => void;
};

type Item = {
  value: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const leftItems: Item[] = [
  { value: "employees", label: "Funcionários", Icon: Users },
  { value: "absences", label: "Faltas", Icon: Calendar },
];

const rightItems: Item[] = [
  { value: "condominiums", label: "Contratos", Icon: Building2 },
  { value: "reports", label: "Relatórios", Icon: FileText },
];

function NavButton({ item, active, onClick }: { item: Item; active: boolean; onClick: () => void }) {
  const { Icon, label } = item;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className="group relative flex flex-col items-center justify-center gap-1 h-full w-full px-0.5 transition-all duration-300 active:scale-90"
    >
      <span
        className={`relative flex items-center justify-center h-9 w-9 rounded-2xl transition-all duration-300 ${
          active
            ? "bg-gradient-to-br from-primary/25 via-primary/15 to-accent/20 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18),inset_0_0_0_1px_hsl(var(--primary)/0.45)]"
            : "bg-transparent"
        }`}
      >
        {active && (
          <span className="absolute inset-0 rounded-2xl bg-primary/25 blur-md -z-10" aria-hidden />
        )}
        <Icon
          className={`h-[20px] w-[20px] transition-all duration-300 ${
            active
              ? "text-primary scale-110 drop-shadow-[0_2px_6px_hsl(var(--primary)/0.55)]"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
          strokeWidth={active ? 2.4 : 1.9}
        />
      </span>
      <span
        className={`text-[9.5px] font-semibold leading-none tracking-tight transition-colors duration-300 truncate max-w-full ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const ftActive = activeTab === "worked-leaves";

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-20 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

      <div className="relative mx-2 mb-2">
        <div className="relative h-[72px] rounded-[28px] bg-background/85 backdrop-blur-2xl border border-border/60 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-transparent to-accent/[0.06]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative grid grid-cols-[1fr_1fr_76px_1fr_1fr] h-full items-stretch px-1">
            {leftItems.map((item) => (
              <NavButton
                key={item.value}
                item={item}
                active={activeTab === item.value}
                onClick={() => onChange(item.value)}
              />
            ))}

            <div aria-hidden className="h-full" />

            {rightItems.map((item) => (
              <NavButton
                key={item.value}
                item={item}
                active={activeTab === item.value}
                onClick={() => onChange(item.value)}
              />
            ))}
          </div>
        </div>

        {/* Center FAB - FT */}
        <button
          type="button"
          onClick={() => onChange("worked-leaves")}
          aria-label="Folgas Trabalhadas"
          aria-current={ftActive ? "page" : undefined}
          className="absolute left-1/2 -translate-x-1/2 -top-7 flex flex-col items-center group"
        >
          <div
            className={`absolute -inset-2 rounded-full bg-gradient-to-br from-primary via-primary-glow to-accent blur-2xl transition-opacity duration-500 ${
              ftActive ? "opacity-70" : "opacity-40 group-hover:opacity-55"
            }`}
            aria-hidden
          />
          <div
            className={`relative w-[60px] h-[60px] rounded-full flex items-center justify-center ring-[5px] ring-background transition-transform duration-300 active:scale-90 ${
              ftActive ? "scale-105" : "group-hover:scale-105"
            }`}
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 55%, hsl(var(--accent)) 100%)",
              boxShadow:
                "0 18px 36px -10px hsl(var(--primary) / 0.65), 0 4px 12px -4px hsl(var(--accent) / 0.4), inset 0 1.5px 0 0 hsl(0 0% 100% / 0.35), inset 0 -3px 8px 0 hsl(0 0% 0% / 0.22)",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-2 top-1.5 h-4 rounded-full bg-gradient-to-b from-white/45 to-transparent blur-[2px]"
            />
            <Clock
              className="h-6 w-6 text-primary-foreground relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
              strokeWidth={2.6}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-[20px] h-[20px] rounded-full bg-accent border-[2.5px] border-background flex items-center justify-center shadow-lg">
              <Plus className="h-2.5 w-2.5 text-accent-foreground" strokeWidth={3.5} />
            </div>
          </div>
          <span
            className={`mt-1 text-[9.5px] font-bold tracking-wide transition-colors ${
              ftActive ? "text-primary" : "text-foreground/80"
            }`}
          >
            FT
          </span>
        </button>
      </div>
    </nav>
  );
}
