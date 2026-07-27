CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION public.get_current_user_company_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_user_company_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_company_id() TO service_role;

DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

CREATE POLICY "Users can view profiles from their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR company_id = public.get_current_user_company_id()
);

DROP FUNCTION IF EXISTS public.get_user_company_id(uuid);