-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create class_members table (students enrolled in a class)
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, student_id)
);

-- Create class_posts table (Announcements and Assignments for the Stream)
CREATE TABLE IF NOT EXISTS public.class_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_type TEXT NOT NULL CHECK (post_type IN ('ANNOUNCEMENT', 'ASSIGNMENT')),
    content TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create gradebook_entries table (Scores for students in a class)
CREATE TABLE IF NOT EXISTS public.gradebook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.class_posts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    max_score NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook_entries ENABLE ROW LEVEL SECURITY;

-- Policies for classes
CREATE POLICY "Teachers can view their own classes"
    ON public.classes FOR SELECT
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own classes"
    ON public.classes FOR INSERT
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes"
    ON public.classes FOR UPDATE
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classes"
    ON public.classes FOR DELETE
    USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they are members of"
    ON public.classes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.class_members
        WHERE class_members.class_id = classes.id
        AND class_members.student_id = auth.uid()
    ));

-- Policies for class_members
CREATE POLICY "Teachers can manage members of their classes"
    ON public.class_members FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_members.class_id
        AND classes.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can view their own memberships"
    ON public.class_members FOR SELECT
    USING (auth.uid() = student_id);

-- Policies for class_posts
CREATE POLICY "Teachers can manage posts in their classes"
    ON public.class_posts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_posts.class_id
        AND classes.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can view posts in their classes"
    ON public.class_posts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.class_members
        WHERE class_members.class_id = class_posts.class_id
        AND class_members.student_id = auth.uid()
    ));

-- Policies for gradebook_entries
CREATE POLICY "Teachers can manage grades in their classes"
    ON public.gradebook_entries FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = gradebook_entries.class_id
        AND classes.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can view their own grades"
    ON public.gradebook_entries FOR SELECT
    USING (auth.uid() = student_id);
