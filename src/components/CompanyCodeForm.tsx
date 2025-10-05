import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CompanyCodeFormProps {
  onSuccess: (companyId: string, companyName: string) => void;
}

export const CompanyCodeForm = ({ onSuccess }: CompanyCodeFormProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código da empresa",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se o código da empresa existe
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('code', code.trim())
        .single();

      if (error || !company) {
        toast({
          title: "Código inválido",
          description: "Código da empresa não encontrado",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Salvar o company_id no perfil do usuário no banco de dados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        toast({
          title: "Erro",
          description: "Não foi possível vincular a empresa ao seu perfil",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Salvar também no localStorage para acesso rápido
      localStorage.setItem('companyId', company.id);
      localStorage.setItem('companyName', company.name);
      localStorage.setItem('companyCodeVerified', 'true');

      toast({
        title: "Sucesso",
        description: `Bem-vindo à ${company.name}!`
      });

      onSuccess(company.id, company.name);
    } catch (error) {
      console.error('Erro ao verificar código da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-accent p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            RondaTrack2
          </CardTitle>
          <CardDescription>
            Digite o código da sua empresa para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-code">Código da Empresa</Label>
              <Input
                id="company-code"
                type="text"
                placeholder="Ex: 234, 456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className="text-center text-lg font-bold"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};