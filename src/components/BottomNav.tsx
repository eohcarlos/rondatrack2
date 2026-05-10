import React from "react";
import { Users, Building2, Clock, Calendar, Download, Plus } from "lucide-react";

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
  { value: "employees", label: "Func.", Icon: Users },
  { value: "absences", label: "Faltas", Icon: Calendar },
];

const rightItems: Item[] = [
  { value: "condominiums", label: "Contr.", Icon: Building2 },
  { value: "reports", label: "Relat.", Icon: Download },
];

function NavButton({ item, active, onClick }: { item: Item; active: boolean; onClick: () => void }) {
  const { Icon, label } = item;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className="group relative flex flex-row items-center justify-center gap-1.5 h-11 px-2 rounded-2xl transition-all duration-300 active:scale-95"
    >
      <span
        className={`relative flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-300 ${
          active
            ? "bg-gradient-to-br from-primary/20 to-accent/20 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
            : "bg-transparent"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] transition-all duration-300 ${
            active ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
          }`}
          strokeWidth={active ? 2.5 : 2}
        />
      </span>
      <span
        className={`text-[10px] font-semibold leading-none tracking-tight transition-colors duration-300 ${
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
      {/* Soft gradient fade behind the bar for premium depth */}
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-16 bg-gradient-to-t from-background/80 to-transparent" />

      <div className="relative mx-3 mb-3">
        {/* Bar */}
        <div className="relative h-[68px] rounded-[28px] bg-background/80 backdrop-blur-2xl border border-border/60 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)] overflow-hidden">
          {/* Inner gradient accent */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-accent/[0.04]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative grid grid-cols-[1fr_1fr_88px_1fr_1fr] h-full items-center px-2 gap-1">
            {leftItems.map((item) => (
              <NavButton
                key={item.value}
                item={item}
                active={activeTab === item.value}
                onClick={() => onChange(item.value)}
              />
            ))}

            {/* Center placeholder for FAB */}
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
          {/* Glow halo */}
          <div
            className={`absolute inset-0 -m-1 rounded-full bg-gradient-to-br from-primary to-accent blur-xl opacity-50 transition-opacity duration-500 ${
              ftActive ? "opacity-80" : "opacity-40 group-hover:opacity-60"
            }`}
          />
          <div
            className={`relative w-16 h-16 rounded-full flex items-center justify-center ring-4 ring-background transition-transform duration-300 active:scale-95 ${
              ftActive ? "scale-105" : "group-hover:scale-105"
            }`}
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 50%, hsl(var(--accent)) 100%)",
              boxShadow:
                "0 14px 30px -8px hsl(var(--primary) / 0.6), inset 0 1px 0 0 hsl(0 0% 100% / 0.25), inset 0 -2px 6px 0 hsl(0 0% 0% / 0.2)",
            }}
          >
            <Clock className="h-7 w-7 text-primary-foreground relative drop-shadow-sm" strokeWidth={2.5} />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent border-2 border-background flex items-center justify-center shadow-md">
              <Plus className="h-3 w-3 text-accent-foreground" strokeWidth={3} />
            </div>
          </div>
          <span
            className={`mt-1 text-[10px] font-bold tracking-wide transition-colors ${
              ftActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            FT
          </span>
        </button>
      </div>
    </nav>
  );
}
