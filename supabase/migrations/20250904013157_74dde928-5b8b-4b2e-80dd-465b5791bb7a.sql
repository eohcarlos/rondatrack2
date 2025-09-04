-- Create companies table
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to existing tables
ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employees ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.condominiums ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.positions ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.absences ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.worked_leaves ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Insert sample companies
INSERT INTO public.companies (name, code) VALUES 
('Grupo Silver', '234'),
('Plan', '456');

-- Create RLS policies for companies
CREATE POLICY "Users can view their company" 
ON public.companies 
FOR SELECT 
USING (id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for all tables to include company filtering
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.employees;
CREATE POLICY "Users can view employees from their company" 
ON public.employees 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can manage employees from their company" 
ON public.employees 
FOR ALL 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view condominiums" ON public.condominiums;
DROP POLICY IF EXISTS "Authenticated users can manage condominiums" ON public.condominiums;
CREATE POLICY "Users can view condominiums from their company" 
ON public.condominiums 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can manage condominiums from their company" 
ON public.condominiums 
FOR ALL 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view positions" ON public.positions;
DROP POLICY IF EXISTS "Authenticated users can manage positions" ON public.positions;
CREATE POLICY "Users can view positions from their company" 
ON public.positions 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can manage positions from their company" 
ON public.positions 
FOR ALL 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view absences" ON public.absences;
DROP POLICY IF EXISTS "Authenticated users can manage absences" ON public.absences;
CREATE POLICY "Users can view absences from their company" 
ON public.absences 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can manage absences from their company" 
ON public.absences 
FOR ALL 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view worked leaves" ON public.worked_leaves;
DROP POLICY IF EXISTS "Authenticated users can manage worked leaves" ON public.worked_leaves;
CREATE POLICY "Users can view worked leaves from their company" 
ON public.worked_leaves 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can manage worked leaves from their company" 
ON public.worked_leaves 
FOR ALL 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Update profiles policies to include company filtering
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles from their company" 
ON public.profiles 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()) OR user_id = auth.uid());

-- Create trigger for updated_at on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();