-- Consolidated Schema Sync for Profiles Table
-- This script ensures all necessary columns for concurrent sessions and school management exist.
-- Run this in the Supabase SQL Editor (https://app.supabase.com) for your project.
DO $$ BEGIN -- 1. Multi-Device & Session Tracking
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'active_sessions'
) THEN
ALTER TABLE public.profiles
ADD COLUMN active_sessions text [] DEFAULT '{}';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'session_id'
) THEN
ALTER TABLE public.profiles
ADD COLUMN session_id text;
END IF;
-- 2. School Dashboard & Billing
IF NOT EXISTS (
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
        AND column_name = 'student_limit'
) THEN
ALTER TABLE public.profiles
ADD COLUMN student_limit INTEGER DEFAULT 100;
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
-- 3. School Linkage
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'school_id'
) THEN
ALTER TABLE public.profiles
ADD COLUMN school_id UUID REFERENCES public.profiles(id);
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_name = 'profiles'
        AND indexname = 'idx_profiles_school_id'
) THEN CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
END IF;
END IF;
-- 4. Feature Usage Tracking
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'usage_teacher_darasa'
) THEN
ALTER TABLE public.profiles
ADD COLUMN usage_teacher_darasa INTEGER DEFAULT 0;
END IF;
END $$;