import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useChartData } from '@/hooks/useChartData';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, Activity, PieChart as PieIcon } from 'lucide-react';

const chartConfig = {
  fts: { label: 'Folgas Trabalhadas', color: 'hsl(207 89% 54%)' },
  faltas: { label: 'Faltas', color: 'hsl(0 84% 60%)' },
  faturamento: { label: 'Faturamento', color: 'hsl(142 76% 36%)' },
};

const PIE_COLORS = ['hsl(207 89% 54%)', 'hsl(0 84% 60%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)'];

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: Activity },
  { id: 'revenue', label: 'Faturamento', icon: TrendingUp },
  { id: 'weekly', label: 'Semanal', icon: BarChart3 },
  { id: 'distribution', label: 'Distribuição', icon: PieIcon },
] as const;

type TabId = typeof tabs[number]['id'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);

const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-[200px] w-full rounded-2xl" />
  </div>
);

export const DashboardCharts = memo(() => {
  const { monthlyData, weeklyData, isLoading } = useChartData();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (isLoading) {
    return (
      <Card className="border-0 rounded-3xl bg-card/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6 space-y-6">
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }

  const totalFts = monthlyData.reduce((s, d) => s + d.fts, 0);
  const totalFaltas = monthlyData.reduce((s, d) => s + d.faltas, 0);
  const totalRev = monthlyData.reduce((s, d) => s + d.faturamento, 0);

  const pieData = [
    { name: 'FTs', value: totalFts },
    { name: 'Faltas', value: totalFaltas },
  ].filter(d => d.value > 0);

  return (
    <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-0 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <CardContent className="p-4 pt-4">
        {/* Overview - Line Chart */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">FTs vs Faltas</h3>
                <p className="text-xs text-muted-foreground">Ultimos 6 meses</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">FTs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <span className="text-[10px] text-muted-foreground">Faltas</span>
                </div>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="fts" stroke="hsl(207 89% 54%)" strokeWidth={3} dot={{ r: 5, fill: 'hsl(207 89% 54%)', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="faltas" stroke="hsl(0 84% 60%)" strokeWidth={3} dot={{ r: 5, fill: 'hsl(0 84% 60%)', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Revenue - Area Chart */}
        {activeTab === 'revenue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Faturamento Mensal</h3>
                <p className="text-xs text-muted-foreground">Total: {formatCurrency(totalRev)}</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                6 meses
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Area type="monotone" dataKey="faturamento" stroke="hsl(142 76% 36%)" strokeWidth={3} fill="url(#gradFat)" dot={{ r: 5, fill: 'hsl(142 76% 36%)', strokeWidth: 2, stroke: 'white' }} />
              </AreaChart>
            </ChartContainer>
          </div>
        )}

        {/* Weekly - Bar Chart */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Atividade Semanal</h3>
                <p className="text-xs text-muted-foreground">Ultimos 7 dias</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">FTs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <span className="text-[10px] text-muted-foreground">Faltas</span>
                </div>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="fts" fill="hsl(207 89% 54%)" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="faltas" fill="hsl(0 84% 60%)" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Distribution - Pie Chart */}
        {activeTab === 'distribution' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Distribuicao de Registros</h3>
              <p className="text-xs text-muted-foreground">Total nos ultimos 6 meses</p>
            </div>
            <div className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[220px] w-[280px]">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Sem dados', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {(pieData.length > 0 ? pieData : [{ name: 'Sem dados', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={pieData.length > 0 ? PIE_COLORS[i] : 'hsl(var(--muted))'} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-muted-foreground">{d.name}: <strong className="text-foreground">{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardCharts.displayName = 'DashboardCharts';
