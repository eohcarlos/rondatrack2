-- Adicionar os mesmos cargos do Grupo Silver para a empresa Plan
INSERT INTO public.positions (title, description, company_id) 
SELECT 
  gs_positions.title,
  gs_positions.description,
  plan_company.id as company_id
FROM 
  (SELECT * FROM companies WHERE code = '234') gs_company
  CROSS JOIN (SELECT * FROM companies WHERE code = '456') plan_company
  INNER JOIN positions gs_positions ON gs_positions.company_id = gs_company.id
WHERE NOT EXISTS (
  SELECT 1 FROM positions p 
  WHERE p.title = gs_positions.title 
  AND p.company_id = plan_company.id
);