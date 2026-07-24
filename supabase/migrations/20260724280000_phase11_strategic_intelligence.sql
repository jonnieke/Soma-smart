-- ============================================================
-- Phase 11: Soma Strategic Intelligence & Defensibility Moat Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Knowledge Nodes Table
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id                       TEXT PRIMARY KEY,
  type                     TEXT NOT NULL,
  tenant_scope             TEXT REFERENCES tenants(id),
  country_code             TEXT,
  curriculum_framework_id TEXT,
  source_entity_id         TEXT NOT NULL,
  source_version_id        TEXT,
  title                    TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  metadata                 JSONB DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Knowledge Relationships Table
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id                TEXT PRIMARY KEY,
  from_node_id      TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id        TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  confidence        TEXT NOT NULL DEFAULT 'verified' CHECK (confidence IN ('verified', 'reviewed', 'inferred', 'experimental')),
  source_type       TEXT NOT NULL DEFAULT 'curriculum' CHECK (source_type IN ('curriculum', 'teacher', 'school', 'system_rule', 'research', 'ai_suggestion')),
  source_reference  TEXT,
  reviewer_id       TEXT,
  algorithm_version TEXT,
  status            TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('suggested', 'under_review', 'approved', 'rejected', 'deprecated')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Question Evidence Profiles Table
CREATE TABLE IF NOT EXISTS question_evidence_profiles (
  id                         TEXT PRIMARY KEY,
  question_id                TEXT NOT NULL,
  question_version_id        TEXT NOT NULL DEFAULT 'v1.0',
  country_code               TEXT NOT NULL DEFAULT 'KE',
  curriculum_framework_id    TEXT NOT NULL DEFAULT 'kicd_cbc_2024',
  configured_difficulty      NUMERIC(5,4),
  observed_difficulty        NUMERIC(5,4),
  discrimination_estimate    NUMERIC(5,4),
  learner_sample_size        INTEGER DEFAULT 0,
  school_sample_size         INTEGER DEFAULT 0,
  assessment_sample_size     INTEGER DEFAULT 0,
  average_score              NUMERIC(5,4),
  skip_rate                  NUMERIC(5,4),
  average_response_seconds   INTEGER,
  marking_disagreement_rate  NUMERIC(5,4),
  challenge_rate             NUMERIC(5,4),
  evidence_confidence        TEXT NOT NULL DEFAULT 'insufficient' CHECK (evidence_confidence IN ('insufficient', 'low', 'moderate', 'high')),
  quality_status             TEXT NOT NULL DEFAULT 'insufficient_data',
  warnings                   JSONB DEFAULT '[]',
  algorithm_version          TEXT NOT NULL DEFAULT 'v2026.1',
  calculated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Curriculum Misconceptions Table
CREATE TABLE IF NOT EXISTS curriculum_misconceptions (
  id                       TEXT PRIMARY KEY,
  country_code             TEXT NOT NULL DEFAULT 'KE',
  curriculum_framework_id TEXT NOT NULL DEFAULT 'kicd_cbc_2024',
  subject_id               TEXT NOT NULL,
  curriculum_node_ids      JSONB DEFAULT '[]',
  title                    TEXT NOT NULL,
  description              TEXT NOT NULL,
  misconception_type       TEXT NOT NULL,
  diagnostic_question_ids  JSONB DEFAULT '[]',
  remediation_resource_ids JSONB DEFAULT '[]',
  evidence_count           INTEGER DEFAULT 0,
  learner_sample_size      INTEGER DEFAULT 0,
  school_sample_size       INTEGER DEFAULT 0,
  evidence_confidence      TEXT NOT NULL DEFAULT 'insufficient' CHECK (evidence_confidence IN ('insufficient', 'low', 'moderate', 'high')),
  status                   TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'teacher_reviewed', 'specialist_verified', 'deprecated')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Platform Cost Events Ledger Table
CREATE TABLE IF NOT EXISTS platform_cost_events (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT REFERENCES tenants(id),
  user_id               TEXT,
  cost_category         TEXT NOT NULL CHECK (cost_category IN ('ai', 'ocr', 'storage', 'database', 'export', 'notification', 'payment', 'refund', 'royalty', 'commission', 'moderation', 'support', 'onboarding', 'infrastructure')),
  feature               TEXT NOT NULL,
  provider              TEXT,
  quantity              NUMERIC(12,4),
  unit                  TEXT,
  amount                NUMERIC(12,2) NOT NULL,
  currency              TEXT DEFAULT 'KES',
  related_paper_id      TEXT,
  related_assessment_id TEXT,
  related_order_id      TEXT,
  incurred_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_evidence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_cost_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_knowledge_nodes" ON knowledge_nodes FOR SELECT USING (true);
CREATE POLICY "public_read_knowledge_rels" ON knowledge_relationships FOR SELECT USING (true);
