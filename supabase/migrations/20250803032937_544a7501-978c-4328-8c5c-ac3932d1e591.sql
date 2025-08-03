-- Update profiles to add email from auth.users
UPDATE public.profiles 
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = profiles.user_id
)
WHERE email IS NULL;