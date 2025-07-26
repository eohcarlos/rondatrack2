
-- Adicionar campo para aprovação de usuários
ALTER TABLE public.profiles 
ADD COLUMN approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Criar política para permitir que apenas usuários aprovados façam login efetivo
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only approved users can manage data" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id AND (approved = true OR auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE email = 'eohcarlos.itu@gmail.com'
  )));

-- Aprovar automaticamente o usuário admin
UPDATE public.profiles 
SET approved = true, approved_at = now() 
WHERE email = 'eohcarlos.itu@gmail.com';

-- Criar tabela para detalhes de funcionários (telefone, idade, etc)
CREATE TABLE IF NOT EXISTS public.employee_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  phone TEXT,
  age INTEGER,
  company_time_months INTEGER,
  driver_license TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id)
);

-- Habilitar RLS na tabela employee_details
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view employee details" 
  ON public.employee_details 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage employee details" 
  ON public.employee_details 
  FOR ALL 
  USING (auth.role() = 'authenticated'::text);
