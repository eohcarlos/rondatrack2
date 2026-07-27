REVOKE ALL ON FUNCTION public.get_user_company_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_company_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO service_role;