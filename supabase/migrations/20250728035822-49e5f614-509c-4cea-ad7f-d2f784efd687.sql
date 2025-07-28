-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Criar políticas para o bucket de avatares
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Adicionar coluna avatar_url à tabela profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Criar tabela para frases do dia
CREATE TABLE public.daily_phrases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phrase TEXT NOT NULL,
  author TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_phrases ENABLE ROW LEVEL SECURITY;

-- Política para visualizar frases do dia
CREATE POLICY "Anyone can view daily phrases" 
ON public.daily_phrases 
FOR SELECT 
USING (true);

-- Política para gerenciar frases do dia (apenas usuários autenticados)
CREATE POLICY "Authenticated users can manage daily phrases" 
ON public.daily_phrases 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Inserir algumas frases motivacionais
INSERT INTO public.daily_phrases (phrase, author) VALUES 
('O sucesso é a soma de pequenos esforços repetidos dia após dia.', 'Robert Collier'),
('A disciplina é a ponte entre objetivos e conquistas.', 'Jim Rohn'),
('O trabalho em equipe é o combustível que permite que pessoas comuns alcancem resultados extraordinários.', 'Andrew Carnegie'),
('A excelência não é um ato, mas um hábito.', 'Aristóteles'),
('O comprometimento com a excelência é o que diferencia o profissional comum do excepcional.', 'Anônimo'),
('A responsabilidade é o preço da grandeza.', 'Winston Churchill'),
('O maior patrimônio de uma empresa são seus funcionários comprometidos.', 'Anônimo'),
('A pontualidade é o respeito que demonstramos pelo tempo dos outros.', 'Anônimo'),
('Um líder é aquele que conhece o caminho, segue o caminho e mostra o caminho.', 'John C. Maxwell'),
('A qualidade não é um acidente; é sempre o resultado do esforço inteligente.', 'John Ruskin');