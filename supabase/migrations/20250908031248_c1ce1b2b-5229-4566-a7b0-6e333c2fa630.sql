-- Atualizar registros existentes de worked_leaves sem company_id
UPDATE worked_leaves 
SET company_id = (
  SELECT e.company_id 
  FROM employees e 
  WHERE e.id = worked_leaves.employee_id
)
WHERE company_id IS NULL;

-- Atualizar registros existentes de absences sem company_id
UPDATE absences 
SET company_id = (
  SELECT e.company_id 
  FROM employees e 
  WHERE e.id = absences.employee_id
)
WHERE company_id IS NULL;