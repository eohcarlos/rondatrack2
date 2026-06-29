
-- 1) daily_phrases: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can manage daily phrases" ON public.daily_phrases;
CREATE POLICY "Admins can manage daily phrases"
ON public.daily_phrases
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) profiles: prevent self privilege escalation at policy level (defense-in-depth alongside trigger)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  AND approved = (SELECT p.approved FROM public.profiles p WHERE p.user_id = auth.uid())
  AND approved_by IS NOT DISTINCT FROM (SELECT p.approved_by FROM public.profiles p WHERE p.user_id = auth.uid())
  AND approved_at IS NOT DISTINCT FROM (SELECT p.approved_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 3) worked_leaves: block anonymous JWTs
DROP POLICY IF EXISTS "Users can view worked leaves from their company" ON public.worked_leaves;
DROP POLICY IF EXISTS "Authenticated users can manage worked leaves from their company" ON public.worked_leaves;

CREATE POLICY "Users can view worked leaves from their company"
ON public.worked_leaves
FOR SELECT
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND company_id IN (SELECT profiles.company_id FROM public.profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Authenticated users can manage worked leaves from their company"
ON public.worked_leaves
FOR ALL
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND company_id IN (SELECT profiles.company_id FROM public.profiles WHERE profiles.user_id = auth.uid())
)
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND company_id IN (SELECT profiles.company_id FROM public.profiles WHERE profiles.user_id = auth.uid())
);

-- 4) realtime.messages: scope by company topic prefix and block anonymous
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;

CREATE POLICY "Company-scoped realtime read"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND (
    realtime.topic() LIKE 'company:' || COALESCE((SELECT p.company_id::text FROM public.profiles p WHERE p.user_id = auth.uid()), '__none__') || ':%'
    OR realtime.topic() LIKE 'realtime:public:%'
  )
);

CREATE POLICY "Company-scoped realtime send"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND (
    realtime.topic() LIKE 'company:' || COALESCE((SELECT p.company_id::text FROM public.profiles p WHERE p.user_id = auth.uid()), '__none__') || ':%'
    OR realtime.topic() LIKE 'realtime:public:%'
  )
);

-- 5) avatars bucket: restrict listing while keeping public URL fetches working
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can list only their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
