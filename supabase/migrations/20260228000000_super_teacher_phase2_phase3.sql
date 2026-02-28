-- Super Teacher Phase 2 & 3: Adaptive Tutoring & Evolutionary Educator
-- Creates tables for mastery tracking, spaced repetition, and teaching strategies
-- ============================================================
-- 1. LEARNER MASTERY: Per-topic mastery data for each student
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learner_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT,
    sub_strand TEXT,
    grade TEXT,
    mastery_level NUMERIC DEFAULT 0 CHECK (
        mastery_level >= 0
        AND mastery_level <= 100
    ),
    times_tested INTEGER DEFAULT 0,
    last_tested TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, topic)
);
ALTER TABLE public.learner_mastery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own mastery" ON public.learner_mastery;
CREATE POLICY "Users can manage their own mastery" ON public.learner_mastery FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_learner_mastery_student ON public.learner_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_learner_mastery_topic ON public.learner_mastery(topic);
CREATE INDEX IF NOT EXISTS idx_learner_mastery_level ON public.learner_mastery(mastery_level);
-- ============================================================
-- 2. SPACED REPETITION: SM-2 schedule data for each student
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spaced_repetition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    next_review_date TIMESTAMPTZ NOT NULL,
    interval_days INTEGER DEFAULT 1,
    ease_factor NUMERIC DEFAULT 2.5,
    last_score NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, topic)
);
ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own SR data" ON public.spaced_repetition;
CREATE POLICY "Users can manage their own SR data" ON public.spaced_repetition FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_sr_student ON public.spaced_repetition(student_id);
CREATE INDEX IF NOT EXISTS idx_sr_next_review ON public.spaced_repetition(next_review_date);
CREATE INDEX IF NOT EXISTS idx_sr_last_score ON public.spaced_repetition(last_score);
-- ============================================================
-- 3. TEACHING STRATEGIES: AI-generated prompt refinements
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teaching_strategies (
    id TEXT PRIMARY KEY,
    insight TEXT NOT NULL,
    root_cause TEXT,
    strategy TEXT NOT NULL,
    expected_impact TEXT,
    target_grade TEXT,
    target_topic TEXT,
    target_subject TEXT,
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    status TEXT DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE')
    ),
    effectiveness_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);
ALTER TABLE public.teaching_strategies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active strategies" ON public.teaching_strategies;
CREATE POLICY "Anyone can read active strategies" ON public.teaching_strategies FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage strategies" ON public.teaching_strategies;
CREATE POLICY "Authenticated users can manage strategies" ON public.teaching_strategies FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_strategies_status ON public.teaching_strategies(status);
CREATE INDEX IF NOT EXISTS idx_strategies_topic ON public.teaching_strategies(target_topic);
CREATE INDEX IF NOT EXISTS idx_strategies_priority ON public.teaching_strategies(priority);
-- ============================================================
-- 4. PROMPT REFINEMENTS: Audit trail for strategy changes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prompt_refinements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id TEXT REFERENCES public.teaching_strategies(id) ON DELETE CASCADE,
    original_prompt TEXT,
    refined_prompt TEXT,
    applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    rolled_back_at TIMESTAMPTZ
);
ALTER TABLE public.prompt_refinements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can access refinements" ON public.prompt_refinements;
CREATE POLICY "Authenticated can access refinements" ON public.prompt_refinements FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_refinements_strategy ON public.prompt_refinements(strategy_id);