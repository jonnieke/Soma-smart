-- Persist teacher syllabus tracking progress per class and subject.

CREATE TABLE IF NOT EXISTS public.teacher_syllabus_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    active_topic TEXT,
    risk_status TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (teacher_id, class_name, subject)
);

ALTER TABLE public.teacher_syllabus_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage own syllabus progress" ON public.teacher_syllabus_progress;
CREATE POLICY "Teachers can manage own syllabus progress"
    ON public.teacher_syllabus_progress
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

DROP TRIGGER IF EXISTS on_teacher_syllabus_progress_updated ON public.teacher_syllabus_progress;
CREATE TRIGGER on_teacher_syllabus_progress_updated
    BEFORE UPDATE ON public.teacher_syllabus_progress
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
