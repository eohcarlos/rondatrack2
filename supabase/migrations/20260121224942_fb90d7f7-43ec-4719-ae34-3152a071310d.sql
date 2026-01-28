-- Add location field to worked_leaves table
ALTER TABLE public.worked_leaves 
ADD COLUMN location text;