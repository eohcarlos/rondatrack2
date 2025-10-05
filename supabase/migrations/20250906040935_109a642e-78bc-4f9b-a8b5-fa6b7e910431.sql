-- Corrigir company_id dos condomínios
UPDATE public.condominiums 
SET company_id = '84d0206d-aa12-4bb2-a985-ae46c2bad9c9'
WHERE name = 'Alphaville Castello' AND company_id IS NULL;

UPDATE public.condominiums 
SET company_id = 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'
WHERE name = 'Atlas' AND (company_id IS NULL OR company_id != 'bb97ecef-7f2c-41f2-9549-2a8296ef4472');