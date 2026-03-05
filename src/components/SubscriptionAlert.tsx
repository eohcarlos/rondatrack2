import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Lock, Calendar } from 'lucide-react';

export const SubscriptionAlert = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Mostrar popup sempre após login
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const deadline = new Date('2026-04-02');
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = now >= deadline;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden [&>button]:hidden">
        {/* Header com gradiente de alerta */}
        <div className={`p-6 pb-4 ${
          isExpired 
            ? 'bg-gradient-to-br from-destructive to-destructive/80' 
            : 'bg-gradient-to-br from-amber-500 to-orange-500'
        } text-white`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {isExpired ? <Lock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold">
                  {isExpired ? '⚠️ Acesso Bloqueado' : '⚠️ Aviso Importante'}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>
          {!isExpired && (
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>Faltam {daysLeft} dias para o prazo</span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <DialogDescription asChild>
            <div className="space-y-4">
              {isExpired ? (
                <p className="text-foreground text-sm leading-relaxed">
                  Seu acesso foi <strong className="text-destructive">bloqueado</strong> por falta de assinatura. 
                  A partir de <strong>02/04/2026</strong>, o uso do RondaTrack 2 requer uma assinatura ativa. 
                  Sem a assinatura, você poderá apenas <strong>baixar relatórios</strong>.
                </p>
              ) : (
                <p className="text-foreground text-sm leading-relaxed">
                  Informamos que a partir do dia <strong className="text-foreground">02/04/2026</strong>, 
                  o RondaTrack 2 passará a cobrar uma mensalidade para manter o acesso completo ao sistema.
                </p>
              )}

              {/* Card de valor */}
              <div className="bg-muted/50 border border-border rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Mensalidade</p>
                <p className="text-3xl font-extrabold text-foreground">
                  R$ 99<span className="text-lg">,90</span>
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </div>

              {/* Aviso de bloqueio */}
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <Lock className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-foreground leading-relaxed">
                  {isExpired 
                    ? 'Seu acesso está limitado apenas ao download de relatórios. Assine para liberar todas as funcionalidades.'
                    : 'Sem a assinatura, o acesso será bloqueado e você poderá apenas baixar relatórios.'}
                </p>
              </div>
            </div>
          </DialogDescription>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex-col gap-2 sm:flex-col">
          <Button 
            onClick={() => setOpen(false)}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isExpired ? 'Entendi' : 'Entendi, obrigado!'}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Dúvidas? Entre em contato com o suporte.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
