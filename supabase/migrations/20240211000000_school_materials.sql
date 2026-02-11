-- Migration: Create school_materials table for institutional resource sharing
-- Run this in the Supabase SQL Editor
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'school_materials'
) THEN CREATE TABLE public.school_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT,
        category TEXT CHECK (
            category IN ('NOTES', 'EXAM', 'ASSIGNMENT', 'OTHER')
        ),
        target_grade TEXT,
        target_subject TEXT,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- Add indexes for performance
CREATE INDEX idx_materials_school_id ON public.school_materials(school_id);
CREATE INDEX idx_materials_teacher_id ON public.school_materials(teacher_id);
CREATE INDEX idx_materials_grade_subject ON public.school_materials(target_grade, target_subject);
-- Enable RLS
ALTER TABLE public.school_materials ENABLE ROW LEVEL SECURITY;
-- Policies
-- 1. Schools/Teachers can do anything with their own school's materials
CREATE POLICY "School admin control" ON public.school_materials FOR ALL USING (auth.uid() = school_id);
CREATE POLICY "Teachers can view/create in their school" ON public.school_materials FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND school_id = school_materials.school_id
    )
);
-- 2. Students can view materials for their school and grade
CREATE POLICY "Students can view school materials" ON public.school_materials FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND school_id = school_materials.school_id
                AND (
                    target_grade IS NULL
                    OR grade = target_grade
                )
        )
    );
END IF;
END $$;