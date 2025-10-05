-- Atualizar o usuário sem company_id para a empresa Plan
UPDATE profiles 
SET company_id = 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'
WHERE email = 'iamcarlos.2019@gmail.com' AND company_id IS NULL;