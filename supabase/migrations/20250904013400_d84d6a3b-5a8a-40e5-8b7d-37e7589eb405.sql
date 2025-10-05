-- Update the handle_new_user function to include company_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Get company_id from user metadata if provided
  DECLARE
    user_company_id uuid;
  BEGIN
    -- Try to get company_id from user metadata
    IF NEW.raw_user_meta_data ? 'company_id' THEN
      user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    ELSE
      user_company_id := NULL;
    END IF;
    
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      last_name, 
      name, 
      email, 
      role,
      approved,
      company_id
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
      END,
      user_company_id
    );
    RETURN NEW;
  END;
END;
$function$;