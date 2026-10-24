-- 20261024231000_exam_paper_digitization_engine.sql
-- Table for managing raw scanned paper upload batches and their digitization lifecycle

CREATE TABLE IF NOT EXISTS public.exam_digitization_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    raw_file_url TEXT NOT NULL,
    raw_file_path TEXT,
    raw_marking_scheme_url TEXT,
    status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'EXTRACTING', 'READY_FOR_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED')),
    total_questions INTEGER DEFAULT 0,
    total_marks INTEGER DEFAULT 0,
    target_bundle_code TEXT,
    published_exam_id BIGINT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for individual digitized questions with tri-hybrid visual engine and marking scheme
CREATE TABLE IF NOT EXISTS public.digitized_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.exam_digitization_batches(id) ON DELETE CASCADE,
    question_number TEXT NOT NULL,
    question_text TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    topic TEXT,
    competency TEXT,
    has_diagram BOOLEAN DEFAULT false,
    diagram_type TEXT DEFAULT 'NONE' CHECK (diagram_type IN ('SVG', 'IMAGE', 'ORIGINAL_CROP', 'NONE')),
    diagram_source_url TEXT,
    diagram_svg TEXT,
    diagram_image_url TEXT,
    diagram_prompt TEXT,
    diagram_labels JSONB DEFAULT '[]'::jsonb,
    marking_scheme TEXT,
    marking_scheme_steps JSONB DEFAULT '[]'::jsonb,
    admin_verified BOOLEAN DEFAULT false,
    admin_notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_digitized_questions_batch ON public.digitized_questions(batch_id, order_index);
CREATE INDEX IF NOT EXISTS idx_digitization_batches_status ON public.exam_digitization_batches(status);

-- RLS Policies
ALTER TABLE public.exam_digitization_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digitized_questions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins full access (and service role for edge functions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'exam_digitization_batches' AND policyname = 'Admins manage digitization batches'
    ) THEN
        CREATE POLICY "Admins manage digitization batches" 
        ON public.exam_digitization_batches 
        FOR ALL 
        USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'digitized_questions' AND policyname = 'Admins manage digitized questions'
    ) THEN
        CREATE POLICY "Admins manage digitized questions" 
        ON public.digitized_questions 
        FOR ALL 
        USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    END IF;
END $$;
