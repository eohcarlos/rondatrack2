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
    // Check initial auth state
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        try {
          // Buscar o perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
            setHasCompanyCode(false);
          } else if (profile && profile.company_id) {
            // Buscar o nome da empresa separadamente
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .maybeSingle();

            const companyName = company?.name || '';
            localStorage.setItem('companyId', profile.company_id);
            localStorage.setItem('companyName', companyName);
            localStorage.setItem('companyCodeVerified', 'true');
            setHasCompanyCode(true);
            setCompanyName(companyName);
          } else {
            setHasCompanyCode(false);
          }
          
          // Check if user has verified access code
          const accessCodeVerified = localStorage.getItem('accessCodeVerified');
          setHasAccessCode(accessCodeVerified === 'true');
        } catch (error) {
          console.error('Erro no carregamento inicial:', error);
          setHasCompanyCode(false);
          setHasAccessCode(false);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        try {
          // Buscar o perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
            setHasCompanyCode(false);
          } else if (profile && profile.company_id) {
            // Buscar o nome da empresa separadamente
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .maybeSingle();

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
          console.error('Erro ao buscar dados:', error);
          setHasCompanyCode(false);
          setHasAccessCode(false);
        }
      } else {
        setHasAccessCode(null);
        setHasCompanyCode(null);
        setCompanyName('');
        localStorage.removeItem('accessCodeVerified');
        localStorage.removeItem('companyCodeVerified');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
      }
    });

    return () => subscription.unsubscribe();
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
