-- Harden learner_memory access for market readiness.
-- The original table allowed broad anon/authenticated read and write access.
-- This migration keeps direct access for authenticated owners/teachers and adds
-- PIN-verified RPCs for legacy SOMA-code learner sessions.

ALTER TABLE public.learner_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learner can read own memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Learner can insert own memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Learner can update own memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Anon can insert memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Anon can update memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Anon can read memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Authenticated owners can read learner memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Authenticated owners can insert learner memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Authenticated owners can update learner memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Teachers can read enrolled learner memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Teachers can insert enrolled learner memory" ON public.learner_memory;
DROP POLICY IF EXISTS "Teachers can update enrolled learner memory" ON public.learner_memory;

CREATE POLICY "Authenticated owners can read learner memory"
ON public.learner_memory
FOR SELECT TO authenticated
USING (
  learner_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.student_id = learner_memory.learner_id
  )
);

CREATE POLICY "Authenticated owners can insert learner memory"
ON public.learner_memory
FOR INSERT TO authenticated
WITH CHECK (
  learner_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.student_id = learner_memory.learner_id
  )
);

CREATE POLICY "Authenticated owners can update learner memory"
ON public.learner_memory
FOR UPDATE TO authenticated
USING (
  learner_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.student_id = learner_memory.learner_id
  )
)
WITH CHECK (
  learner_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.student_id = learner_memory.learner_id
  )
);

CREATE POLICY "Teachers can read enrolled learner memory"
ON public.learner_memory
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE c.teacher_id = auth.uid()
      AND (
        cm.student_id::text = learner_memory.learner_id
        OR EXISTS (
          SELECT 1 FROM public.profiles sp
          WHERE sp.id = cm.student_id
            AND sp.student_id = learner_memory.learner_id
        )
      )
  )
);

CREATE POLICY "Teachers can insert enrolled learner memory"
ON public.learner_memory
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE c.teacher_id = auth.uid()
      AND (
        cm.student_id::text = learner_memory.learner_id
        OR EXISTS (
          SELECT 1 FROM public.profiles sp
          WHERE sp.id = cm.student_id
            AND sp.student_id = learner_memory.learner_id
        )
      )
  )
);

CREATE POLICY "Teachers can update enrolled learner memory"
ON public.learner_memory
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE c.teacher_id = auth.uid()
      AND (
        cm.student_id::text = learner_memory.learner_id
        OR EXISTS (
          SELECT 1 FROM public.profiles sp
          WHERE sp.id = cm.student_id
            AND sp.student_id = learner_memory.learner_id
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE c.teacher_id = auth.uid()
      AND (
        cm.student_id::text = learner_memory.learner_id
        OR EXISTS (
          SELECT 1 FROM public.profiles sp
          WHERE sp.id = cm.student_id
            AND sp.student_id = learner_memory.learner_id
        )
      )
  )
);

CREATE OR REPLACE FUNCTION public.get_learner_memory_secure(
  p_learner_id text,
  p_pin text DEFAULT NULL
)
RETURNS SETOF public.learner_memory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_learner_id IS NULL OR length(trim(p_learner_id)) = 0 THEN
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.id::text = p_learner_id OR p.student_id = p_learner_id)
    ) THEN
      RETURN QUERY SELECT * FROM public.learner_memory lm WHERE lm.learner_id = p_learner_id;
      RETURN;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.student_id = p_learner_id
      AND p.recovery_pin IS NOT NULL
      AND p.recovery_pin = COALESCE(p_pin, '')
  ) THEN
    RETURN QUERY SELECT * FROM public.learner_memory lm WHERE lm.learner_id = p_learner_id;
    RETURN;
  END IF;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_learner_memory_secure(
  p_learner_id text,
  p_mastery_graph jsonb DEFAULT '{}'::jsonb,
  p_spaced_repetition jsonb DEFAULT '[]'::jsonb,
  p_weak_topics text[] DEFAULT '{}'::text[],
  p_strong_topics text[] DEFAULT '{}'::text[],
  p_last_topic text DEFAULT NULL,
  p_last_subject text DEFAULT NULL,
  p_total_sessions integer DEFAULT 0,
  p_total_xp integer DEFAULT 0,
  p_streak_days integer DEFAULT 0,
  p_pin text DEFAULT NULL
)
RETURNS public.learner_memory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed boolean := false;
  v_row public.learner_memory;
BEGIN
  IF p_learner_id IS NULL OR length(trim(p_learner_id)) = 0 THEN
    RAISE EXCEPTION 'learner_id is required';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.id::text = p_learner_id OR p.student_id = p_learner_id)
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.student_id = p_learner_id
        AND p.recovery_pin IS NOT NULL
        AND p.recovery_pin = COALESCE(p_pin, '')
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not allowed to update learner memory';
  END IF;

  INSERT INTO public.learner_memory (
    learner_id,
    mastery_graph,
    spaced_repetition,
    weak_topics,
    strong_topics,
    last_topic,
    last_subject,
    total_sessions,
    total_xp,
    streak_days,
    last_synced_at
  ) VALUES (
    p_learner_id,
    COALESCE(p_mastery_graph, '{}'::jsonb),
    COALESCE(p_spaced_repetition, '[]'::jsonb),
    COALESCE(p_weak_topics, '{}'::text[]),
    COALESCE(p_strong_topics, '{}'::text[]),
    p_last_topic,
    p_last_subject,
    COALESCE(p_total_sessions, 0),
    COALESCE(p_total_xp, 0),
    COALESCE(p_streak_days, 0),
    now()
  )
  ON CONFLICT (learner_id) DO UPDATE SET
    mastery_graph = EXCLUDED.mastery_graph,
    spaced_repetition = EXCLUDED.spaced_repetition,
    weak_topics = EXCLUDED.weak_topics,
    strong_topics = EXCLUDED.strong_topics,
    last_topic = EXCLUDED.last_topic,
    last_subject = EXCLUDED.last_subject,
    total_sessions = EXCLUDED.total_sessions,
    total_xp = EXCLUDED.total_xp,
    streak_days = EXCLUDED.streak_days,
    last_synced_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_learner_memory_secure(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_learner_memory_secure(text, jsonb, jsonb, text[], text[], text, text, integer, integer, integer, text) TO anon, authenticated;
