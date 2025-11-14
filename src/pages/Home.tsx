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
  UserPlus,
  Zap,
  Lock,
  TrendingUp,
  Award,
  HeadphonesIcon,
  Sparkles
} from 'lucide-react';
import { RegisterForm } from '@/components/RegisterForm';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export const Home = () => {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Controle de FTs",
      description: "Registre e acompanhe folgas trabalhadas com facilidade",
      details: "Sistema completo para registro de folgas trabalhadas, com controle de valores, datas e aprovações. Visualize o histórico completo e gerencie pagamentos pendentes com facilidade."
    },
    {
      icon: <Calendar className="h-8 w-8 text-destructive" />,
      title: "Gestão de Faltas",
      description: "Monitore faltas de funcionários em tempo real",
      details: "Controle detalhado de todas as ausências, incluindo motivos (doença, atestado, falta injustificada). Acompanhe estatísticas mensais e identifique padrões para melhor gestão."
    },
    {
      icon: <FileText className="h-8 w-8 text-accent" />,
      title: "Relatórios Completos",
      description: "Exporte dados em Excel/CSV para análise detalhada",
      details: "Gere relatórios personalizados com filtros por período, funcionário, condomínio e status. Exporte para Excel, CSV ou PDF com um clique para análises e apresentações."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Gestão de Funcionários",
      description: "Cadastre e gerencie sua equipe por condomínio",
      details: "Mantenha um cadastro completo com foto, cargo, turno, telefone e local de trabalho. Organize funcionários por condomínio e controle seus níveis de acesso ao sistema."
    },
    {
      icon: <Building2 className="h-8 w-8 text-accent" />,
      title: "Multi-Condomínios",
      description: "Controle múltiplos condomínios em uma única plataforma",
      details: "Gerencie quantos condomínios precisar em um único lugar. Cada condomínio mantém suas próprias equipes, relatórios e estatísticas de forma organizada e independente."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Dashboard em Tempo Real",
      description: "Visualize estatísticas atualizadas instantaneamente",
      details: "Acompanhe métricas em tempo real: total de funcionários, FTs do mês, faltas registradas e muito mais. Dados sempre atualizados automaticamente sem necessidade de refresh."
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

  const qualityFeatures = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Desempenho Rápido",
      description: "Carregamento instantâneo e navegação fluida em qualquer dispositivo",
      details: "Desenvolvido com as melhores práticas de performance, garantindo carregamento rápido mesmo em conexões lentas. Interface responsiva que se adapta perfeitamente a todos os tamanhos de tela."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Segurança Total",
      description: "Criptografia de ponta a ponta e conformidade com LGPD",
      details: "Seus dados são protegidos com criptografia de nível bancário. Sistema auditado e em conformidade com a Lei Geral de Proteção de Dados (LGPD). Backups automáticos diários."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Sempre Atualizado",
      description: "Atualizações automáticas com novas funcionalidades constantemente",
      details: "Receba automaticamente as últimas funcionalidades e melhorias sem necessidade de instalação. Sistema sempre na versão mais recente, com novos recursos baseados no feedback dos usuários."
    },
    {
      icon: <HeadphonesIcon className="h-6 w-6" />,
      title: "Suporte Dedicado",
      description: "Equipe pronta para ajudar quando você precisar",
      details: "Conte com nossa equipe de suporte especializada para tirar dúvidas e resolver problemas. Atendimento rápido e personalizado para garantir que você aproveite ao máximo o sistema."
    }
  ];

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5 overflow-y-auto overflow-x-hidden max-w-full">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md shadow-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png" 
                  alt="RondaTrack Logo" 
                  className="w-6 h-6 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                    const icon = img.nextElementSibling as HTMLElement;
                    if (icon) icon.style.display = 'flex';
                  }}
                />
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-primary hidden" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  RondaTrack <span className="text-primary">2</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Sistema de Controle Profissional</p>
              </div>
            </div>

            <div className="flex gap-1 sm:gap-2 flex-shrink-0 items-center">
              <div className="scale-75">
                <ThemeToggle />
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="border-primary text-primary hover:bg-primary/5 px-2 sm:px-4"
              >
                <span className="hidden xs:inline">Login</span>
                <Shield className="h-4 w-4 xs:hidden" />
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowRegister(true)} 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-2 sm:px-4"
              >
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Começar Agora</span>
                <span className="sm:hidden">Cadastrar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 text-sm px-6 py-2 bg-primary/10 text-primary border-primary/20">
              Solução Profissional para Condomínios
            </Badge>
            
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent px-2">
              Gestão Completa de
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Folgas e Faltas
            </h2>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Controle profissional para administradores de condomínios. 
              Registre FTs, monitore faltas e gere relatórios completos com nossa plataforma intuitiva.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg"
              >
                <Shield className="h-5 w-5 mr-2" />
                Fazer Login
              </Button>
              <Button 
                size="lg" 
                onClick={() => setShowRegister(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-6 text-lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Cadastrar Agora
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">100%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-accent">24/7</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Disponível</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">Real-time</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Atualizações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-accent">Multi</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Dispositivos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Funcionalidades <span className="text-primary">Principais</span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para uma gestão eficiente e profissional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader className="text-center pb-4 lg:pb-6 lg:pt-8">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl lg:text-2xl mb-2 lg:mb-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="lg:px-8 lg:pb-8">
                  <CardDescription className="text-center text-base lg:text-lg mb-4">
                    {feature.description}
                  </CardDescription>
                  <p className="hidden lg:block text-sm text-muted-foreground text-center leading-relaxed">
                    {feature.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="lg:pr-12">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 lg:mb-8">
                Por que escolher o <span className="text-primary">RondaTrack 2</span>?
              </h3>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 lg:mb-12 leading-relaxed">
                Nossa plataforma foi desenvolvida especificamente para atender as necessidades 
                de administradores de condomínios, oferecendo controle total sobre a gestão de pessoal.
              </p>
              
              <div className="grid grid-cols-1 gap-4 lg:gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 lg:space-x-4 group">
                    <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-foreground text-base lg:text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-12">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 lg:p-12">
                <div className="grid grid-cols-2 gap-4 lg:gap-8">
                  <Card className="text-center p-4 lg:p-8 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <Star className="h-8 w-8 lg:h-12 lg:w-12 text-accent mx-auto mb-2 lg:mb-4" />
                    <div className="text-2xl lg:text-4xl font-bold text-primary">5.0</div>
                    <div className="text-xs lg:text-base text-muted-foreground mt-1 lg:mt-2">Avaliação</div>
                  </Card>
                  <Card className="text-center p-4 lg:p-8 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <Users className="h-8 w-8 lg:h-12 lg:w-12 text-primary mx-auto mb-2 lg:mb-4" />
                    <div className="text-2xl lg:text-4xl font-bold text-accent">500+</div>
                    <div className="text-xs lg:text-base text-muted-foreground mt-1 lg:mt-2">Usuários</div>
                  </Card>
                  <Card className="text-center p-4 lg:p-8 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <Building2 className="h-8 w-8 lg:h-12 lg:w-12 text-accent mx-auto mb-2 lg:mb-4" />
                    <div className="text-2xl lg:text-4xl font-bold text-primary">100+</div>
                    <div className="text-xs lg:text-base text-muted-foreground mt-1 lg:mt-2">Condomínios</div>
                  </Card>
                  <Card className="text-center p-4 lg:p-8 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <Clock className="h-8 w-8 lg:h-12 lg:w-12 text-primary mx-auto mb-2 lg:mb-4" />
                    <div className="text-2xl lg:text-4xl font-bold text-accent">99.9%</div>
                    <div className="text-xs lg:text-base text-muted-foreground mt-1 lg:mt-2">Uptime</div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 text-sm px-6 py-2 bg-accent/10 text-accent border-accent/20">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Qualidade Garantida
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Excelência em <span className="text-primary">Cada Detalhe</span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Desenvolvido com tecnologia de ponta para oferecer a melhor experiência possível
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
            {qualityFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="pt-6 lg:pt-10 lg:pb-10 lg:px-6">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h4 className="font-bold text-lg lg:text-xl mb-2 lg:mb-4">{feature.title}</h4>
                  <p className="text-sm lg:text-base text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <p className="hidden lg:block text-xs text-muted-foreground leading-relaxed">
                    {feature.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sistema Explicado */}
          <div className="max-w-6xl mx-auto">
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-accent p-6 lg:p-12 text-white">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 lg:h-10 lg:w-10 mr-3" />
                  Como Funciona o RondaTrack 2
                </h3>
                <p className="text-center text-base lg:text-xl opacity-90">
                  Sistema completo de gestão para administradores de condomínios
                </p>
              </div>
              <CardContent className="p-6 lg:p-12">
                <div className="space-y-6 lg:space-y-10">
                  <div className="flex gap-4 lg:gap-6 group hover:bg-muted/20 p-3 lg:p-6 rounded-xl transition-all duration-300">
                    <div className="flex-shrink-0 w-10 h-10 lg:w-14 lg:h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-base lg:text-xl group-hover:scale-110 transition-transform duration-300">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg lg:text-2xl mb-2 lg:mb-3">Cadastro de Funcionários e Condomínios</h4>
                      <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                        Registre todos os seus funcionários com informações detalhadas como cargo, turno, e local de trabalho. 
                        Organize por condomínios para melhor controle. Sistema permite adicionar fotos, telefones e definir níveis de acesso individuais.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 lg:gap-6 group hover:bg-muted/20 p-3 lg:p-6 rounded-xl transition-all duration-300">
                    <div className="flex-shrink-0 w-10 h-10 lg:w-14 lg:h-14 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-base lg:text-xl group-hover:scale-110 transition-transform duration-300">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg lg:text-2xl mb-2 lg:mb-3">Registro de Folgas Trabalhadas (FTs)</h4>
                      <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                        Registre facilmente quando um funcionário trabalha em seu dia de folga. 
                        Controle valores, datas e obtenha aprovação de supervisores com um clique. Acompanhe o status (pendente, aprovado, pago) e gerencie pagamentos.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 lg:gap-6 group hover:bg-muted/20 p-3 lg:p-6 rounded-xl transition-all duration-300">
                    <div className="flex-shrink-0 w-10 h-10 lg:w-14 lg:h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-base lg:text-xl group-hover:scale-110 transition-transform duration-300">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg lg:text-2xl mb-2 lg:mb-3">Controle de Faltas</h4>
                      <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                        Monitore todas as faltas com motivos detalhados (doença, atestado, falta injustificada, etc.). 
                        Mantenha histórico completo e organizado. Adicione observações e justificativas para cada registro.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 lg:gap-6 group hover:bg-muted/20 p-3 lg:p-6 rounded-xl transition-all duration-300">
                    <div className="flex-shrink-0 w-10 h-10 lg:w-14 lg:h-14 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-base lg:text-xl group-hover:scale-110 transition-transform duration-300">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg lg:text-2xl mb-2 lg:mb-3">Dashboard e Relatórios</h4>
                      <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                        Visualize estatísticas em tempo real no dashboard interativo. 
                        Exporte relatórios detalhados em Excel ou PDF para análises e arquivamento. Filtros avançados por período, funcionário, condomínio e status.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      5
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">Controle de Acesso Multinível</h4>
                      <p className="text-muted-foreground">
                        Sistema com diferentes níveis de acesso: Administradores têm controle total, 
                        Supervisores aprovam FTs e faltas, e Funcionários podem visualizar seus próprios registros.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-xl font-bold text-foreground">
              RondaTrack <span className="text-primary">2</span>
            </h4>
          </div>
          <p className="text-muted-foreground">
            © 2024 RondaTrack 2. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};