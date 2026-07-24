-- ============================================================
-- Phase 8: Soma School Operating System and Institutional Scale Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id                TEXT PRIMARY KEY,
  type              TEXT NOT NULL CHECK (type IN ('individual', 'school', 'institution', 'school_network', 'education_partner', 'publisher')),
  name              TEXT NOT NULL,
  code              TEXT UNIQUE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'archived')),
  primary_school_id TEXT,
  parent_tenant_id  TEXT REFERENCES tenants(id),
  subscription_id   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'closing', 'completed', 'archived')),
  terms        JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_years_tenant ON academic_years(tenant_id);

-- 3. Academic Calendar Events Table
CREATE TABLE IF NOT EXISTS academic_calendar_events (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Academic Classes Table
CREATE TABLE IF NOT EXISTS academic_classes (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campus_id        TEXT,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  grade            TEXT NOT NULL,
  name             TEXT NOT NULL,
  stream           TEXT,
  class_teacher_id TEXT,
  learner_count    INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_classes_tenant ON academic_classes(tenant_id);

-- 5. Learner Guardian Links Table
CREATE TABLE IF NOT EXISTS learner_guardian_links (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  learner_id       TEXT NOT NULL,
  learner_name     TEXT NOT NULL,
  guardian_user_id TEXT NOT NULL,
  guardian_name    TEXT NOT NULL,
  guardian_email   TEXT NOT NULL,
  relationship     TEXT NOT NULL DEFAULT 'parent',
  permissions      JSONB NOT NULL DEFAULT '{"viewResults": true, "receiveReports": true, "receiveAnnouncements": true}',
  is_primary       BOOLEAN DEFAULT TRUE,
  status           TEXT NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. School Invoices Table
CREATE TABLE IF NOT EXISTS school_invoices (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount_kes     NUMERIC(10,2) NOT NULL,
  billing_period TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('DRAFT', 'UNPAID', 'PAID', 'OVERDUE')),
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date       TIMESTAMPTZ NOT NULL,
  paid_at        TIMESTAMPTZ
);

-- 7. School Support Requests Table
CREATE TABLE IF NOT EXISTS school_support_requests (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requester_id   TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  category       TEXT NOT NULL,
  subject        TEXT NOT NULL,
  description    TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_view_own_data" ON tenants FOR SELECT USING (id IN (SELECT tenant_id FROM school_members WHERE user_id = auth.uid()::text));
