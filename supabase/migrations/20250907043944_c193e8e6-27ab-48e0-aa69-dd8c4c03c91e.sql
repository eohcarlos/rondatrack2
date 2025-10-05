-- Remover constraint única do title e criar constraint composta
ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_title_key;

-- Criar constraint única composta (title + company_id)
ALTER TABLE public.positions ADD CONSTRAINT positions_title_company_unique UNIQUE (title, company_id);

-- Agora inserir todos os cargos para a Plan
INSERT INTO public.positions (title, description, company_id) VALUES
('Apoio Armado', 'Segurança armada de apoio', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('CCO', 'Central de Controle Operacional', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('P2', 'Posto de segurança P2', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('P3', 'Posto de segurança P3', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Portaria', 'Responsável pela portaria e controle de acesso', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Porteiro', 'Responsável pela portaria', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Ronda', 'Responsável pela ronda de segurança', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Triagem', 'Responsável pela triagem de visitantes e correspondências', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Vigia', 'Responsável pela vigilância do condomínio', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Vigilante', 'Vigilante de segurança patrimonial', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472'),
('Zelador', 'Responsável pela zeladoria', 'bb97ecef-7f2c-41f2-9549-2a8296ef4472');