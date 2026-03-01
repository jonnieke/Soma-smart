-- Supabase Migration: Super Teacher Phase 3 (The Evolutionary Educator)
-- Create tables for teaching analytics, AI-generated strategies, and prompt refinements.
-- 1. Aggregated teaching effectiveness (computed periodically)
CREATE TABLE IF NOT EXISTS teaching_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    avg_mastery NUMERIC,
    student_count INTEGER,
    avg_attempts_to_mastery NUMERIC,
    most_effective_style TEXT,
    -- 'Simple' | 'Exam'
    avg_score_after_simple NUMERIC,
    avg_score_after_exam NUMERIC,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. AI-generated strategy refinements
CREATE TABLE IF NOT EXISTS teaching_strategies (
    id TEXT PRIMARY KEY,
    -- Use generated ID from client side as PK
    insight TEXT NOT NULL,
    root_cause TEXT,
    strategy TEXT NOT NULL,
    -- The actual prompt instruction
    expected_impact TEXT,
    target_grade TEXT,
    target_topic TEXT,
    target_subject TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    -- 'HIGH' | 'MEDIUM' | 'LOW'
    status TEXT DEFAULT 'PENDING',
    -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE'
    effectiveness_score NUMERIC,
    -- Measured after deployment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id)
);
-- 3. Prompt refinement history (audit trail)
CREATE TABLE IF NOT EXISTS prompt_refinements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    strategy_id TEXT REFERENCES teaching_strategies(id) ON DELETE CASCADE,
    original_prompt TEXT,
    refined_prompt TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    rollback_at TIMESTAMPTZ -- If rolled back
);
-- RLS Policies
-- Enable RLS
ALTER TABLE teaching_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_refinements ENABLE ROW LEVEL SECURITY;
-- teaching_analytics: Admins can read/write. Authenticated users can only read (for UI dashboard purposes, if needed).
CREATE POLICY "Public read access for authenticated users to analytics" ON teaching_analytics FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Admin write access for analytics" ON teaching_analytics FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@soma.app') WITH CHECK (auth.jwt()->>'email' = 'admin@soma.app');
-- teaching_strategies:
-- Authenticated users (students) need to read ACTIVE strategies to apply them in prompts.
-- Admins can read, update, and delete all strategies.
CREATE POLICY "Public read access for active strategies" ON teaching_strategies FOR
SELECT TO authenticated USING (true);
-- Allow reading all to sync pending vs active in client side.
CREATE POLICY "Admin full access for strategies" ON teaching_strategies FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@soma.app') WITH CHECK (auth.jwt()->>'email' = 'admin@soma.app');
-- Allow inserting strategies (since the client Admin Agent generates them)
CREATE POLICY "Authenticated users can insert strategies" ON teaching_strategies FOR
INSERT TO authenticated WITH CHECK (true);
-- Allow admins to update strategies (approve/reject)
CREATE POLICY "Authenticated users can update strategies" ON teaching_strategies FOR
UPDATE TO authenticated USING (true);
-- prompt_refinements: Admins only
CREATE POLICY "Admin full access for prompt_refinements" ON prompt_refinements FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@soma.app') WITH CHECK (auth.jwt()->>'email' = 'admin@soma.app');