-- Secure RPC function to create tutoring requests
-- This allows students who are logged in via "Student Code" (but possibly not Supabase Auth)
-- to create requests. It validates the student_id exists before inserting.
CREATE OR REPLACE FUNCTION public.create_tutoring_request_secure(
        p_student_id UUID,
        p_topic TEXT,
        p_description TEXT,
        p_price DECIMAL,
        p_grade TEXT,
        p_subject TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public AS $$
DECLARE v_request_id UUID;
BEGIN -- 1. Validate Student ID exists in profiles
PERFORM 1
FROM public.profiles
WHERE id = p_student_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Invalid Student ID';
END IF;
-- 2. Insert the Request
INSERT INTO public.tutoring_requests (
        student_id,
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
-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.create_tutoring_request_secure TO anon,
    authenticated,
    service_role;