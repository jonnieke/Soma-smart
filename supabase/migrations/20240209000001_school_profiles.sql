-- Migration to add School-specific columns to profiles table
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'teacher_limit'
) THEN
ALTER TABLE public.profiles
ADD COLUMN teacher_limit INTEGER DEFAULT 20;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'subscription_status'
) THEN
ALTER TABLE public.profiles
ADD COLUMN subscription_status TEXT DEFAULT 'TRIAL';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'expiry'
) THEN
ALTER TABLE public.profiles
ADD COLUMN expiry TIMESTAMPTZ;
END IF;
END $$;