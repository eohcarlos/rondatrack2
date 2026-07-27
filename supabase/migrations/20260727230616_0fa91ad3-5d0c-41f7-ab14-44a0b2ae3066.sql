CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_or_service boolean;
  is_own_profile boolean;
  is_first_company_link boolean;
BEGIN
  is_admin_or_service := current_setting('request.jwt.claim.role', true) = 'service_role'
    OR public.has_role(auth.uid(), 'admin'::app_role);

  IF is_admin_or_service THEN
    RETURN NEW;
  END IF;

  is_own_profile := auth.uid() = OLD.user_id AND NEW.user_id = OLD.user_id;
  is_first_company_link := is_own_profile
    AND OLD.company_id IS NULL
    AND NEW.company_id IS NOT NULL;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not allowed to change role';
  END IF;

  IF NEW.approved IS DISTINCT FROM OLD.approved THEN
    RAISE EXCEPTION 'Not allowed to change approval status';
  END IF;

  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
    RAISE EXCEPTION 'Not allowed to change approved_by';
  END IF;

  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Not allowed to change approved_at';
  END IF;

  IF NEW.company_id IS DISTINCT FROM OLD.company_id AND NOT is_first_company_link THEN
    RAISE EXCEPTION 'Not allowed to change company_id';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;

  RETURN NEW;
END;
$function$;