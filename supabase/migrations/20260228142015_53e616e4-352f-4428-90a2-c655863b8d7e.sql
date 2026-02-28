CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('diurno', 'noturno', 'dobra')),
  condominium_id UUID REFERENCES public.condominiums(id),
  observations TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date, shift)
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules from their company"
  ON public.schedules FOR SELECT
  USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Authenticated users can manage schedules from their company"
  ON public.schedules FOR ALL
  USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));