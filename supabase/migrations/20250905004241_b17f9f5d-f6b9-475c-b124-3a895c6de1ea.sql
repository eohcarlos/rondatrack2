-- Remover dados existentes e recriar com nomes corretos
DELETE FROM public.condominiums WHERE name IN ('Alphaville Castello', 'Atlas');
DELETE FROM public.positions WHERE title IN ('Porteiro', 'Zelador', 'Síndico', 'Segurança', 'Jardineiro');

-- Inserir dados com nomes corretos
DO $$
DECLARE
    grupo_silver_id uuid;
    plan_id uuid;
BEGIN
    -- Get company IDs
    SELECT id INTO grupo_silver_id FROM public.companies WHERE code = '234';
    SELECT id INTO plan_id FROM public.companies WHERE code = '456';
    
    -- Insert condominiums with correct names
    INSERT INTO public.condominiums (name, address, company_id) VALUES
    ('Alphaville Castello', 'Alphaville, São Paulo', grupo_silver_id),
    ('Atlas', 'São Paulo', plan_id)
    ON CONFLICT DO NOTHING;
    
    -- Insert new positions for Grupo Silver
    INSERT INTO public.positions (title, description, company_id) VALUES
    ('Ronda', 'Responsável pela ronda de segurança', grupo_silver_id),
    ('Portaria', 'Responsável pela portaria e controle de acesso', grupo_silver_id),
    ('Vigia', 'Responsável pela vigilância do condomínio', grupo_silver_id),
    ('Triagem', 'Responsável pela triagem de visitantes e correspondências', grupo_silver_id),
    ('CCO', 'Central de Controle Operacional', grupo_silver_id),
    ('Vigilante', 'Vigilante de segurança patrimonial', grupo_silver_id),
    ('P3', 'Posto de segurança P3', grupo_silver_id),
    ('P2', 'Posto de segurança P2', grupo_silver_id)
    ON CONFLICT DO NOTHING;
    
    -- Insert new positions for Plan
    INSERT INTO public.positions (title, description, company_id) VALUES
    ('Ronda', 'Responsável pela ronda de segurança', plan_id),
    ('Portaria', 'Responsável pela portaria e controle de acesso', plan_id),
    ('Vigia', 'Responsável pela vigilância do condomínio', plan_id),
    ('Triagem', 'Responsável pela triagem de visitantes e correspondências', plan_id),
    ('CCO', 'Central de Controle Operacional', plan_id),
    ('Vigilante', 'Vigilante de segurança patrimonial', plan_id),
    ('P3', 'Posto de segurança P3', plan_id),
    ('P2', 'Posto de segurança P2', plan_id)
    ON CONFLICT DO NOTHING;
END $$;