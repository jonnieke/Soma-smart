CREATE OR REPLACE FUNCTION public.get_recent_activities(
    p_student_id UUID,
    p_limit INTEGER DEFAULT 200
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    topic TEXT,
    score INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        activities.id,
        activities.type,
        activities.topic,
        activities.score,
        activities.details,
        activities.created_at
    FROM public.activities
    WHERE activities.student_id = p_student_id
    ORDER BY activities.created_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;

