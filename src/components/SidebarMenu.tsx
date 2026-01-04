import { memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Clock, 
  Calendar, 
  Download, 
  Briefcase, 
  Sparkles,
  User,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  profile: { first_name: string; last_name: string; role: string; avatar_url?: string } | null;
  isAdmin: boolean;
  onNavigateProfile: () => void;
  onNavigateAdmin: () => void;
  onLogout: () => void;
  companyName?: string;
}

const menuItems = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-primary' },
  { value: 'employees', label: 'Funcionários', icon: Users, color: 'text-accent' },
  { value: 'positions', label: 'Cargos', icon: Briefcase, color: 'text-warning' },
  { value: 'condominiums', label: 'Condomínios', icon: Building2, color: 'text-warning' },
  { value: 'worked-leaves', label: 'Folgas Trabalhadas', icon: Clock, color: 'text-primary' },
  { value: 'absences', label: 'Faltas', icon: Calendar, color: 'text-destructive' },
  { value: 'reports', label: 'Relatórios', icon: Download, color: 'text-accent' },
  { value: 'ai', label: 'IA Reports', icon: Sparkles, color: 'text-primary' },
];

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'gerente': return 'Gerente';
    case 'gestor': return 'Gestor';
    default: return 'Supervisor';
  }
};

export const SidebarMenu = memo(({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange,
  profile,
  isAdmin,
  onNavigateProfile,
  onNavigateAdmin,
  onLogout,
  companyName
}: SidebarMenuProps) => {
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className="w-[300px] sm:w-[350px] p-0 bg-gradient-to-b from-card via-card to-muted/30 border-r border-border/50"
      >
        <div className="flex flex-col h-full">
          {/* Header com perfil */}
          <div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
                  alt="RondaTrack Logo" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <SheetTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    RondaTrack 2
                  </SheetTitle>
                  {companyName && (
                    <p className="text-xs text-muted-foreground">{companyName}</p>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Perfil do usuário */}
            {profile && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                <Avatar className="h-12 w-12 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile.avatar_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {profile.first_name.charAt(0)}{profile.last_name?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(profile.role)}</p>
                </div>
              </div>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Menu Principal
            </p>
            {menuItems.map((item) => {
              const isActive = activeTab === item.value;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.value}
                  onClick={() => handleTabChange(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                      : 'hover:bg-muted/80 text-foreground'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isActive 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-muted group-hover:bg-background'
                  }`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : item.color}`} />
                  </div>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'opacity-100 text-primary-foreground' : 'text-muted-foreground'
                  }`} />
                </button>
              );
            })}
          </nav>

          <Separator className="opacity-50" />

          {/* Footer Actions */}
          <div className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Configurações
            </p>
            
            <button
              onClick={() => { onNavigateProfile(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/80 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-left font-medium">Meu Perfil</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {isAdmin && (
              <button
                onClick={() => { onNavigateAdmin(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/80 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <span className="flex-1 text-left font-medium">Administração</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-all group text-destructive"
            >
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="flex-1 text-left font-medium">Sair</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

SidebarMenu.displayName = 'SidebarMenu';
