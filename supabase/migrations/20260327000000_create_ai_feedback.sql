-- Migration: AI Feedback Engine
-- Purpose: Stores user corrections/flags on AI-generated content to build
-- a high-quality, KNEC-aligned training dataset over time.

CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_role TEXT CHECK (user_role IN ('LEARNER', 'TEACHER')),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('INCORRECT', 'UNCLEAR', 'GOOD', 'CORRECTION')),
  original_prompt TEXT,        -- What the user asked / document title
  ai_response TEXT NOT NULL,  -- Exactly what the AI generated
  correction TEXT,            -- User's correction (NULL for GOOD/INCORRECT/UNCLEAR)
  subject TEXT,
  grade TEXT,
  source TEXT CHECK (source IN ('EXPLANATION', 'MARKING', 'QUIZ', 'DARASA', 'STUDY')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including guests) can submit feedback
CREATE POLICY "users_can_insert_feedback"
  ON public.ai_feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can read all feedback (for training data export)
CREATE POLICY "admins_can_read_all_feedback"
  ON public.ai_feedback
  FOR SELECT
  USING (true); -- Lock down to admin role when admin auth is implemented

-- Index for fast querying by source/subject for training data export
CREATE INDEX IF NOT EXISTS idx_ai_feedback_source ON public.ai_feedback (source);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_subject ON public.ai_feedback (subject);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_feedback (feedback_type);

COMMENT ON TABLE public.ai_feedback IS 'Crowdsourced AI corrections from teachers and learners. This is the foundation of the KNEC-aligned fine-tuning dataset.';
