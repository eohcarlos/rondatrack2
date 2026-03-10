import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Fuel, Receipt, Upload, Loader2, Trash2, Camera, MapPin, Car, Gauge, DollarSign, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Expense = {
  id: string;
  type: string;
  amount: number;
  date: string;
  vehicle: string | null;
  license_plate: string | null;
  location: string | null;
  mileage: number | null;
  observations: string | null;
  receipt_url: string | null;
  created_at: string;
};

export const ExpensesTab = () => {
  const [subTab, setSubTab] = useState<'abastecimento' | 'pedagio'>('abastecimento');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [location, setLocation] = useState('');
  const [mileage, setMileage] = useState('');
  const [observations, setObservations] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('type', subTab)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses((data as unknown as Expense[]) || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar gastos', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [subTab, toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const resetForm = () => {
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setVehicle('');
    setLicensePlate('');
    setLocation('');
    setMileage('');
    setObservations('');
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleExtractFromImage = async () => {
    if (!receiptFile) return;
    setIsExtracting(true);
    try {
      // Upload to storage first
      const fileName = `${Date.now()}_${receiptFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
      const imageUrl = urlData.publicUrl;

      // Call AI extraction
      const { data: fnData, error: fnError } = await supabase.functions.invoke('extract-receipt', {
        body: { imageUrl, type: subTab },
      });

      if (fnError) throw fnError;

      if (fnData?.data) {
        const d = fnData.data;
        if (d.amount != null) setAmount(String(d.amount));
        if (d.date) setDate(d.date);
        if (d.location) setLocation(d.location);
        if (d.vehicle) setVehicle(d.vehicle);
        if (d.license_plate) setLicensePlate(d.license_plate);
        if (d.mileage != null) setMileage(String(d.mileage));

        toast({ title: 'Dados extraídos com sucesso!', description: 'Verifique os campos preenchidos pela IA.' });
      }
    } catch (error: any) {
      toast({ title: 'Erro ao extrair dados', description: error.message, variant: 'destructive' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast({ title: 'Valor obrigatório', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const companyId = localStorage.getItem('companyId');
      if (!companyId) throw new Error('Empresa não encontrada');

      let receiptUrl: string | null = null;
      if (receiptFile) {
        const fileName = `${Date.now()}_${receiptFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
        receiptUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('expenses').insert({
        company_id: companyId,
        created_by: user.id,
        type: subTab,
        amount: parseFloat(amount),
        date,
        vehicle: vehicle || null,
        license_plate: licensePlate || null,
        location: location || null,
        mileage: mileage ? parseFloat(mileage) : null,
        observations: observations || null,
        receipt_url: receiptUrl,
      } as any);

      if (error) throw error;

      toast({ title: 'Gasto registrado com sucesso!' });
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Gasto removido!' });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const typeLabel = subTab === 'abastecimento' ? 'Abastecimento' : 'Pedágio';
  const TypeIcon = subTab === 'abastecimento' ? Fuel : Receipt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Fuel className="h-7 w-7" />
              Gastos Operacionais
            </h2>
            <p className="text-white/80 mt-1">Controle de abastecimento e pedágio</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Total geral</p>
            <p className="text-3xl font-bold">R$ {totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'abastecimento' | 'pedagio')}>
        <TabsList className="grid w-full grid-cols-2 rounded-2xl h-12">
          <TabsTrigger value="abastecimento" className="rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Fuel className="h-4 w-4" />
            Abastecimento
          </TabsTrigger>
          <TabsTrigger value="pedagio" className="rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Receipt className="h-4 w-4" />
            Pedágio
          </TabsTrigger>
        </TabsList>

        <TabsContent value={subTab} className="mt-4 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mês atual</p>
                  <p className="text-lg font-bold text-foreground">R$ {currentMonthTotal.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registros</p>
                  <p className="text-lg font-bold text-foreground">{currentMonthExpenses.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload & Form */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TypeIcon className="h-5 w-5 text-primary" />
                Novo {typeLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Comprovante (foto)
                  </Label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-20 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/30">
                        {receiptPreview ? (
                          <img src={receiptPreview} alt="Preview" className="h-16 w-auto rounded-xl object-cover" />
                        ) : (
                          <>
                            <Camera className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Tirar foto ou selecionar</span>
                          </>
                        )}
                      </div>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                  {receiptFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExtractFromImage}
                      disabled={isExtracting}
                      className="w-full rounded-xl gap-2"
                    >
                      {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isExtracting ? 'Extraindo com IA...' : 'Extrair dados com IA'}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Valor (R$) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="pl-9 rounded-xl"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Data *
                    </Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Veículo
                    </Label>
                    <div className="relative">
                      <Car className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={vehicle} onChange={e => setVehicle(e.target.value)} className="pl-9 rounded-xl" placeholder="Modelo" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Placa
                    </Label>
                    <Input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="rounded-xl" placeholder="ABC-1234" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Local
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={location} onChange={e => setLocation(e.target.value)} className="pl-9 rounded-xl" placeholder={subTab === 'pedagio' ? 'Praça de pedágio' : 'Posto'} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      KM
                    </Label>
                    <div className="relative">
                      <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" value={mileage} onChange={e => setMileage(e.target.value)} className="pl-9 rounded-xl" placeholder="0" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observações
                  </Label>
                  <Textarea value={observations} onChange={e => setObservations(e.target.value)} className="rounded-xl resize-none" rows={2} placeholder="Observações adicionais..." />
                </div>

                <Button type="submit" variant="hero" className="w-full rounded-2xl h-12" disabled={isUploading}>
                  {isUploading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</span>
                  ) : (
                    `Registrar ${typeLabel}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TypeIcon className="h-4 w-4" />
              Histórico de {typeLabel}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : expenses.length === 0 ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <TypeIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>Nenhum registro de {typeLabel.toLowerCase()} encontrado</p>
                </CardContent>
              </Card>
            ) : (
              expenses.map((expense) => (
                <Card key={expense.id} className="rounded-2xl border-border/50 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expense.receipt_url ? (
                          <img src={expense.receipt_url} alt="Comprovante" className="h-12 w-12 rounded-xl object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            R$ {expense.amount?.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expense.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                            {expense.location && ` • ${expense.location}`}
                          </p>
                          {expense.vehicle && (
                            <p className="text-xs text-muted-foreground">
                              {expense.vehicle} {expense.license_plate && `• ${expense.license_plate}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
