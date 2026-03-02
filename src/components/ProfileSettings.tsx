import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Save, X, Mail, Shield, Calendar, Clock, Building2, CheckCircle2, XCircle, Camera, KeyRound, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { invalidateProfileCache } from '@/hooks/useProfile';

interface ProfileSettingsProps {
  onClose: () => void;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  approved: boolean;
  approved_at?: string;
  role: string;
  created_at?: string;
  company_id?: string;
}

export const ProfileSettings = ({ onClose }: ProfileSettingsProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new_password: '', confirm: '' });
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
      });

      // Load company name
      if (data.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', data.company_id)
          .single();
        if (company) setCompanyName(company.name);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !profile) return null;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload da imagem",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        if (!avatarUrl) return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          name: `${formData.first_name} ${formData.last_name}`,
          avatar_url: avatarUrl,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      invalidateProfileCache();

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    if (passwords.new_password.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new_password,
      });
      if (error) throw error;

      toast({ title: "Senha alterada com sucesso!" });
      setPasswords({ current: '', new_password: '', confirm: '' });
      setShowPasswordSection(false);
    } catch (error: any) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'gerente': return 'Gerente';
      case 'gestor': return 'Gestor';
      default: return 'Supervisor';
    }
  };

  if (!profile) return null;

  const avatarSrc = avatarPreview || profile.avatar_url;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Profile Header Card */}
      <Card className="border-0 rounded-3xl shadow-xl overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-primary via-primary/90 to-accent">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/5 rounded-full blur-xl" />
          </div>
        </div>
        
        <CardContent className="relative px-6 pb-6">
          {/* Avatar overlapping header */}
          <div className="flex flex-col items-center -mt-14">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-2xl">
                <AvatarImage src={avatarSrc || undefined} alt="Avatar" className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {profile.first_name.charAt(0)}{profile.last_name?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-background rounded-full" />
            </div>

            <h2 className="text-xl font-bold text-foreground mt-3">
              {profile.first_name} {profile.last_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                {getRoleLabel(profile.role)}
              </span>
              {profile.approved ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Aprovado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  Pendente
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <Card className="border-0 rounded-3xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">E-mail</p>
              <p className="text-sm font-medium text-foreground truncate">{profile.email}</p>
            </div>
          </div>

          {companyName && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Empresa</p>
                <p className="text-sm font-medium text-foreground truncate">{companyName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cargo</p>
              <p className="text-sm font-medium text-foreground">{getRoleLabel(profile.role)}</p>
            </div>
          </div>

          {profile.created_at && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Membro desde</p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}

          {profile.approved_at && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Aprovado em</p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(profile.approved_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Card */}
      <Card className="border-0 rounded-3xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Save className="h-4 w-4" />
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-semibold">Nome</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={!profile.approved}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-semibold">Sobrenome</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={!profile.approved}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 rounded-xl">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isUploading}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading || isUploading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-0 rounded-3xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <KeyRound className="h-4 w-4" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordSection ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordSection(true)}
              className="w-full rounded-xl"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showNewPass ? 'text' : 'password'}
                    value={passwords.new_password}
                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="rounded-xl pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Repita a nova senha"
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordSection(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwords.new_password || !passwords.confirm}
                  className="flex-1 rounded-xl"
                >
                  {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
