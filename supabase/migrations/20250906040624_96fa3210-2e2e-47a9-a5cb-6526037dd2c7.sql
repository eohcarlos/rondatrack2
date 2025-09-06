-- Inserir dados manualmente um por vez
INSERT INTO public.condominiums (name, address, company_id) 
SELECT 'Alphaville Castello', 'Alphaville, São Paulo', id 
FROM public.companies 
WHERE code = '234' 
AND NOT EXISTS (
    SELECT 1 FROM public.condominiums c2 
    WHERE c2.name = 'Alphaville Castello' 
    AND c2.company_id = companies.id
);

-- Inserir cargos para Grupo Silver
INSERT INTO public.positions (title, description, company_id) 
SELECT 'Ronda', 'Responsável pela ronda de segurança', id 
FROM public.companies 
WHERE code = '234';