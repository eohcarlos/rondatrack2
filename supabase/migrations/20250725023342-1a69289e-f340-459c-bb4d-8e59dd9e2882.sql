-- Inserir as novas posições solicitadas
INSERT INTO public.positions (title, description) VALUES
('Ronda', 'Responsável pela ronda de segurança'),
('CCO', 'Central de Controle e Operações'),
('Vigia', 'Responsável pela vigilância'),
('Apoio Armado', 'Segurança armada de apoio'),
('P3', 'Policial P3'),
('Triagem', 'Responsável pela triagem e controle')
ON CONFLICT (title) DO NOTHING;