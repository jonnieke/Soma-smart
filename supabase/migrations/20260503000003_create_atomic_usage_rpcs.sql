ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS usage_teacher INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_profile_ai_usage(
    p_profile_id UUID,
    p_usage_kind TEXT,
    p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, usage_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_profile profiles%ROWTYPE;
    current_count INTEGER;
    next_count INTEGER;
BEGIN
    SELECT *
    INTO current_profile
    FROM public.profiles
    WHERE id = p_profile_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0;
        RETURN;
    END IF;

    IF current_profile.usage_date IS DISTINCT FROM CURRENT_DATE THEN
        UPDATE public.profiles
        SET usage_date = CURRENT_DATE,
            usage_learner = 0,
            usage_teacher = 0,
            usage_revision = 0,
            usage_download = 0
        WHERE id = p_profile_id;

        current_profile.usage_learner := 0;
        current_profile.usage_teacher := 0;
        current_profile.usage_revision := 0;
        current_profile.usage_download := 0;
    END IF;

    CASE p_usage_kind
        WHEN 'teacher' THEN current_count := COALESCE(current_profile.usage_teacher, 0);
        WHEN 'learner' THEN current_count := COALESCE(current_profile.usage_learner, 0);
        ELSE
            RAISE EXCEPTION 'Unsupported usage kind: %', p_usage_kind;
    END CASE;

    IF current_count >= p_limit THEN
        RETURN QUERY SELECT false, current_count;
        RETURN;
    END IF;

    next_count := current_count + 1;

    IF p_usage_kind = 'teacher' THEN
        UPDATE public.profiles
        SET usage_teacher = next_count,
            usage_date = CURRENT_DATE
        WHERE id = p_profile_id;
    ELSE
        UPDATE public.profiles
        SET usage_learner = next_count,
            usage_date = CURRENT_DATE
        WHERE id = p_profile_id;
    END IF;

    RETURN QUERY SELECT true, next_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_guest_ai_usage(
    p_identifier TEXT,
    p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, usage_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
    next_count INTEGER;
BEGIN
    INSERT INTO public.ai_usage_counters (identifier, usage_date, usage_count)
    VALUES (p_identifier, CURRENT_DATE, 0)
    ON CONFLICT (identifier, usage_date) DO NOTHING;

    SELECT ai_usage_counters.usage_count
    INTO current_count
    FROM public.ai_usage_counters
    WHERE identifier = p_identifier
        AND usage_date = CURRENT_DATE
    FOR UPDATE;

    current_count := COALESCE(current_count, 0);

    IF current_count >= p_limit THEN
        RETURN QUERY SELECT false, current_count;
        RETURN;
    END IF;

    next_count := current_count + 1;

    UPDATE public.ai_usage_counters
    SET usage_count = next_count,
        updated_at = NOW()
    WHERE identifier = p_identifier
        AND usage_date = CURRENT_DATE;

    RETURN QUERY SELECT true, next_count;
END;
$$;
