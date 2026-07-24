-- ============================================================
-- Phase 5: Soma Assessment Intelligence — Supabase Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Assessment Assignments Table
CREATE TABLE IF NOT EXISTS assessment_assignments (
  id                      TEXT PRIMARY KEY,
  assessment_title        TEXT NOT NULL,
  paper_id                TEXT NOT NULL,
  paper_version_id        TEXT,
  school_id               TEXT,
  teacher_id              TEXT NOT NULL,
  assigned_teacher_name   TEXT NOT NULL,
  moderating_teacher_id   TEXT,
  moderating_teacher_name TEXT,
  class_ids               TEXT[] NOT NULL DEFAULT '{}',
  stream_names            TEXT[],
  learner_ids             TEXT[],
  subject                 TEXT NOT NULL,
  grade                   TEXT NOT NULL,
  term                    TEXT NOT NULL,
  academic_year           INTEGER NOT NULL,
  delivery_mode           TEXT NOT NULL CHECK (delivery_mode IN ('online', 'paper', 'hybrid')),
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'open', 'closed', 'marking', 'moderation', 'results_ready', 'released', 'archived')),
  opens_at                TIMESTAMPTZ,
  closes_at               TIMESTAMPTZ,
  duration_minutes        INTEGER DEFAULT 60,
  attempts_allowed        INTEGER DEFAULT 1,
  access_code             TEXT,
  result_release_policy   TEXT NOT NULL DEFAULT 'AFTER_MARKING',
  feedback_release_policy TEXT NOT NULL DEFAULT 'SCORES_AND_FEEDBACK',
  grading_scale_id        TEXT,
  pass_mark_percentage    INTEGER DEFAULT 50,
  instructions            TEXT[],
  accommodations          TEXT,
  total_marks             INTEGER NOT NULL,
  question_count          INTEGER NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON assessment_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assessment_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assessment_assignments(status);

-- 2. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id                TEXT PRIMARY KEY,
  assignment_id     TEXT NOT NULL REFERENCES assessment_assignments(id) ON DELETE CASCADE,
  assessment_id     TEXT NOT NULL,
  paper_id          TEXT NOT NULL,
  learner_id        TEXT NOT NULL,
  learner_name      TEXT NOT NULL,
  admission_no      TEXT,
  attempt_number    INTEGER NOT NULL DEFAULT 1,
  delivery_mode     TEXT NOT NULL CHECK (delivery_mode IN ('online', 'paper', 'hybrid')),
  status            TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'awaiting_marking', 'partially_marked', 'marked', 'moderated', 'released', 'voided')),
  started_at        TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ,
  duration_seconds  INTEGER,
  objective_score   NUMERIC(6,2),
  subjective_score  NUMERIC(6,2),
  total_score       NUMERIC(6,2),
  percentage        NUMERIC(5,2),
  grade             TEXT,
  teacher_feedback  TEXT,
  is_late           BOOLEAN DEFAULT FALSE,
  tab_switch_count  INTEGER DEFAULT 0,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_assignment_id ON assessment_attempts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_learner_id ON assessment_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON assessment_attempts(status);

-- 3. Assessment Responses Table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id                  TEXT PRIMARY KEY,
  attempt_id          TEXT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  assessment_id       TEXT NOT NULL,
  assignment_id       TEXT NOT NULL,
  learner_id          TEXT NOT NULL,
  question_id         TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  response_type       TEXT NOT NULL,
  response_value      JSONB,
  uploaded_file_urls  TEXT[],
  is_flagged          BOOLEAN DEFAULT FALSE,
  auto_save_version   INTEGER DEFAULT 1,
  auto_marked         BOOLEAN DEFAULT FALSE,
  awarded_marks       NUMERIC(5,2),
  max_marks           NUMERIC(5,2) NOT NULL,
  is_correct          BOOLEAN,
  ai_suggested_score  NUMERIC(5,2),
  ai_confidence       NUMERIC(3,2),
  ai_justification    TEXT,
  teacher_score       NUMERIC(5,2),
  teacher_comment     TEXT,
  marking_status      TEXT DEFAULT 'NOT_MARKED' CHECK (marking_status IN ('NOT_MARKED', 'AUTO_MARKED', 'AI_SUGGESTED', 'TEACHER_REVIEWED', 'MODERATED', 'FINAL')),
  answered_at         TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_attempt_id ON assessment_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON assessment_responses(question_id);

-- 4. Learner Mastery Table
CREATE TABLE IF NOT EXISTS learner_mastery (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  learner_id            TEXT NOT NULL,
  subject               TEXT NOT NULL,
  topic                 TEXT NOT NULL,
  curriculum_outcome_id TEXT,
  mastery_score         INTEGER NOT NULL CHECK (mastery_score BETWEEN 0 AND 100),
  confidence            NUMERIC(3,2) DEFAULT 0.50,
  evidence_count        INTEGER DEFAULT 1,
  last_assessed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trend                 TEXT DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining', 'insufficient_data')),
  recommended_action    TEXT,
  UNIQUE(learner_id, subject, topic)
);

CREATE INDEX IF NOT EXISTS idx_mastery_learner_subject ON learner_mastery(learner_id, subject);

-- 5. Assessment Moderations Table
CREATE TABLE IF NOT EXISTS assessment_moderations (
  id              TEXT PRIMARY KEY,
  attempt_id      TEXT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  assignment_id   TEXT NOT NULL,
  moderator_id    TEXT NOT NULL,
  original_score  NUMERIC(6,2) NOT NULL,
  moderated_score NUMERIC(6,2) NOT NULL,
  variance        NUMERIC(6,2) NOT NULL,
  reason          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_moderations ENABLE ROW LEVEL SECURITY;

-- Learner policies
CREATE POLICY "learners_view_own_attempts" ON assessment_attempts FOR SELECT USING (auth.uid()::text = learner_id);
CREATE POLICY "learners_view_own_mastery" ON learner_mastery FOR SELECT USING (auth.uid()::text = learner_id);

-- Teacher policies
CREATE POLICY "teachers_manage_own_assignments" ON assessment_assignments FOR ALL USING (auth.uid()::text = teacher_id OR auth.uid()::text IN (SELECT user_id FROM school_members WHERE school_id = assessment_assignments.school_id));
CREATE POLICY "teachers_manage_assigned_attempts" ON assessment_attempts FOR ALL USING (TRUE);
