import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/company';
import { useEmployees } from '@/hooks/useEmployees';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarDays, Sun, Moon, Clock, Plus, Trash2, Download, Users, Building2, ArrowUp, ArrowDown, Check, CheckCircle2, RotateCcw } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ScheduleEntry {
  id: string;
  employee_id: string;
  date: string;
  shift: string;
  condominium_id: string | null;
  observations: string | null;
  created_by: string;
  picked_up_at: string | null;
  employees?: { first_name: string; last_name: string | null; positions?: { title: string } };
  condominiums?: { name: string } | null;
}

const SHIFT_CONFIG = {
  diurno: { label: 'Diurno', icon: Sun, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  noturno: { label: 'Noturno', icon: Moon, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  dobra: { label: 'Dobra (24h)', icon: Clock, color: 'bg-rose-500/10 text-rose-600 border-rose-500/30', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export const ScheduleTab = () => {
  const { employees, condominiums, isLoading: loadingEmployees } = useEmployees();
  const { profile } = useProfile();
  const { toast } = useToast();

  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedCondominium, setSelectedCondominium] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [observations, setObservations] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Generate 7 days starting from today
  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      return {
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : format(date, 'EEEE', { locale: ptBR }),
        shortLabel: format(date, 'dd/MM'),
        dayName: format(date, 'EEE', { locale: ptBR }),
      };
    });
  }, []);

  const [activeDay, setActiveDay] = useState(weekDays[1]?.dateStr || weekDays[0]?.dateStr);

  const loadSchedules = useCallback(async () => {
    const companyId = getCurrentCompanyId();
    if (!companyId) return;

    try {
      const startDate = weekDays[0].dateStr;
      const endDate = weekDays[6].dateStr;

      const { data, error } = await supabase
        .from('schedules')
        .select('*, employees(first_name, last_name, positions(title)), condominiums(name)')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) throw error;
      setSchedules((data as any) || []);
    } catch (error: any) {
      console.error('Erro ao carregar escalas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [weekDays]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const activeEmployees = useMemo(() => 
    employees.filter(e => e.active), 
    [employees]
  );

  // Persistent ordering map: key = `${date}|${shift}` → array of schedule IDs
  const ORDER_KEY = 'schedule-order-v1';
  const [orderMap, setOrderMap] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const persistOrder = useCallback((next: Record<string, string[]>) => {
    setOrderMap(next);
    localStorage.setItem(ORDER_KEY, JSON.stringify(next));
  }, []);

  const sortByOrder = useCallback((list: ScheduleEntry[], date: string, shift: string) => {
    const key = `${date}|${shift}`;
    const order = orderMap[key] || [];
    const indexOf = (id: string) => {
      const i = order.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...list].sort((a, b) => {
      const ia = indexOf(a.id);
      const ib = indexOf(b.id);
      if (ia !== ib) return ia - ib;
      // fallback: by employee name
      const na = `${a.employees?.first_name || ''} ${a.employees?.last_name || ''}`.trim().toLowerCase();
      const nb = `${b.employees?.first_name || ''} ${b.employees?.last_name || ''}`.trim().toLowerCase();
      return na.localeCompare(nb);
    });
  }, [orderMap]);

  const moveEntry = useCallback((entries: ScheduleEntry[], id: string, direction: -1 | 1, date: string, shift: string) => {
    const ids = entries.map(e => e.id);
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    const key = `${date}|${shift}`;
    persistOrder({ ...orderMap, [key]: ids });
  }, [orderMap, persistOrder]);

  const schedulesForDay = useMemo(() => {
    return schedules.filter(s => s.date === activeDay);
  }, [schedules, activeDay]);

  const diurnoSchedules = useMemo(() => sortByOrder(schedulesForDay.filter(s => s.shift === 'diurno'), activeDay, 'diurno'), [schedulesForDay, sortByOrder, activeDay]);
  const noturnoSchedules = useMemo(() => sortByOrder(schedulesForDay.filter(s => s.shift === 'noturno'), activeDay, 'noturno'), [schedulesForDay, sortByOrder, activeDay]);
  const dobraSchedules = useMemo(() => sortByOrder(schedulesForDay.filter(s => s.shift === 'dobra'), activeDay, 'dobra'), [schedulesForDay, sortByOrder, activeDay]);

  const handleAddSchedule = async () => {
    if (!selectedEmployee || !selectedShift || !activeDay) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const companyId = getCurrentCompanyId();
    if (!companyId || !profile) return;

    setIsSaving(true);
    try {
      const dateToUse = selectedDate || activeDay;
      
      const { error } = await supabase.from('schedules').insert({
        company_id: companyId,
        employee_id: selectedEmployee,
        date: dateToUse,
        shift: selectedShift,
        condominium_id: selectedCondominium || null,
        observations: observations || null,
        created_by: profile.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Este funcionário já está escalado neste turno para este dia', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: '✅ Funcionário escalado com sucesso!' });
      setIsDialogOpen(false);
      setSelectedEmployee('');
      setSelectedShift('');
      setSelectedCondominium('');
      setObservations('');
      setSelectedDate('');
      await loadSchedules();
    } catch (error: any) {
      toast({ title: 'Erro ao escalar funcionário', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este funcionário da escala?')) return;

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Funcionário removido da escala' });
      await loadSchedules();
    } catch (error: any) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    }
  };

  const handleTogglePickup = async (entry: ScheduleEntry) => {
    const isPickedUp = !!entry.picked_up_at;
    const newValue = isPickedUp ? null : new Date().toISOString();

    // Optimistic update
    setSchedules(prev => prev.map(s => s.id === entry.id ? { ...s, picked_up_at: newValue } : s));

    try {
      const { error } = await supabase
        .from('schedules')
        .update({ picked_up_at: newValue })
        .eq('id', entry.id);
      if (error) throw error;
      toast({
        title: isPickedUp ? 'Confirmação removida' : '✅ Funcionário confirmado!',
        description: isPickedUp ? undefined : `Horário registrado: ${format(new Date(newValue!), 'HH:mm')}`,
      });
    } catch (error: any) {
      // Revert
      setSchedules(prev => prev.map(s => s.id === entry.id ? { ...s, picked_up_at: entry.picked_up_at } : s));
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const dayData = weekDays.find(d => d.dateStr === activeDay);
    const dayLabel = dayData ? format(new Date(dayData.dateStr + 'T12:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : activeDay;

    // Header gradient bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 48, 'F');
    // Accent line
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 48, pageWidth, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ESCALA DE FUNCIONARIOS', 14, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1), 14, 30);

    doc.setFontSize(9);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'as' HH:mm")}`, 14, 40);

    // Summary box
    const summaryY = 58;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, summaryY, pageWidth - 28, 20, 3, 3, 'F');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const colW = (pageWidth - 28) / 4;
    doc.text(`TOTAL: ${schedulesForDay.length}`, 14 + 8, summaryY + 12);
    doc.setTextColor(217, 119, 6);
    doc.text(`DIURNO: ${diurnoSchedules.length}`, 14 + colW + 8, summaryY + 12);
    doc.setTextColor(67, 56, 202);
    doc.text(`NOTURNO: ${noturnoSchedules.length}`, 14 + colW * 2 + 8, summaryY + 12);
    doc.setTextColor(190, 18, 60);
    doc.text(`DOBRA: ${dobraSchedules.length}`, 14 + colW * 3 + 8, summaryY + 12);

    let yPos = summaryY + 30;

    const renderShiftTable = (title: string, entries: ScheduleEntry[], color: [number, number, number], accentColor: [number, number, number]) => {
      if (entries.length === 0) return;

      // Check page break
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      // Section accent bar
      doc.setFillColor(...accentColor);
      doc.rect(14, yPos - 1, 4, 8, 'F');
      
      doc.setTextColor(...color);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`${title}`, 22, yPos + 5);
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${entries.length} funcionario(s)`, pageWidth - 14, yPos + 5, { align: 'right' });
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Funcionario', 'Cargo', 'Condominio', 'Observacoes']],
        body: entries.map((s, i) => [
          String(i + 1),
          `${s.employees?.first_name || ''} ${s.employees?.last_name || ''}`.trim(),
          s.employees?.positions?.title || '-',
          s.condominiums?.name || '-',
          s.observations || '-',
        ]),
        theme: 'plain',
        headStyles: { 
          fillColor: color, 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          fontSize: 9,
          cellPadding: 4,
        },
        bodyStyles: { 
          fontSize: 9, 
          cellPadding: 3.5,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 45 },
          2: { cellWidth: 35 },
          3: { cellWidth: 40 },
          4: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 14;
    };

    renderShiftTable('Turno Diurno', diurnoSchedules, [180, 83, 9], [251, 191, 36]);
    renderShiftTable('Turno Noturno', noturnoSchedules, [55, 48, 163], [99, 102, 241]);
    renderShiftTable('Dobra - 24 Horas', dobraSchedules, [159, 18, 57], [244, 63, 94]);

    if (schedulesForDay.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(13);
      doc.text('Nenhum funcionario escalado para este dia.', pageWidth / 2, yPos + 10, { align: 'center' });
    }

    // Footer
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text('RondaTrack 2  |  Sistema de Gestao de Seguranca', 14, pageHeight - 5);
    doc.text(`Total de ${schedulesForDay.length} funcionario(s) escalado(s)`, pageWidth - 14, pageHeight - 5, { align: 'right' });

    doc.save(`escala-${activeDay}.pdf`);
    toast({ title: 'PDF gerado com sucesso!' });
  };

  const renderScheduleCard = (entry: ScheduleEntry, index: number, list: ScheduleEntry[]) => {
    const shiftConf = SHIFT_CONFIG[entry.shift as keyof typeof SHIFT_CONFIG];
    const ShiftIcon = shiftConf?.icon || Clock;
    const isFirst = index === 0;
    const isLast = index === list.length - 1;

    const isPickedUp = !!entry.picked_up_at;
    const pickedTime = isPickedUp ? format(new Date(entry.picked_up_at!), 'HH:mm') : null;

    return (
      <div
        key={entry.id}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md ${
          isPickedUp
            ? 'bg-emerald-500/5 border-emerald-500/40 dark:bg-emerald-500/10'
            : shiftConf?.color || 'border-border'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex flex-col gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={isFirst}
              onClick={() => moveEntry(list, entry.id, -1, entry.date, entry.shift)}
              title="Mover para cima"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={isLast}
              onClick={() => moveEntry(list, entry.id, 1, entry.date, entry.shift)}
              title="Mover para baixo"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${shiftConf?.badge || 'bg-muted'}`}>
            <span className="text-[11px] font-bold">{index + 1}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`font-semibold text-sm truncate ${isPickedUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                {entry.employees?.first_name} {entry.employees?.last_name}
              </p>
              {isPickedUp && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 h-4">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  {pickedTime}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {entry.employees?.positions?.title && (
                <span className="text-xs text-muted-foreground">{entry.employees.positions.title}</span>
              )}
              {entry.condominiums?.name && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Building2 className="h-2.5 w-2.5 mr-0.5" />
                  {entry.condominiums.name}
                </Badge>
              )}
            </div>
            {entry.observations && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.observations}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant={isPickedUp ? 'outline' : 'default'}
            size="sm"
            className={`h-8 px-2 ${
              isPickedUp
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            onClick={() => handleTogglePickup(entry)}
            title={isPickedUp ? 'Desfazer confirmação' : 'Confirmar embarque'}
          >
            {isPickedUp ? <RotateCcw className="h-3.5 w-3.5" /> : <><Check className="h-3.5 w-3.5 mr-1" /><span className="text-xs">Buscar</span></>}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(entry.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderShiftSection = (title: string, entries: ScheduleEntry[], icon: React.ElementType, gradient: string) => {
    const Icon = icon;
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${gradient}`}>
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{title}</span>
          <Badge variant="secondary" className="ml-auto text-xs">{entries.length}</Badge>
        </div>
        {entries.length > 0 ? (
          <div className="space-y-2 pl-1">
            {entries.map((e, i) => renderScheduleCard(e, i, entries))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum funcionário escalado</p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">Escala de Funcionários</CardTitle>
              <p className="text-blue-100 text-sm">Monte a escala diária dos próximos 7 dias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={generatePDF} disabled={schedulesForDay.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Escalar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Escalar Funcionário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Select value={selectedDate || activeDay} onValueChange={setSelectedDate}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {weekDays.map(d => (
                          <SelectItem key={d.dateStr} value={d.dateStr}>
                            {d.label} - {d.shortLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Funcionário *</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                      <SelectContent>
                        {activeEmployees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} {emp.positions?.title ? `(${emp.positions.title})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Turno *</Label>
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                      <SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diurno">☀️ Diurno (06:00 - 18:00)</SelectItem>
                        <SelectItem value="noturno">🌙 Noturno (18:00 - 06:00)</SelectItem>
                        <SelectItem value="dobra">⏰ Dobra (24h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condomínio (opcional)</Label>
                    <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
                      <SelectTrigger><SelectValue placeholder="Selecione o condomínio" /></SelectTrigger>
                      <SelectContent>
                        {condominiums.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Input
                      value={observations}
                      onChange={e => setObservations(e.target.value)}
                      placeholder="Ex: Cobrindo folga do João"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddSchedule} disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Escalar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-2xl font-bold">{diurnoSchedules.length}</p>
            <p className="text-[10px] text-blue-200">Diurno</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-2xl font-bold">{noturnoSchedules.length}</p>
            <p className="text-[10px] text-blue-200">Noturno</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-2xl font-bold">{dobraSchedules.length}</p>
            <p className="text-[10px] text-blue-200">Dobra</p>
          </div>
        </div>

        {/* Pickup tracker */}
        {schedulesForDay.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/20 border border-emerald-300/30 rounded-xl p-2.5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-200" />
              <div>
                <p className="text-xl font-bold leading-none">{schedulesForDay.filter(s => s.picked_up_at).length}</p>
                <p className="text-[10px] text-emerald-100">Buscados</p>
              </div>
            </div>
            <div className="bg-amber-500/20 border border-amber-300/30 rounded-xl p-2.5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-200" />
              <div>
                <p className="text-xl font-bold leading-none">{schedulesForDay.filter(s => !s.picked_up_at).length}</p>
                <p className="text-[10px] text-amber-100">Faltam buscar</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {/* Day Tabs */}
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl">
            {weekDays.map(d => (
              <TabsTrigger
                key={d.dateStr}
                value={d.dateStr}
                className="flex-1 min-w-[80px] flex flex-col gap-0 py-2 px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg text-xs"
              >
                <span className="font-semibold capitalize">{d.dayName}</span>
                <span className="text-[10px] opacity-80">{d.shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {weekDays.map(d => (
            <TabsContent key={d.dateStr} value={d.dateStr} className="mt-4">
              <Tabs defaultValue="all">
                <TabsList className="w-full bg-muted/30 p-1 rounded-xl">
                  <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                    Todos ({schedulesForDay.length})
                  </TabsTrigger>
                  <TabsTrigger value="diurno" className="flex-1 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                    ☀️ Diurno ({diurnoSchedules.length})
                  </TabsTrigger>
                  <TabsTrigger value="noturno" className="flex-1 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
                    🌙 Noturno ({noturnoSchedules.length})
                  </TabsTrigger>
                  <TabsTrigger value="dobra" className="flex-1 text-xs data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg">
                    ⏰ Dobra ({dobraSchedules.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {renderShiftSection('Turno Diurno', diurnoSchedules, Sun, 'bg-amber-500/10 text-amber-700 dark:text-amber-400')}
                  {renderShiftSection('Turno Noturno', noturnoSchedules, Moon, 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400')}
                  {renderShiftSection('Dobra (24h)', dobraSchedules, Clock, 'bg-rose-500/10 text-rose-700 dark:text-rose-400')}
                </TabsContent>

                <TabsContent value="diurno" className="space-y-2 mt-4">
                  {diurnoSchedules.length > 0 ? diurnoSchedules.map((e, i) => renderScheduleCard(e, i, diurnoSchedules)) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum funcionário no turno diurno</p>
                  )}
                </TabsContent>

                <TabsContent value="noturno" className="space-y-2 mt-4">
                  {noturnoSchedules.length > 0 ? noturnoSchedules.map((e, i) => renderScheduleCard(e, i, noturnoSchedules)) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum funcionário no turno noturno</p>
                  )}
                </TabsContent>

                <TabsContent value="dobra" className="space-y-2 mt-4">
                  {dobraSchedules.length > 0 ? dobraSchedules.map((e, i) => renderScheduleCard(e, i, dobraSchedules)) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum funcionário na dobra</p>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
