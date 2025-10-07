-- Allow users to update their own reports
CREATE POLICY "Users can update their own reports"
ON ai_reports
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON ai_reports
FOR DELETE
USING (created_by = auth.uid());