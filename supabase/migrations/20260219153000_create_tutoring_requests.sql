-- Drop table to ensure clean schema (fixes potential uuid vs text mismatches)
DROP TABLE IF EXISTS public.tutoring_requests;
-- Create tutoring_requests table
CREATE TABLE public.tutoring_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        topic TEXT NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'PENDING',
        -- 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'
        price DECIMAL(10, 2) DEFAULT 0.00,
        pricing_type VARCHAR(20) DEFAULT 'RATE_ME',
        -- 'FREE', 'FIXED', 'RATE_ME'
        response TEXT,
        -- Text response or URL to media
        response_type VARCHAR(20) DEFAULT 'TEXT',
        -- 'TEXT', 'VOICE', 'VIDEO'
        attachments TEXT [],
        -- Array of URLs for attachments
        rating DECIMAL(2, 1),
        -- 1.0 to 5.0
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE
);
-- Enable RLS
ALTER TABLE public.tutoring_requests ENABLE ROW LEVEL SECURITY;
-- Policies
-- Students can view their own requests
CREATE POLICY "Students can view own requests" ON public.tutoring_requests FOR
SELECT USING (auth.uid() = student_id);
-- Students can insert requests
CREATE POLICY "Students can create requests" ON public.tutoring_requests FOR
INSERT WITH CHECK (auth.uid() = student_id);
-- Teachers can view ALL pending requests (to pick them up) OR requests assigned to them
CREATE POLICY "Teachers can view pending or assigned requests" ON public.tutoring_requests FOR
SELECT USING (
        status = 'PENDING'
        OR teacher_id = auth.uid()
    );
-- Teachers can update requests assigned to them (or claim pending ones)
CREATE POLICY "Teachers can update requests" ON public.tutoring_requests FOR
UPDATE USING (
        teacher_id = auth.uid()
        OR (
            status = 'PENDING'
            AND teacher_id IS NULL
        )
    );