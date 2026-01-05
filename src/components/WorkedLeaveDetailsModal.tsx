import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, DollarSign, Briefcase, MessageSquare, SunMedium, Moon } from 'lucide-react';

interface WorkedLeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workedLeave: {
    id: string;
    date: string;
    observations: string | null;
    amount: number | null;
    work_shift: string | null;
    start_time: string | null;
    end_time: string | null;
    created_at: string;
    employees: {
      first_name: string;
      last_name: string;
      positions: { title: string };
      condominiums: { name: string };
      shift: string;
    };
    supervisor: {
      name: string;
    };
  } | null;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

const formatTime = (time: string | null) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

const getWorkShiftLabel = (shift: string | null) => {
  if (!shift) return 'Não informado';
  const labels: Record<string, string> = {
    'diurno': 'Diurno',
    'noturno': 'Noturno'
  };
  return labels[shift] || shift;
};

const getShiftLabel = (shift: string) => {
  const labels: Record<string, string> = {
    'manha': 'Manhã',
    'noite': 'Noite'
  };
  return labels[shift] || shift;
};

export const WorkedLeaveDetailsModal = ({ isOpen, onClose, workedLeave }: WorkedLeaveDetailsModalProps) => {
  if (!workedLeave) return null;

  const isNightShift = workedLeave.work_shift === 'noturno';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Clock className="h-6 w-6 text-white" />
            </div>
            Detalhes da FT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Employee Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <span className="text-xl font-bold text-white">
                {workedLeave.employees.first_name.charAt(0)}{workedLeave.employees.last_name?.charAt(0) || ''}
              </span>
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">
                {workedLeave.employees.first_name} {workedLeave.employees.last_name}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="text-sm">{workedLeave.employees.positions?.title || 'Sem cargo'}</span>
              </div>
            </div>
          </div>

          {/* Work Shift */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Turno de Trabalho</span>
              <Badge className={`${isNightShift 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                : 'bg-gradient-to-r from-amber-400 to-orange-400'} text-white border-0 shadow-lg`}>
                {isNightShift ? <Moon className="h-3 w-3 mr-1" /> : <SunMedium className="h-3 w-3 mr-1" />}
                {getWorkShiftLabel(workedLeave.work_shift)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-bold text-foreground">{formatTime(workedLeave.start_time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                <div className="h-9 w-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Final</p>
                  <p className="font-bold text-foreground">{formatTime(workedLeave.end_time)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-semibold text-foreground">{formatDate(workedLeave.date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  {workedLeave.amount ? `R$ ${Number(workedLeave.amount).toFixed(0)}` : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Condomínio</p>
              <p className="font-semibold text-foreground">{workedLeave.employees.condominiums?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supervisor</p>
              <p className="font-semibold text-foreground">{workedLeave.supervisor?.name || 'N/A'}</p>
            </div>
          </div>

          {/* Turno do Funcionário */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Turno do Funcionário</p>
              <p className="font-semibold text-foreground">{getShiftLabel(workedLeave.employees.shift)}</p>
            </div>
          </div>

          {/* Observations */}
          {workedLeave.observations && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary/60" />
                <span className="text-sm font-medium text-muted-foreground">Observações</span>
              </div>
              <p className="text-foreground">{workedLeave.observations}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
