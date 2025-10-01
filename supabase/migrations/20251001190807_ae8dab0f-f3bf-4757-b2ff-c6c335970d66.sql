-- Remover condomínios sem company_id (dados inválidos)
DELETE FROM condominiums WHERE company_id IS NULL;

-- Tornar company_id obrigatório nos condomínios
ALTER TABLE condominiums ALTER COLUMN company_id SET NOT NULL;