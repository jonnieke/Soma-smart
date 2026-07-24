-- ============================================================
-- Phase 9: Soma Growth OS and Ecosystem Migration
-- Run: 2026-07-24
-- ============================================================

-- 1. Growth Profiles Table
CREATE TABLE IF NOT EXISTS growth_profiles (
  id                          TEXT PRIMARY KEY,
  user_id                     TEXT UNIQUE NOT NULL,
  tenant_id                   TEXT REFERENCES tenants(id),
  user_segment                TEXT NOT NULL,
  acquisition_source         TEXT,
  acquisition_campaign_id     TEXT,
  referral_code_used          TEXT,
  referred_by_user_id         TEXT,
  first_touch_at              TIMESTAMPTZ,
  account_created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activation_status           TEXT NOT NULL DEFAULT 'not_started' CHECK (activation_status IN ('not_started', 'in_progress', 'activated', 'stalled')),
  activated_at                TIMESTAMPTZ,
  activation_event            TEXT,
  lifecycle_stage             TEXT NOT NULL DEFAULT 'registered' CHECK (lifecycle_stage IN ('visitor', 'registered', 'activated', 'engaged', 'paying', 'at_risk', 'churned', 'reactivated')),
  last_meaningful_activity_at TIMESTAMPTZ,
  current_plan_id             TEXT,
  trial_ends_at               TIMESTAMPTZ,
  marketing_consent           BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Growth Campaigns Table
CREATE TABLE IF NOT EXISTS growth_campaigns (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  campaign_type     TEXT NOT NULL,
  audience_segments JSONB DEFAULT '[]',
  channel_ids       JSONB DEFAULT '[]',
  landing_page_id   TEXT,
  offer_id          TEXT,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ,
  budget_amount     NUMERIC(12,2),
  currency          TEXT DEFAULT 'KES',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. School Sales Leads Table
CREATE TABLE IF NOT EXISTS school_sales_leads (
  id                           TEXT PRIMARY KEY,
  school_name                  TEXT NOT NULL,
  contact_person               TEXT NOT NULL,
  role                         TEXT NOT NULL,
  phone                        TEXT NOT NULL,
  email                        TEXT NOT NULL,
  county                       TEXT NOT NULL,
  estimated_learners           INTEGER DEFAULT 0,
  estimated_teachers           INTEGER DEFAULT 0,
  stage                        TEXT NOT NULL DEFAULT 'new_lead' CHECK (stage IN ('new_lead', 'contacted', 'qualified', 'demo_scheduled', 'demo_completed', 'trial_started', 'pilot_active', 'proposal_sent', 'negotiation', 'won', 'lost', 'nurture')),
  assigned_sales_owner         TEXT,
  estimated_contract_value_kes NUMERIC(12,2) DEFAULT 0,
  probability                  INTEGER DEFAULT 10,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Referral Records Table
CREATE TABLE IF NOT EXISTS referral_records (
  id               TEXT PRIMARY KEY,
  referral_code    TEXT NOT NULL,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  referral_type    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'approved', 'credited', 'paid', 'reversed', 'rejected')),
  reward_type      TEXT NOT NULL,
  reward_value     NUMERIC(10,2) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at     TIMESTAMPTZ
);

-- 5. Customer Health Scores Table
CREATE TABLE IF NOT EXISTS customer_health_scores (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  school_name   TEXT NOT NULL,
  score         INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  health_band   TEXT NOT NULL CHECK (health_band IN ('healthy', 'monitor', 'at_risk', 'critical')),
  factors       JSONB DEFAULT '[]',
  renewal_date  DATE NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE growth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_growth_profile" ON growth_profiles FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "users_view_own_referrals" ON referral_records FOR SELECT USING (referrer_user_id = auth.uid()::text);
