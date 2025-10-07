-- Inserir cargos padrão para empresas que não têm cargos cadastrados
INSERT INTO positions (title, description, company_id)
SELECT 'Porteiro', 'Responsável pela portaria', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL)
UNION ALL
SELECT 'Zelador', 'Responsável pela manutenção', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL)
UNION ALL
SELECT 'Síndico', 'Administração do condomínio', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL)
UNION ALL
SELECT 'Faxineiro', 'Responsável pela limpeza', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL)
UNION ALL
SELECT 'Jardineiro', 'Manutenção de jardins e áreas verdes', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL)
UNION ALL
SELECT 'Assistente', 'Assistente administrativo', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL)
UNION ALL
SELECT 'Gerente', 'Gerente operacional', id FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM positions WHERE company_id IS NOT NULL);