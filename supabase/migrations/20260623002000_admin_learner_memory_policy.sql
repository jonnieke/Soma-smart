-- Grant admins read-only access to learner memory for analytics dashboards.
ALTER TABLE public.learner_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read learner memory" ON public.learner_memory;

CREATE POLICY "Admins can read learner memory"
ON public.learner_memory
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
  )
);
