CREATE INDEX IF NOT EXISTS activities_student_created_at_idx
ON public.activities (student_id, created_at DESC);

