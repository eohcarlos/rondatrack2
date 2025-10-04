-- Ajustar políticas RLS da tabela positions para permitir que admins vejam todos os cargos

-- Remover a política de SELECT existente
DROP POLICY IF EXISTS "Users can view positions from their company" ON positions;

-- Criar nova política de SELECT que permite:
-- 1. Usuários verem cargos da sua empresa
-- 2. Admins verem todos os cargos
CREATE POLICY "Users can view positions from their company or admins can view all"
ON positions
FOR SELECT
USING (
  -- Usuários podem ver cargos da sua empresa
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  OR
  -- Admins podem ver todos os cargos
  has_role(auth.uid(), 'admin'::app_role)
);

-- Ajustar política de ALL para admins também
DROP POLICY IF EXISTS "Authenticated users can manage positions from their company" ON positions;

CREATE POLICY "Users can manage positions from their company or admins can manage all"
ON positions
FOR ALL
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
);