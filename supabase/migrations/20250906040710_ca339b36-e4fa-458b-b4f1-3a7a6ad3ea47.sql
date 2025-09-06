-- Atualizar condomínio existente e inserir cargos
DO $$
DECLARE
    grupo_silver_id uuid;
    plan_id uuid;
BEGIN
    -- Get company IDs
    SELECT id INTO grupo_silver_id FROM public.companies WHERE code = '234';
    SELECT id INTO plan_id FROM public.companies WHERE code = '456';
    
    -- Update existing Alphaville Castello with correct company_id
    UPDATE public.condominiums 
    SET company_id = grupo_silver_id 
    WHERE name = 'Alphaville Castello' AND company_id IS NULL;
    
    -- Insert missing positions one by one to avoid duplicates
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Ronda', 'Responsável pela ronda de segurança', grupo_silver_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Ronda' AND company_id = grupo_silver_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Vigia', 'Responsável pela vigilância do condomínio', grupo_silver_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Vigia' AND company_id = grupo_silver_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Triagem', 'Responsável pela triagem de visitantes e correspondências', grupo_silver_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Triagem' AND company_id = grupo_silver_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'CCO', 'Central de Controle Operacional', grupo_silver_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'CCO' AND company_id = grupo_silver_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Vigilante', 'Vigilante de segurança patrimonial', grupo_silver_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Vigilante' AND company_id = grupo_silver_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'P3', 'Posto de segurança P3', grupo_silver_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'P3' AND company_id = grupo_silver_id);
    
    -- Same for Plan company
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Ronda', 'Responsável pela ronda de segurança', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Ronda' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Portaria', 'Responsável pela portaria e controle de acesso', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Portaria' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Vigia', 'Responsável pela vigilância do condomínio', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Vigia' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Triagem', 'Responsável pela triagem de visitantes e correspondências', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Triagem' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'CCO', 'Central de Controle Operacional', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'CCO' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'Vigilante', 'Vigilante de segurança patrimonial', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'Vigilante' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'P3', 'Posto de segurança P3', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'P3' AND company_id = plan_id);
    
    INSERT INTO public.positions (title, description, company_id) 
    SELECT 'P2', 'Posto de segurança P2', plan_id
    WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE title = 'P2' AND company_id = plan_id);
END $$;