-- Atualizar função handle_new_user para incluir campos do formulário de registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    name, 
    email, 
    role,
    approved
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'supervisor')::user_role,
    CASE 
      WHEN NEW.email = 'eohcarlos.itu@gmail.com' THEN true 
      ELSE false 
    END
  );
  RETURN NEW;
END;
$$;