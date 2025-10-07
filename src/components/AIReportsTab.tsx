import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, FileText, Shield, Loader2, Copy, Download, History, Clock } from 'lucide-react';

interface Report {
  id: string;
  report_type: string;
  reporter_name: string;
  reporter_role: string;
  condominium_name: string;
  prompt: string;
  generated_report: string;
  created_at: string;
}

export const AIReportsTab = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [reportType, setReportType] = useState<'ronda' | 'portaria' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [condominiumName, setCondominiumName] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHistory, setReportHistory] = useState<Report[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'history') {
      loadReportHistory();
    }
  }, [activeTab]);

  const loadReportHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReportHistory(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, descreva o que deseja no relatório.",
        variant: "destructive",
      });
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !role.trim() || !condominiumName.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const reporterName = `${firstName} ${lastName}`;
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { 
          reportType, 
          prompt,
          reporterName,
          reporterRole: role,
          condominiumName
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedReport(data.report);

      // Salvar no histórico
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id)
        .single();

      if (profile?.company_id) {
        await supabase.from('ai_reports').insert({
          company_id: profile.company_id,
          created_by: user?.id,
          report_type: reportType,
          reporter_name: reporterName,
          reporter_role: role,
          condominium_name: condominiumName,
          prompt,
          generated_report: data.report
        });
      }

      toast({
        title: "Relatório gerado!",
        description: "Seu relatório foi criado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = async (report: string) => {
    try {
      await navigator.clipboard.writeText(report);
      toast({
        title: "Copiado!",
        description: "Relatório copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o relatório.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = (report: string, type: string) => {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${type}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado!",
      description: "Seu relatório está sendo baixado.",
    });
  };

  const handleReset = () => {
    setReportType(null);
    setPrompt('');
    setFirstName('');
    setLastName('');
    setRole('');
    setCondominiumName('');
    setGeneratedReport('');
  };

  if (!reportType) {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">
            <Sparkles className="h-4 w-4 mr-2" />
            Novo Relatório
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle>Gerador de Relatórios com IA</CardTitle>
              </div>
              <CardDescription>
                Crie relatórios profissionais e detalhados sobre segurança do condomínio usando inteligência artificial
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
              onClick={() => setReportType('ronda')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Relatório de Ronda</CardTitle>
                    <CardDescription>Inspeções e verificações de segurança</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gere relatórios detalhados sobre rondas de segurança, verificação de perímetro, 
                  inspeção de equipamentos e muito mais.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
              onClick={() => setReportType('portaria')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Relatório de Portaria</CardTitle>
                    <CardDescription>Controle de acesso e movimentação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Documente entradas, saídas, entregas, correspondências e todas as ocorrências 
                  do turno de portaria.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reportHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum relatório gerado ainda</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            reportHistory.map((report) => (
              <Card key={report.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {report.report_type === 'ronda' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {report.report_type === 'ronda' ? 'Ronda' : 'Portaria'} - {report.condominium_name}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleString('pt-BR')}
                          </div>
                          <div className="mt-1">
                            {report.reporter_name} ({report.reporter_role})
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyReport(report.generated_report)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(report.generated_report, report.report_type)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 mb-3">
                    <p className="text-sm font-medium mb-2">Prompt:</p>
                    <p className="text-sm text-muted-foreground">{report.prompt}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-sm">{report.generated_report}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {reportType === 'ronda' ? (
                <Shield className="h-6 w-6 text-primary" />
              ) : (
                <FileText className="h-6 w-6 text-primary" />
              )}
              <CardTitle>
                {reportType === 'ronda' ? 'Relatório de Ronda' : 'Relatório de Portaria'}
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Voltar
            </Button>
          </div>
          <CardDescription>
            Preencha as informações e descreva o que deseja incluir no relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                placeholder="Seu nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                placeholder="Seu sobrenome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo *</Label>
              <Input
                id="role"
                placeholder="Ex: Supervisor de Ronda"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condominium">Nome do Condomínio *</Label>
              <Input
                id="condominium"
                placeholder="Ex: Residencial Jardim das Flores"
                value={condominiumName}
                onChange={(e) => setCondominiumName(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Descrição do Relatório *</Label>
            <Textarea
              id="prompt"
              placeholder={
                reportType === 'ronda'
                  ? "Ex: Foi verificado a cerca elétrica e está tudo ok. Todas as câmeras estão funcionando. Portão principal precisa de manutenção."
                  : "Ex: Turno tranquilo. Recebidas 3 encomendas para o apto 501. Visitante do apto 302 saiu às 18h."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              disabled={isGenerating}
            />
          </div>

          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating || !prompt.trim() || !firstName.trim() || !lastName.trim() || !role.trim() || !condominiumName.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando relatório...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Relatório com IA
              </>
            )}
          </Button>

          {generatedReport && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <Label>Relatório Gerado</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyReport(generatedReport)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadReport(generatedReport, reportType)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg border">
                <div className="whitespace-pre-wrap text-sm">{generatedReport}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};