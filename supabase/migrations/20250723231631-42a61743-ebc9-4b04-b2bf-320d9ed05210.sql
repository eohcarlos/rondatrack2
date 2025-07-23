-- Criar enum para tipos de usuários
CREATE TYPE public.user_role AS ENUM ('supervisor', 'gestor', 'gerente');

-- Criar enum para turnos
CREATE TYPE public.shift_type AS ENUM ('manha', 'tarde', 'noite', 'madrugada');

-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'supervisor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de condomínios
CREATE TABLE public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de cargos
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de funcionários
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position_id UUID REFERENCES public.positions(id) NOT NULL,
  condominium_id UUID REFERENCES public.condominiums(id) NOT NULL,
  shift shift_type NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de folgas trabalhadas (FT)
CREATE TABLE public.worked_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  date DATE NOT NULL,
  supervisor_id UUID REFERENCES public.profiles(id) NOT NULL,
  observations TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Criar tabela de faltas
CREATE TABLE public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  observations TEXT,
  supervisor_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worked_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para condomínios (todos podem ver)
CREATE POLICY "Anyone can view condominiums" ON public.condominiums FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage condominiums" ON public.condominiums FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para cargos (todos podem ver)
CREATE POLICY "Anyone can view positions" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage positions" ON public.positions FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para funcionários (todos podem ver)
CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage employees" ON public.employees FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para folgas trabalhadas
CREATE POLICY "Anyone can view worked leaves" ON public.worked_leaves FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage worked leaves" ON public.worked_leaves FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para faltas
CREATE POLICY "Anyone can view absences" ON public.absences FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage absences" ON public.absences FOR ALL USING (auth.role() = 'authenticated');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_condominiums_updated_at BEFORE UPDATE ON public.condominiums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_worked_leaves_updated_at BEFORE UPDATE ON public.worked_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_absences_updated_at BEFORE UPDATE ON public.absences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), 'supervisor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados iniciais
INSERT INTO public.condominiums (name, address) VALUES 
  ('Residencial Parque das Águas', 'Rua das Águas, 123'),
  ('Condomínio Vila Bela', 'Av. Central, 456'),
  ('Residencial Green Valley', 'Rua Verde, 789');

INSERT INTO public.positions (title, description) VALUES 
  ('Porteiro', 'Responsável pela portaria e controle de acesso'),
  ('Vigilante', 'Responsável pela segurança do condomínio'),
  ('Zelador', 'Responsável pela manutenção e limpeza'),
  ('Administrador', 'Responsável pela administração geral');

INSERT INTO public.employees (name, position_id, condominium_id, shift) VALUES 
  ('João Silva', (SELECT id FROM public.positions WHERE title = 'Porteiro'), (SELECT id FROM public.condominiums WHERE name = 'Residencial Parque das Águas'), 'manha'),
  ('Maria Santos', (SELECT id FROM public.positions WHERE title = 'Vigilante'), (SELECT id FROM public.condominiums WHERE name = 'Condomínio Vila Bela'), 'noite'),
  ('Pedro Oliveira', (SELECT id FROM public.positions WHERE title = 'Zelador'), (SELECT id FROM public.condominiums WHERE name = 'Residencial Green Valley'), 'tarde');