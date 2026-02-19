-- Add grade and subject columns to tutoring_requests
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
    ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
-- Optional: Add index for filtering
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_grade ON public.tutoring_requests(grade);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_subject ON public.tutoring_requests(subject);