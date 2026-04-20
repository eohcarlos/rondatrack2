ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS picked_up_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_schedules_picked_up_at
ON public.schedules (company_id, date, picked_up_at);