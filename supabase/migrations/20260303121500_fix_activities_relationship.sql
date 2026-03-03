-- Robust migration to fix activities table relationship
-- Handles partial failures and orphaned records
DO $$ BEGIN -- 1. Ensure student_uuid temporary column exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activities'
        AND column_name = 'student_uuid'
) THEN
ALTER TABLE public.activities
ADD COLUMN student_uuid UUID;
END IF;
-- 2. Attempt mapping if student_id is still TEXT
-- If student_id is already renamed or UUID, this might skip or be handled.
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activities'
        AND column_name = 'student_id'
        AND data_type = 'text'
) THEN -- Map SOMA-####
UPDATE public.activities a
SET student_uuid = p.id
FROM public.profiles p
WHERE a.student_id = p.student_id
    AND a.student_uuid IS NULL;
-- Map existing UUID strings
UPDATE public.activities
SET student_uuid = student_id::uuid
WHERE student_uuid IS NULL
    AND student_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
-- Safe Swap
ALTER TABLE public.activities DROP COLUMN student_id CASCADE;
ALTER TABLE public.activities
    RENAME COLUMN student_uuid TO student_id;
END IF;
-- 3. Cleanup: Remove orphaned activities that have no profile match
-- This fixes the "contains null values" error
DELETE FROM public.activities
WHERE student_id IS NULL;
-- 4. Finalize Constraints
ALTER TABLE public.activities
ALTER COLUMN student_id
SET NOT NULL;
-- Add FK if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'activities_student_id_fkey'
) THEN
ALTER TABLE public.activities
ADD CONSTRAINT activities_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END IF;
END $$;
-- 5. Update RLS (Outside DO block for clarity)
DROP POLICY IF EXISTS "Admins can view all activities" ON public.activities;
CREATE POLICY "Admins can view all activities" ON public.activities FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'ADMIN'
        )
    );
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.activities;
CREATE POLICY "Users can insert their own activity" ON public.activities FOR
INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Enable read access for all users" ON public.activities;
CREATE POLICY "Enable read access for all users" ON public.activities FOR
SELECT USING (true);