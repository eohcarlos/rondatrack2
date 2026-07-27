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
  AND NOT (approved_by IS DISTINCT FROM (SELECT p.approved_by FROM public.profiles p WHERE p.user_id = auth.uid()))
  AND NOT (approved_at IS DISTINCT FROM (SELECT p.approved_at FROM public.profiles p WHERE p.user_id = auth.uid()))
  AND (
    NOT (company_id IS DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()))
    OR (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()) IS NULL
  )
);