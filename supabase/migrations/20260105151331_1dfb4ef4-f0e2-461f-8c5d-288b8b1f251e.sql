-- Add start_time and end_time columns to worked_leaves table
ALTER TABLE public.worked_leaves 
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;