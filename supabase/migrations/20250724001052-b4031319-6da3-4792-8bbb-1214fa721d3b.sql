-- Adicionar colunas para nome e sobrenome separados nas tabelas
-- Modificar tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN email TEXT;

-- Modificar tabela employees para ter nome e sobrenome separados
ALTER TABLE public.employees 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Atualizar dados existentes dividindo o nome atual
UPDATE public.profiles 
SET first_name = split_part(name, ' ', 1),
    last_name = CASE 
      WHEN array_length(string_to_array(name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(name, ' '))[2:], ' ')
      ELSE ''
    END;

UPDATE public.employees 
SET first_name = split_part(name, ' ', 1),
    last_name = CASE 
      WHEN array_length(string_to_array(name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(name, ' '))[2:], ' ')
      ELSE ''
    END;

-- Tornar os novos campos obrigatórios após a migração dos dados
ALTER TABLE public.profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET DEFAULT '';

ALTER TABLE public.employees 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET DEFAULT '';

-- Habilitar realtime para todas as tabelas relevantes
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.condominiums REPLICA IDENTITY FULL;
ALTER TABLE public.positions REPLICA IDENTITY FULL;
ALTER TABLE public.worked_leaves REPLICA IDENTITY FULL;
ALTER TABLE public.absences REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.condominiums;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worked_leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;