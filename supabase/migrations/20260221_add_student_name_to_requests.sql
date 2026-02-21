-- Add student_name column to tutoring_requests so teachers can see who is requesting help
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS student_name TEXT;
-- Update RPC to auto-populate student_name from profiles on insert
CREATE OR REPLACE FUNCTION public.create_tutoring_request_secure(
        p_student_id UUID,
        p_topic TEXT,
        p_description TEXT,
        p_price DECIMAL,
        p_grade TEXT,
        p_subject TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_request_id UUID;
v_student_name TEXT;
BEGIN -- 1. Validate Student ID exists and get their name
SELECT full_name INTO v_student_name
FROM public.profiles
WHERE id = p_student_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Invalid Student ID';
END IF;
-- 2. Insert the Request with student name
INSERT INTO public.tutoring_requests (
        student_id,
        student_name,
        topic,
        description,
        price,
        grade,
        subject,
        status,
        created_at
    )
VALUES (
        p_student_id,
        v_student_name,
        p_topic,
        p_description,
        p_price,
        p_grade,
        p_subject,
        'PENDING',
        now()
    )
RETURNING id INTO v_request_id;
-- 3. Return Success
RETURN jsonb_build_object('success', true, 'id', v_request_id);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
-- Backfill existing requests with student names
UPDATE public.tutoring_requests tr
SET student_name = p.full_name
FROM public.profiles p
WHERE tr.student_id = p.id
    AND tr.student_name IS NULL;