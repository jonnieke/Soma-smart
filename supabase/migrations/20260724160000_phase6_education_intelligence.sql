-- ============================================================
-- Phase 6: Soma Education Intelligence — Supabase Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Learner Progress Signals Table
CREATE TABLE IF NOT EXISTS learner_progress_signals (
  id                      TEXT PRIMARY KEY,
  learner_id              TEXT NOT NULL,
  learner_name            TEXT NOT NULL,
  school_id               TEXT,
  subject                 TEXT NOT NULL,
  topic                   TEXT,
  curriculum_outcome_id   TEXT,
  current_mastery_score   INTEGER NOT NULL CHECK (current_mastery_score BETWEEN 0 AND 100),
  previous_mastery_score  INTEGER,
  growth_score            INTEGER,
  evidence_count          INTEGER DEFAULT 1,
  recent_evidence_count   INTEGER DEFAULT 1,
  evidence_confidence     TEXT NOT NULL CHECK (evidence_confidence IN ('insufficient', 'low', 'moderate', 'high')),
  recent_trend            TEXT NOT NULL CHECK (recent_trend IN ('strong_improvement', 'improving', 'stable', 'declining', 'strong_decline', 'insufficient_data')),
  priority_level          TEXT NOT NULL CHECK (priority_level IN ('monitor', 'practice', 'intervention', 'urgent_review')),
  factors                 JSONB NOT NULL DEFAULT '[]',
  recommended_action_ids  TEXT[] DEFAULT '{}',
  calculated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_signals_learner ON learner_progress_signals(learner_id, subject);
CREATE INDEX IF NOT EXISTS idx_progress_signals_priority ON learner_progress_signals(priority_level);

-- 2. Intervention Groups Table
CREATE TABLE IF NOT EXISTS intervention_groups (
  id                      TEXT PRIMARY KEY,
  school_id               TEXT,
  teacher_id              TEXT NOT NULL,
  teacher_name            TEXT NOT NULL,
  class_id                TEXT,
  subject                 TEXT NOT NULL,
  name                    TEXT NOT NULL,
  description             TEXT,
  learner_ids             TEXT[] NOT NULL DEFAULT '{}',
  curriculum_outcome_ids  TEXT[] DEFAULT '{}',
  reason_codes            TEXT[] DEFAULT '{}',
  evidence_confidence     TEXT NOT NULL DEFAULT 'moderate',
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused', 'cancelled')),
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,
  success_criteria        JSONB DEFAULT '[]',
  outcome                 TEXT DEFAULT 'in_progress',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_teacher ON intervention_groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_intervention_school ON intervention_groups(school_id);

-- 3. Revision Impact Records Table
CREATE TABLE IF NOT EXISTS revision_impact_records (
  id                      TEXT PRIMARY KEY,
  learner_id              TEXT NOT NULL,
  subject                 TEXT NOT NULL,
  topic                   TEXT NOT NULL,
  activity_id             TEXT NOT NULL,
  activity_title          TEXT NOT NULL,
  completed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pre_assessment_score    NUMERIC(5,2) NOT NULL,
  post_assessment_score   NUMERIC(5,2),
  score_gain_percentage   NUMERIC(5,2),
  is_measurably_effective BOOLEAN DEFAULT FALSE,
  evidence_confidence     TEXT NOT NULL DEFAULT 'moderate'
);

-- 4. Question Quality Profiles Table
CREATE TABLE IF NOT EXISTS question_quality_profiles (
  question_id             TEXT PRIMARY KEY,
  question_text           TEXT NOT NULL,
  subject                 TEXT NOT NULL,
  grade                   TEXT NOT NULL,
  attempt_count           INTEGER DEFAULT 0,
  facility_index          NUMERIC(4,3) NOT NULL,
  discrimination_index    NUMERIC(4,3),
  skip_rate_percentage    NUMERIC(5,2) DEFAULT 0.0,
  status                  TEXT NOT NULL DEFAULT 'performing_well',
  evidence_confidence     TEXT NOT NULL DEFAULT 'moderate',
  flagged_reasons         TEXT[] DEFAULT '{}',
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. School Benchmark Snapshots Table
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
  id                              TEXT PRIMARY KEY,
  school_id                       TEXT NOT NULL,
  grade                           TEXT NOT NULL,
  subject                         TEXT NOT NULL,
  term                            TEXT NOT NULL,
  school_mean                     NUMERIC(5,2) NOT NULL,
  peer_median                     NUMERIC(5,2) NOT NULL,
  peer_range_min                  NUMERIC(5,2) NOT NULL,
  peer_range_max                  NUMERIC(5,2) NOT NULL,
  peer_school_count               INTEGER NOT NULL DEFAULT 0,
  cohort_learner_count            INTEGER NOT NULL DEFAULT 0,
  evidence_confidence             TEXT NOT NULL DEFAULT 'moderate',
  is_suppressed_due_to_small_cohort BOOLEAN DEFAULT FALSE,
  calculated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE learner_progress_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_quality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learners_view_own_progress" ON learner_progress_signals FOR SELECT USING (auth.uid()::text = learner_id);
CREATE POLICY "teachers_manage_interventions" ON intervention_groups FOR ALL USING (auth.uid()::text = teacher_id OR auth.uid()::text IN (SELECT user_id FROM school_members WHERE school_id = intervention_groups.school_id));
