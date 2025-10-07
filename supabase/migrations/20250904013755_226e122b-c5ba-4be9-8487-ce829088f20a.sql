-- Allow anonymous users to check company codes for authentication
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;

-- Create a policy that allows anyone to view companies (needed for code verification before login)
CREATE POLICY "Anyone can view companies for code verification" 
ON public.companies 
FOR SELECT 
USING (true);