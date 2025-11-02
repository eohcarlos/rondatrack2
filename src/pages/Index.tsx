import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoginForm } from '@/components/LoginForm';
import { AccessCodeForm } from '@/components/AccessCodeForm';
import { CompanyCodeForm } from '@/components/CompanyCodeForm';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasAccessCode, setHasAccessCode] = useState<boolean | null>(null);
  const [hasCompanyCode, setHasCompanyCode] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    
    const loadCompanyInfo = async (userId: string) => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          setHasCompanyCode(false);
          setHasAccessCode(false);
          return;
        }

        if (profile && profile.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', profile.company_id)
            .maybeSingle();

          if (!mounted) return;

          const companyName = company?.name || '';
          localStorage.setItem('companyId', profile.company_id);
          localStorage.setItem('companyName', companyName);
          localStorage.setItem('companyCodeVerified', 'true');
          setHasCompanyCode(true);
          setCompanyName(companyName);
        } else {
          setHasCompanyCode(false);
        }
        
        const accessCodeVerified = localStorage.getItem('accessCodeVerified');
        setHasAccessCode(accessCodeVerified === 'true');
      } catch (error) {
        console.error('Erro ao carregar informações da empresa:', error);
        if (mounted) {
          setHasCompanyCode(false);
          setHasAccessCode(false);
        }
      }
    };

    // Configurar listener ANTES de verificar sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      if (!mounted) return;
      
      // Apenas atualizações síncronas aqui
      setIsAuthenticated(!!session);
      
      if (session) {
        // Verificar primeiro o localStorage
        const storedCompanyId = localStorage.getItem('companyId');
        const storedCompanyName = localStorage.getItem('companyName');
        const storedCompanyVerified = localStorage.getItem('companyCodeVerified');
        const accessCodeVerified = localStorage.getItem('accessCodeVerified');
        
        if (storedCompanyId && storedCompanyVerified === 'true') {
          setHasCompanyCode(true);
          setCompanyName(storedCompanyName || '');
          setHasAccessCode(accessCodeVerified === 'true');
        } else {
          // Defer Supabase calls
          setTimeout(() => {
            if (mounted) {
              loadCompanyInfo(session.user.id);
            }
          }, 0);
        }
      } else {
        // Limpar estados quando deslogar
        setHasAccessCode(null);
        setHasCompanyCode(null);
        setCompanyName('');
        localStorage.removeItem('accessCodeVerified');
        localStorage.removeItem('companyCodeVerified');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
      }
    });

    // DEPOIS verificar sessão inicial
    const checkInitialAuth = async () => {
      try {
        console.log('Verificando sessão inicial...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Session:', session ? 'Existe' : 'Não existe');
        setIsAuthenticated(!!session);
        
        if (session) {
          const storedCompanyId = localStorage.getItem('companyId');
          const storedCompanyName = localStorage.getItem('companyName');
          const storedCompanyVerified = localStorage.getItem('companyCodeVerified');
          const accessCodeVerified = localStorage.getItem('accessCodeVerified');
          
          if (storedCompanyId && storedCompanyVerified === 'true') {
            setHasCompanyCode(true);
            setCompanyName(storedCompanyName || '');
            setHasAccessCode(accessCodeVerified === 'true');
          } else {
            await loadCompanyInfo(session.user.id);
          }
        }
      } catch (error) {
        console.error('Erro crítico no carregamento:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setHasCompanyCode(false);
          setHasAccessCode(false);
        }
      }
    };

    checkInitialAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null || (isAuthenticated && (hasAccessCode === null || hasCompanyCode === null))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-accent">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando RondaTrack2...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!hasCompanyCode) {
    return <CompanyCodeForm onSuccess={(companyId, companyName) => {
      setHasCompanyCode(true);
      setCompanyName(companyName);
    }} />;
  }

  if (!hasAccessCode) {
    return <AccessCodeForm onSuccess={() => setHasAccessCode(true)} />;
  }

  return (
    <Dashboard 
      onLogout={() => {
        setIsAuthenticated(false);
        setHasAccessCode(null);
        setHasCompanyCode(null);
        setCompanyName('');
        localStorage.removeItem('accessCodeVerified');
        localStorage.removeItem('companyCodeVerified');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
      }} 
      onGoHome={() => {}}
      companyName={companyName}
    />
  );
};

export default Index;
