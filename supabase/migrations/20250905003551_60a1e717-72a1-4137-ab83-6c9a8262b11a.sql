-- Insert Grupo Silver company data
INSERT INTO public.companies (name, code) VALUES ('Grupo Silver', '234')
ON CONFLICT (code) DO NOTHING;

-- Insert Plan company data  
INSERT INTO public.companies (name, code) VALUES ('Plan', '456')
ON CONFLICT (code) DO NOTHING;

-- Get company IDs for reference
DO $$
DECLARE
    grupo_silver_id uuid;
    plan_id uuid;
BEGIN
    -- Get Grupo Silver ID
    SELECT id INTO grupo_silver_id FROM public.companies WHERE code = '234';
    
    -- Get Plan ID
    SELECT id INTO plan_id FROM public.companies WHERE code = '456';
    
    -- Insert condominium for Grupo Silver
    INSERT INTO public.condominiums (name, address, company_id) 
    VALUES ('Alphaville Castello', 'Alphaville, São Paulo', grupo_silver_id)
    ON CONFLICT DO NOTHING;
    
    -- Insert condominium for Plan
    INSERT INTO public.condominiums (name, address, company_id)
    VALUES ('Atlas', 'São Paulo', plan_id)
    ON CONFLICT DO NOTHING;
    
    -- Insert positions for Grupo Silver
    INSERT INTO public.positions (title, description, company_id) VALUES
    ('Porteiro', 'Responsável pela portaria e controle de acesso', grupo_silver_id),
    ('Zelador', 'Responsável pela limpeza e manutenção geral', grupo_silver_id),
    ('Síndico', 'Administrador do condomínio', grupo_silver_id),
    ('Segurança', 'Responsável pela segurança do condomínio', grupo_silver_id),
    ('Jardineiro', 'Responsável pela manutenção de jardins e áreas verdes', grupo_silver_id)
    ON CONFLICT DO NOTHING;
    
    -- Insert positions for Plan
    INSERT INTO public.positions (title, description, company_id) VALUES
    ('Porteiro', 'Responsável pela portaria e controle de acesso', plan_id),
    ('Zelador', 'Responsável pela limpeza e manutenção geral', plan_id),
    ('Síndico', 'Administrador do condomínio', plan_id),
    ('Segurança', 'Responsável pela segurança do condomínio', plan_id),
    ('Jardineiro', 'Responsável pela manutenção de jardins e áreas verdes', plan_id)
    ON CONFLICT DO NOTHING;
END $$;