
-- 1. employee_details: remove public policy, add company-scoped
DROP POLICY IF EXISTS "Anyone can view employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Authenticated users can manage employee details" ON public.employee_details;

CREATE POLICY "Users can view employee details from their company"
ON public.employee_details FOR SELECT TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage employee details from their company"
ON public.employee_details FOR ALL TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
)
WITH CHECK (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

-- 2. Restrict TO authenticated on all public-table policies (excluding deliberately public ones)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('absences','condominiums','employees','positions','profiles',
                        'worked_leaves','employee_details','schedules','expenses','ai_reports','daily_phrases')
      AND 'public' = ANY(roles)
      AND policyname NOT IN ('Anyone can view companies for code verification','Anyone can view daily phrases')
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3. Enable RLS
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worked_leaves ENABLE ROW LEVEL SECURITY;

-- 4. Grants
REVOKE ALL ON public.absences, public.condominiums, public.employees, public.employee_details,
              public.positions, public.profiles, public.worked_leaves FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.absences, public.condominiums, public.employees, public.employee_details,
     public.positions, public.profiles, public.worked_leaves TO authenticated;
GRANT ALL
  ON public.absences, public.condominiums, public.employees, public.employee_details,
     public.positions, public.profiles, public.worked_leaves TO service_role;

-- 5. Profiles: consolidate UPDATE policies + trigger
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only approved users can manage data" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN RAISE EXCEPTION 'Not allowed to change role'; END IF;
  IF NEW.approved IS DISTINCT FROM OLD.approved THEN RAISE EXCEPTION 'Not allowed to change approval status'; END IF;
  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN RAISE EXCEPTION 'Not allowed to change approved_by'; END IF;
  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN RAISE EXCEPTION 'Not allowed to change approved_at'; END IF;
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN RAISE EXCEPTION 'Not allowed to change company_id'; END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Not allowed to change user_id'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 6. handle_new_user: force default role, ignore client-supplied role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_company_id uuid;
BEGIN
  IF NEW.raw_user_meta_data ? 'company_id' THEN
    user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  ELSE
    user_company_id := NULL;
  END IF;

  INSERT INTO public.profiles (
    user_id, first_name, last_name, name, email, role, approved, company_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    'supervisor'::user_role, -- always default; admins must promote via secure path
    CASE WHEN NEW.email = 'eohcarlos.itu@gmail.com' THEN true ELSE false END,
    user_company_id
  );
  RETURN NEW;
END;
$$;

-- 7. Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 8. Receipts storage policies (bucket privacy flip is done via storage_update_bucket tool)
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

CREATE POLICY "Authenticated users can view their own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload their own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 9. Realtime messages: require auth (defense in depth)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='realtime' AND table_name='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated can read realtime messages" ON realtime.messages FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated can send realtime messages" ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;
