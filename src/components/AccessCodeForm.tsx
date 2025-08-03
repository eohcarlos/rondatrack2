import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface AccessCodeFormProps {
  onSuccess: () => void;
}

export const AccessCodeForm = ({ onSuccess }: AccessCodeFormProps) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (accessCode !== '10203040') {
        toast({
          title: "Código de acesso inválido",
          description: "Digite o código de acesso correto para acessar o sistema.",
          variant: "destructive",
        });
        return;
      }

      // Set access code in localStorage to remember the user has entered it
      localStorage.setItem('accessCodeVerified', 'true');
      
      toast({
        title: "Acesso liberado!",
        description: "Bem-vindo ao RondaTrack2.",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-accent p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Código de Acesso</CardTitle>
          <CardDescription>
            Digite o código de acesso para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Código de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accessCode"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="pl-9"
                  placeholder="Digite o código de acesso"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Entre em contato com o supervisor para obter o código de acesso
              </p>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Acessar Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};