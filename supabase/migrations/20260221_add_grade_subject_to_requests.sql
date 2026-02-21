-- Ensure grade and subject columns exist in tutoring_requests
-- These are used to show the learner's class and subject on teacher's request cards
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS subject TEXT;