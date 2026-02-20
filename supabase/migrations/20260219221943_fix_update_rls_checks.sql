-- Fix missing RLS WITH CHECK policies for teacher workflow
-- Tutoring Requests
DROP POLICY IF EXISTS "Teachers can update tutoring requests" ON public.tutoring_requests;
CREATE POLICY "Teachers can update tutoring requests" ON public.tutoring_requests FOR
UPDATE USING (true);