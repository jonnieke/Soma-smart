-- Fix classroom RLS recursion.
--
-- The original policies made public.classes SELECT depend on public.class_members,
-- while public.class_members policies depended back on public.classes. PostgREST
-- surfaces that policy recursion as 500s on simple class lookups.

CREATE OR REPLACE FUNCTION public.is_class_teacher(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = target_class_id
          AND c.teacher_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.class_members cm
        WHERE cm.class_id = target_class_id
          AND cm.student_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_class_teacher(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_class_with_student_code(
    target_class_id UUID,
    target_student_code TEXT
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resolved_student_id UUID;
BEGIN
    SELECT p.id
    INTO resolved_student_id
    FROM public.profiles p
    WHERE upper(p.student_id) = upper(trim(target_student_code))
      AND p.role IN ('LEARNER', 'REVISION')
    LIMIT 1;

    IF resolved_student_id IS NULL THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.class_members (class_id, student_id)
    VALUES (target_class_id, resolved_student_id)
    ON CONFLICT (class_id, student_id) DO NOTHING;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_class_with_student_code(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.join_class_with_student_code(UUID, TEXT) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_class_members_class_id
    ON public.class_members (class_id);

CREATE INDEX IF NOT EXISTS idx_class_members_student_id
    ON public.class_members (student_id);

CREATE INDEX IF NOT EXISTS idx_class_posts_class_id_created_at
    ON public.class_posts (class_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gradebook_entries_class_id_created_at
    ON public.gradebook_entries (class_id, created_at DESC);

-- Replace recursive classroom policies with non-recursive helper-based policies.
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view classes they are members of" ON public.classes;

CREATE POLICY "Teachers and members can view classes"
    ON public.classes FOR SELECT
    USING (
        auth.uid() = teacher_id
        OR public.is_class_member(id)
    );

CREATE POLICY "Teachers can insert their own classes"
    ON public.classes FOR INSERT
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes"
    ON public.classes FOR UPDATE
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classes"
    ON public.classes FOR DELETE
    USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage members of their classes" ON public.class_members;
DROP POLICY IF EXISTS "Students can view their own memberships" ON public.class_members;

CREATE POLICY "Teachers and students can view memberships"
    ON public.class_members FOR SELECT
    USING (
        student_id = auth.uid()
        OR public.is_class_teacher(class_id)
    );

CREATE POLICY "Teachers can add class members"
    ON public.class_members FOR INSERT
    WITH CHECK (
        public.is_class_teacher(class_id)
        OR student_id = auth.uid()
    );

CREATE POLICY "Teachers can update class members"
    ON public.class_members FOR UPDATE
    USING (public.is_class_teacher(class_id))
    WITH CHECK (public.is_class_teacher(class_id));

CREATE POLICY "Teachers and students can remove memberships"
    ON public.class_members FOR DELETE
    USING (
        student_id = auth.uid()
        OR public.is_class_teacher(class_id)
    );

DROP POLICY IF EXISTS "Teachers can manage posts in their classes" ON public.class_posts;
DROP POLICY IF EXISTS "Students can view posts in their classes" ON public.class_posts;

CREATE POLICY "Teachers and members can view class posts"
    ON public.class_posts FOR SELECT
    USING (
        public.is_class_teacher(class_id)
        OR public.is_class_member(class_id)
    );

CREATE POLICY "Teachers can insert class posts"
    ON public.class_posts FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND public.is_class_teacher(class_id)
    );

CREATE POLICY "Teachers can update class posts"
    ON public.class_posts FOR UPDATE
    USING (
        author_id = auth.uid()
        AND public.is_class_teacher(class_id)
    )
    WITH CHECK (
        author_id = auth.uid()
        AND public.is_class_teacher(class_id)
    );

CREATE POLICY "Teachers can delete class posts"
    ON public.class_posts FOR DELETE
    USING (
        author_id = auth.uid()
        AND public.is_class_teacher(class_id)
    );

DROP POLICY IF EXISTS "Teachers can manage grades in their classes" ON public.gradebook_entries;
DROP POLICY IF EXISTS "Students can view their own grades" ON public.gradebook_entries;

CREATE POLICY "Teachers and students can view gradebook entries"
    ON public.gradebook_entries FOR SELECT
    USING (
        student_id = auth.uid()
        OR public.is_class_teacher(class_id)
    );

CREATE POLICY "Teachers can insert gradebook entries"
    ON public.gradebook_entries FOR INSERT
    WITH CHECK (public.is_class_teacher(class_id));

CREATE POLICY "Teachers can update gradebook entries"
    ON public.gradebook_entries FOR UPDATE
    USING (public.is_class_teacher(class_id))
    WITH CHECK (public.is_class_teacher(class_id));

CREATE POLICY "Teachers can delete gradebook entries"
    ON public.gradebook_entries FOR DELETE
    USING (public.is_class_teacher(class_id));
