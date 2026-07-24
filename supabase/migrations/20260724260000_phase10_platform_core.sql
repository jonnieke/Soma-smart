-- ============================================================
-- Phase 10: Soma Platform Reliability, Governance & International Expansion Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Platform Services Catalog Table
CREATE TABLE IF NOT EXISTS platform_services (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  description         TEXT,
  owner_team          TEXT NOT NULL,
  criticality         TEXT NOT NULL DEFAULT 'standard' CHECK (criticality IN ('critical', 'high', 'standard', 'low')),
  runtime             TEXT NOT NULL,
  environments        JSONB DEFAULT '[]',
  dependency_ids      JSONB DEFAULT '[]',
  data_classification TEXT NOT NULL DEFAULT 'confidential' CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
  slo_id              TEXT,
  runbook_url         TEXT,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'degraded', 'deprecated')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Platform Incidents Table
CREATE TABLE IF NOT EXISTS platform_incidents (
  id                     TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  severity               TEXT NOT NULL CHECK (severity IN ('sev1', 'sev2', 'sev3', 'sev4')),
  status                 TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'identified', 'mitigating', 'monitoring', 'resolved', 'closed')),
  service_ids            JSONB DEFAULT '[]',
  affected_tenant_ids    JSONB DEFAULT '[]',
  started_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at            TIMESTAMPTZ,
  commander_id           TEXT,
  customer_impact        TEXT NOT NULL,
  internal_summary       TEXT,
  public_summary         TEXT,
  root_cause             TEXT,
  mitigation             TEXT,
  follow_up_action_ids   JSONB DEFAULT '[]',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AI Model Registry Table
CREATE TABLE IF NOT EXISTS ai_model_registry (
  id                         TEXT PRIMARY KEY,
  provider                   TEXT NOT NULL,
  model_name                 TEXT NOT NULL,
  model_version              TEXT,
  capabilities               JSONB DEFAULT '[]',
  approved_use_cases         JSONB DEFAULT '[]',
  prohibited_use_cases       JSONB DEFAULT '[]',
  risk_level                 TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_level IN ('low', 'moderate', 'high')),
  input_data_classes         JSONB DEFAULT '[]',
  supports_structured_output BOOLEAN DEFAULT TRUE,
  supports_batch             BOOLEAN DEFAULT TRUE,
  cost_profile_id            TEXT,
  evaluation_status          TEXT NOT NULL DEFAULT 'not_evaluated' CHECK (evaluation_status IN ('not_evaluated', 'testing', 'approved', 'restricted', 'retired')),
  rollout_percentage         INTEGER DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Developer Applications Table
CREATE TABLE IF NOT EXISTS developer_applications (
  id                   TEXT PRIMARY KEY,
  tenant_id            TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  description          TEXT,
  owner_user_id        TEXT NOT NULL,
  environment          TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  status               TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('draft', 'pending_review', 'approved', 'restricted', 'suspended')),
  allowed_scopes       JSONB DEFAULT '[]',
  allowed_origins      JSONB DEFAULT '[]',
  rate_limit_policy_id TEXT NOT NULL DEFAULT 'pol_standard_1000rpm',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. API Keys Table (Hashed Storage)
CREATE TABLE IF NOT EXISTS api_key_credentials (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
  key_prefix     TEXT NOT NULL,
  hashed_secret  TEXT NOT NULL,
  name           TEXT NOT NULL,
  scopes         JSONB DEFAULT '[]',
  expires_at     TIMESTAMPTZ,
  last_used_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Country Configurations Table
CREATE TABLE IF NOT EXISTS country_configurations (
  id                       TEXT PRIMARY KEY,
  country_code             TEXT UNIQUE NOT NULL,
  name                     TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'research' CHECK (status IN ('research', 'curriculum_mapping', 'content_preparation', 'localization', 'partner_validation', 'pilot', 'review', 'active', 'paused')),
  default_language         TEXT NOT NULL DEFAULT 'en',
  supported_languages      JSONB DEFAULT '["en"]',
  default_timezone         TEXT NOT NULL DEFAULT 'UTC',
  currency_code            TEXT NOT NULL DEFAULT 'USD',
  curriculum_framework_ids JSONB DEFAULT '[]',
  payment_provider_ids     JSONB DEFAULT '[]',
  enabled_feature_flags    JSONB DEFAULT '[]',
  data_governance_policy_id TEXT NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE platform_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_country_config" ON country_configurations FOR SELECT USING (true);
CREATE POLICY "developer_apps_tenant_access" ON developer_applications FOR SELECT USING (tenant_id = auth.uid()::text);
