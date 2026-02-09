-- Migration to link Teachers and Students to Schools
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'school_id'
) THEN
ALTER TABLE public.profiles
ADD COLUMN school_id UUID REFERENCES public.profiles(id);
-- Create index for faster lookups
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
END IF;
END $$;