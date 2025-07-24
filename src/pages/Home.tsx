import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  Building2, 
  Star,
  CheckCircle,
  BarChart3,
  UserPlus
} from 'lucide-react';
import { RegisterForm } from '@/components/RegisterForm';

export const Home = () => {
  const [showRegister, setShowRegister] = useState(false);

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Controle de FTs",
      description: "Registre e acompanhe folgas trabalhadas com facilidade"
    },
    {
      icon: <Calendar className="h-8 w-8 text-destructive" />,
      title: "Gestão de Faltas",
      description: "Monitore faltas de funcionários em tempo real"
    },
    {
      icon: <FileText className="h-8 w-8 text-accent" />,
      title: "Relatórios Completos",
      description: "Exporte dados em Excel/CSV para análise detalhada"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Gestão de Funcionários",
      description: "Cadastre e gerencie sua equipe por condomínio"
    },
    {
      icon: <Building2 className="h-8 w-8 text-accent" />,
      title: "Multi-Condomínios",
      description: "Controle múltiplos condomínios em uma única plataforma"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Dashboard em Tempo Real",
      description: "Visualize estatísticas atualizadas instantaneamente"
    }
  ];

  const benefits = [
    "Interface intuitiva e responsiva",
    "Controle de acesso por níveis",
    "Dados seguros na nuvem",
    "Relatórios personalizáveis",
    "Sincronização em tempo real",
    "Suporte mobile e desktop"
  ];

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <img 
                src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
                alt="RondaTrack Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                  const icon = img.nextElementSibling as HTMLElement;
                  if (icon) icon.style.display = 'flex';
                }}
              />
              <Shield className="h-6 w-6 text-white hidden" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                RondaTrack <span className="text-primary">2</span>
              </h1>
              <p className="text-sm text-muted-foreground">Sistema de Controle Profissional</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowRegister(true)} 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Começar Agora
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 text-sm px-6 py-2 bg-primary/10 text-primary border-primary/20">
              Solução Profissional para Condomínios
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Gestão Completa de
              <br />
              Folgas e Faltas
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Controle profissional para administradores de condomínios. 
              Registre FTs, monitore faltas e gere relatórios completos com nossa plataforma intuitiva.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => setShowRegister(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-6 text-lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Cadastrar Agora
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Ver Demonstração
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">Real-time</div>
                <div className="text-sm text-muted-foreground">Atualizações</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">Multi</div>
                <div className="text-sm text-muted-foreground">Dispositivos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Funcionalidades <span className="text-primary">Principais</span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para uma gestão eficiente e profissional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher o <span className="text-primary">RondaTrack 2</span>?
              </h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Nossa plataforma foi desenvolvida especificamente para atender as necessidades 
                de administradores de condomínios, oferecendo controle total sobre a gestão de pessoal.
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="text-center p-6 border-0 shadow-md">
                    <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">5.0</div>
                    <div className="text-sm text-muted-foreground">Avaliação</div>
                  </Card>
                  <Card className="text-center p-6 border-0 shadow-md">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-accent">500+</div>
                    <div className="text-sm text-muted-foreground">Usuários</div>
                  </Card>
                  <Card className="text-center p-6 border-0 shadow-md">
                    <Building2 className="h-8 w-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">100+</div>
                    <div className="text-sm text-muted-foreground">Condomínios</div>
                  </Card>
                  <Card className="text-center p-6 border-0 shadow-md">
                    <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-accent">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para revolucionar sua gestão?
          </h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a centenas de administradores que já confiam no RondaTrack 2
          </p>
          <Button 
            size="lg"
            onClick={() => setShowRegister(true)}
            className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Começar Gratuitamente
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-xl font-bold">
              RondaTrack <span className="text-primary">2</span>
            </h4>
          </div>
          <p className="text-muted opacity-70">
            © 2024 RondaTrack 2. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};