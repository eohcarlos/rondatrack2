// Função utilitária para obter o company_id do usuário logado
export const getCurrentCompanyId = (): string | null => {
  return localStorage.getItem('companyId');
};

// Função para verificar se o usuário pertence a uma empresa
export const hasCompanyAccess = (): boolean => {
  const companyId = getCurrentCompanyId();
  const companyCodeVerified = localStorage.getItem('companyCodeVerified');
  return !!(companyId && companyCodeVerified === 'true');
};