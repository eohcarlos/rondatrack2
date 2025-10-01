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
        // Buscar o perfil do usuário para verificar se já tem empresa vinculada
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, companies(name)')
          .eq('user_id', session.user.id)
          .single();

        if (profile && profile.company_id) {
          // Usuário já tem empresa vinculada
          const companyName = (profile.companies as any)?.name || '';
          localStorage.setItem('companyId', profile.company_id);
          localStorage.setItem('companyName', companyName);
          localStorage.setItem('companyCodeVerified', 'true');
          setHasCompanyCode(true);
          setCompanyName(companyName);
        } else {
          // Usuário ainda não tem empresa vinculada
          setHasCompanyCode(false);
        }
        
        // Check if user has verified access code
        const accessCodeVerified = localStorage.getItem('accessCodeVerified');
        setHasAccessCode(accessCodeVerified === 'true');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        // Buscar o perfil do usuário para verificar se já tem empresa vinculada
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, companies(name)')
          .eq('user_id', session.user.id)
          .single();

        if (profile && profile.company_id) {
          // Usuário já tem empresa vinculada
          const companyName = (profile.companies as any)?.name || '';
          localStorage.setItem('companyId', profile.company_id);
          localStorage.setItem('companyName', companyName);
          localStorage.setItem('companyCodeVerified', 'true');
          setHasCompanyCode(true);
          setCompanyName(companyName);
        } else {
          // Usuário ainda não tem empresa vinculada
          setHasCompanyCode(false);
        }
        
        const accessCodeVerified = localStorage.getItem('accessCodeVerified');
        setHasAccessCode(accessCodeVerified === 'true');
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
