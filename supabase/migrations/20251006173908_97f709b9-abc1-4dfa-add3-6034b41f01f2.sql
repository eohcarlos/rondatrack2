-- Create table for AI reports history
CREATE TABLE public.ai_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  created_by UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('ronda', 'portaria')),
  reporter_name TEXT NOT NULL,
  reporter_role TEXT NOT NULL,
  condominium_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generated_report TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- Policy for viewing reports from same company
CREATE POLICY "Users can view reports from their company"
ON public.ai_reports
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Policy for inserting reports
CREATE POLICY "Authenticated users can insert reports from their company"
ON public.ai_reports
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Create index for better performance
CREATE INDEX idx_ai_reports_company_id ON public.ai_reports(company_id);
CREATE INDEX idx_ai_reports_created_at ON public.ai_reports(created_at DESC);