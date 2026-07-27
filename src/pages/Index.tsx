import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoginForm } from '@/components/LoginForm';
import { CompanyCodeForm } from '@/components/CompanyCodeForm';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
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
      } catch (error) {
        console.error('Erro ao carregar informações da empresa:', error);
        if (mounted) {
          setHasCompanyCode(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthenticated(!!session);

      if (session) {
        const storedCompanyId = localStorage.getItem('companyId');
        const storedCompanyName = localStorage.getItem('companyName');
        const storedCompanyVerified = localStorage.getItem('companyCodeVerified');

        if (storedCompanyId && storedCompanyVerified === 'true') {
          setHasCompanyCode(true);
          setCompanyName(storedCompanyName || '');
        } else {
          setTimeout(() => {
            if (mounted) loadCompanyInfo(session.user.id);
          }, 0);
        }
      } else {
        setHasCompanyCode(null);
        setCompanyName('');
        localStorage.removeItem('companyCodeVerified');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
      }
    });

    const checkInitialAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setIsAuthenticated(!!session);

        if (session) {
          const storedCompanyId = localStorage.getItem('companyId');
          const storedCompanyName = localStorage.getItem('companyName');
          const storedCompanyVerified = localStorage.getItem('companyCodeVerified');

          if (storedCompanyId && storedCompanyVerified === 'true') {
            setHasCompanyCode(true);
            setCompanyName(storedCompanyName || '');
          } else {
            await loadCompanyInfo(session.user.id);
          }
        }
      } catch (error) {
        console.error('Erro crítico no carregamento:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setHasCompanyCode(false);
        }
      }
    };

    checkInitialAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null || (isAuthenticated && hasCompanyCode === null)) {
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
    return <CompanyCodeForm onSuccess={(_companyId, companyName) => {
      setHasCompanyCode(true);
      setCompanyName(companyName);
    }} />;
  }

  return (
    <Dashboard
      onLogout={() => {
        setIsAuthenticated(false);
        setHasCompanyCode(null);
        setCompanyName('');
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
