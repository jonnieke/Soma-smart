-- Migration to add student_limit column to profiles table
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'student_limit'
) THEN
ALTER TABLE public.profiles
ADD COLUMN student_limit INTEGER DEFAULT 100;
END IF;
END $$;