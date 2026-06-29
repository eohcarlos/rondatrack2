
ALTER TABLE public.absences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominiums      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worked_leaves     ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing receipts policies, then recreate scoped versions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%receipt%'
        OR policyname IN (
          'Public can read receipts','Anyone can read receipts','Receipts are publicly accessible'
        )
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Receipts: owner can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Receipts: owner can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Receipts: owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Receipts: owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Restrict SECURITY DEFINER helper to internal usage only
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
