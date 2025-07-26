-- Add new fields to employees table
ALTER TABLE public.employees 
ADD COLUMN phone TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN company_time_months INTEGER,
ADD COLUMN driver_license TEXT CHECK (driver_license IN ('Nenhuma', 'A', 'B', 'AB'));

-- Add new fields to worked_leaves table  
ALTER TABLE public.worked_leaves
ADD COLUMN amount DECIMAL(10,2),
ADD COLUMN work_shift TEXT CHECK (work_shift IN ('diurno', 'noturno'));

-- Update employees table to set default values for existing records
UPDATE public.employees 
SET phone = '', age = 0, company_time_months = 0, driver_license = 'Nenhuma'
WHERE phone IS NULL;