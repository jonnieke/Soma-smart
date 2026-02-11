-- Migration to fix profiles_role_check constraint
-- This script allows the 'SCHOOL' role in the profiles table.
DO $$ BEGIN -- 1. Drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- 2. Add the new constraint with 'SCHOOL' included
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (
        role IN (
            'LEARNER',
            'TEACHER',
            'PARENT',
            'SCHOOL',
            'ADMIN'
        )
    );
END $$;