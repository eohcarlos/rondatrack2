import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, FileText, Shield, Loader2, Copy, Download } from 'lucide-react';

export const AIReportsTab = () => {
  const [reportType, setReportType] = useState<'ronda' | 'portaria' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, descreva o que deseja no relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { reportType, prompt }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedReport(data.report);
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

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
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

  const handleDownloadReport = () => {
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
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
    setGeneratedReport('');
  };

  if (!reportType) {
    return (
      <div className="space-y-6">
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
      </div>
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
            Descreva brevemente o que deseja incluir no relatório e a IA irá gerar um documento completo e profissional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Descrição do Relatório</Label>
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
            disabled={isGenerating || !prompt.trim()}
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
                    onClick={handleCopyReport}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadReport}
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

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Powered by Gemini AI</p>
              <p className="text-xs text-muted-foreground">
                Este gerador usa inteligência artificial para criar relatórios profissionais baseados nas suas descrições.
                Modelos Gemini são gratuitos até 13/10/2025.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
