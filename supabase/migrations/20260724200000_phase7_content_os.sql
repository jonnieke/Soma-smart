-- ============================================================
-- Phase 7: Soma Content and Curriculum Operating System Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Curriculum Frameworks Table
CREATE TABLE IF NOT EXISTS curriculum_frameworks (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  country           TEXT NOT NULL DEFAULT 'Kenya',
  authority         TEXT,
  education_system  TEXT NOT NULL,
  version           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'deprecated', 'archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Curriculum Nodes Table
CREATE TABLE IF NOT EXISTS curriculum_nodes (
  id                TEXT PRIMARY KEY,
  framework_id      TEXT NOT NULL REFERENCES curriculum_frameworks(id) ON DELETE CASCADE,
  parent_id         TEXT REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('level', 'grade', 'subject', 'strand', 'sub_strand', 'topic', 'learning_outcome', 'competency', 'value', 'issue')),
  code              TEXT,
  title             TEXT NOT NULL,
  description       TEXT,
  sequence          INTEGER DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active',
  version_id        TEXT NOT NULL DEFAULT 'v1',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curr_nodes_framework ON curriculum_nodes(framework_id);
CREATE INDEX IF NOT EXISTS idx_curr_nodes_parent ON curriculum_nodes(parent_id);

-- 3. Educational Resources Table
CREATE TABLE IF NOT EXISTS educational_resources (
  id                      TEXT PRIMARY KEY,
  owner_id                TEXT NOT NULL,
  owner_type              TEXT NOT NULL CHECK (owner_type IN ('teacher', 'school', 'soma', 'publisher')),
  school_id               TEXT,
  publisher_id            TEXT,
  title                   TEXT NOT NULL,
  description             TEXT,
  resource_type           TEXT NOT NULL,
  curriculum_framework_id TEXT NOT NULL REFERENCES curriculum_frameworks(id),
  curriculum_node_ids     TEXT[] NOT NULL DEFAULT '{}',
  grade                   TEXT NOT NULL,
  subject                 TEXT NOT NULL,
  term                    TEXT,
  language                TEXT NOT NULL DEFAULT 'English',
  estimated_duration_mins INTEGER,
  difficulty              TEXT DEFAULT 'standard',
  content_blocks          JSONB NOT NULL DEFAULT '[]',
  visibility              TEXT NOT NULL DEFAULT 'school' CHECK (visibility IN ('private', 'department', 'school', 'soma', 'licensed', 'marketplace')),
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'published', 'deprecated')),
  rights_id               TEXT NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_resources_owner ON educational_resources(owner_id);
CREATE INDEX IF NOT EXISTS idx_edu_resources_school ON educational_resources(school_id);

-- 4. Content Rights Table
CREATE TABLE IF NOT EXISTS content_rights (
  id                   TEXT PRIMARY KEY,
  owner_type           TEXT NOT NULL,
  owner_id             TEXT NOT NULL,
  licence_type         TEXT NOT NULL DEFAULT 'school_internal',
  permitted_uses       TEXT[] NOT NULL DEFAULT '{}',
  attribution_required BOOLEAN DEFAULT TRUE,
  attribution_text     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Schemes of Work Table
CREATE TABLE IF NOT EXISTS schemes_of_work (
  id           TEXT PRIMARY KEY,
  school_id    TEXT,
  teacher_id   TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  grade        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  term         TEXT NOT NULL,
  year         INTEGER NOT NULL,
  weeks        JSONB NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'draft',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Publisher Profiles Table
CREATE TABLE IF NOT EXISTS publisher_profiles (
  id                          TEXT PRIMARY KEY,
  name                        TEXT NOT NULL,
  contact_email               TEXT NOT NULL,
  country                     TEXT NOT NULL DEFAULT 'Kenya',
  status                      TEXT NOT NULL DEFAULT 'pending_verification',
  submitted_catalogues_count  INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE curriculum_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_active_curriculum" ON curriculum_frameworks FOR SELECT USING (status = 'active');
CREATE POLICY "public_view_curriculum_nodes" ON curriculum_nodes FOR SELECT USING (status = 'active');
CREATE POLICY "teachers_manage_own_resources" ON educational_resources FOR ALL USING (auth.uid()::text = owner_id OR school_id IN (SELECT school_id FROM school_members WHERE user_id = auth.uid()::text));
