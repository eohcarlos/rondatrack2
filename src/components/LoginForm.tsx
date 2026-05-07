import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'supervisor' | 'gestor' | 'gerente'>('supervisor');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Informe seu email', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const companyId = localStorage.getItem('companyId');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: role,
              company_id: companyId
            }
          }
        });
        if (error) throw error;
        toast({
          title: "Conta criada com sucesso!",
          description: "Agora você precisa inserir o código de acesso para acessar o sistema."
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao RondaTrack2."
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/', { replace: true })}
        className="absolute top-6 left-6 text-primary-foreground hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 z-10"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="w-full max-w-md relative z-10">
        {/* Glass card */}
        <div className="backdrop-blur-xl bg-card/95 rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
          {/* Header with gradient accent */}
          <div className="relative px-8 pt-10 pb-8 text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mb-5 shadow-lg ring-4 ring-primary/10">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              RondaTrack 2
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {isForgotPassword
                ? 'Enviaremos um link de recuperação para seu email'
                : isSignUp
                ? 'Crie sua conta para acessar o sistema'
                : 'Sistema de controle de folgas e faltas'}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-5">
              {isSignUp && !isForgotPassword && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nome
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="pl-10 rounded-2xl h-11 border-border/60 bg-muted/30 focus:bg-background transition-colors"
                          placeholder="Seu nome"
                          required={isSignUp}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sobrenome
                      </Label>
                      <div className="relative">
                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="rounded-2xl h-11 border-border/60 bg-muted/30 focus:bg-background transition-colors"
                          placeholder="Sobrenome"
                          required={isSignUp}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cargo
                    </Label>
                    <Select value={role} onValueChange={(value: 'supervisor' | 'gestor' | 'gerente') => setRole(value)}>
                      <SelectTrigger className="rounded-2xl h-11 border-border/60 bg-muted/30 focus:bg-background">
                        <SelectValue placeholder="Selecione seu cargo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="supervisor" className="rounded-xl">Supervisor</SelectItem>
                        <SelectItem value="gestor" className="rounded-xl">Gestor</SelectItem>
                        <SelectItem value="gerente" className="rounded-xl">Gerente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 rounded-2xl h-11 border-border/60 bg-muted/30 focus:bg-background transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-11 rounded-2xl h-11 border-border/60 bg-muted/30 focus:bg-background transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full rounded-2xl h-12 text-base font-semibold shadow-xl shadow-primary/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Carregando...
                  </div>
                ) : isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-xs text-muted-foreground">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
              >
                {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Registre-se'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-primary-foreground/50 mt-6">
          © 2026 RondaTrack2 — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};
