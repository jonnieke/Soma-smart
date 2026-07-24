-- ============================================================
-- Phase 4B: School Workspace Billing — Supabase Migration
-- Run: 2026-07-24
-- ============================================================

-- School Subscriptions Table
CREATE TABLE IF NOT EXISTS school_subscriptions (
  id                TEXT PRIMARY KEY,
  school_id         TEXT NOT NULL,
  plan_id           TEXT NOT NULL,
  plan_name         TEXT NOT NULL,
  school_tier       TEXT NOT NULL CHECK (school_tier IN ('SCHOOL_BASIC', 'SCHOOL_PRO', 'SCHOOL_ENTERPRISE')),
  teacher_seat_limit INTEGER NOT NULL DEFAULT 5,
  ai_credits        INTEGER NOT NULL DEFAULT 500,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED', 'NONE')),
  pesapal_order_id  TEXT,
  reference         TEXT,
  amount_kes        INTEGER NOT NULL,
  started_at        TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_subscriptions_school_id ON school_subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_status ON school_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_expires_at ON school_subscriptions(expires_at);

-- District Oversight Tables
CREATE TABLE IF NOT EXISTS districts (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  region          TEXT NOT NULL,
  county          TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'Kenya',
  school_ids      TEXT[] NOT NULL DEFAULT '{}',
  admin_user_id   TEXT NOT NULL,
  admin_name      TEXT NOT NULL,
  admin_role      TEXT NOT NULL CHECK (admin_role IN ('DISTRICT_ADMIN', 'COUNTY_DIRECTOR', 'MINISTRY_INSPECTOR')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_admin_user_id ON districts(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_districts_county ON districts(county);

-- District Audit Events Table
CREATE TABLE IF NOT EXISTS district_audit_events (
  id                TEXT PRIMARY KEY,
  district_id       TEXT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  actor_id          TEXT NOT NULL,
  actor_name        TEXT NOT NULL,
  actor_role        TEXT NOT NULL,
  action            TEXT NOT NULL,
  target_school_id  TEXT,
  target_school_name TEXT,
  reason            TEXT,
  metadata          JSONB,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_district_audit_district_id ON district_audit_events(district_id);
CREATE INDEX IF NOT EXISTS idx_district_audit_timestamp ON district_audit_events(timestamp DESC);

-- Marketplace Listings Table (server-side persistence)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id                          TEXT PRIMARY KEY,
  exam_id                     TEXT NOT NULL,
  seller_id                   TEXT NOT NULL,
  seller_name                 TEXT NOT NULL,
  is_seller_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  title                       TEXT NOT NULL,
  description                 TEXT,
  subject                     TEXT NOT NULL,
  grade                       TEXT NOT NULL,
  exam_type                   TEXT NOT NULL,
  term                        TEXT,
  year                        INTEGER,
  total_marks                 INTEGER,
  duration_minutes            INTEGER,
  price_kes                   INTEGER NOT NULL,
  seller_percentage           INTEGER NOT NULL DEFAULT 70,
  platform_percentage         INTEGER NOT NULL DEFAULT 30,
  rating                      NUMERIC(3,1) NOT NULL DEFAULT 0,
  rating_count                INTEGER NOT NULL DEFAULT 0,
  sales_count                 INTEGER NOT NULL DEFAULT 0,
  moderation_status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (moderation_status IN ('APPROVED', 'PENDING', 'REJECTED')),
  moderation_reason           TEXT,
  moderated_by                TEXT,
  moderated_at                TIMESTAMPTZ,
  copyright_declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_seller_id ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_moderation_status ON marketplace_listings(moderation_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_subject ON marketplace_listings(subject);
CREATE INDEX IF NOT EXISTS idx_marketplace_grade ON marketplace_listings(grade);

-- Marketplace Purchases Table
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id                TEXT PRIMARY KEY,
  listing_id        TEXT NOT NULL REFERENCES marketplace_listings(id),
  buyer_id          TEXT NOT NULL,
  buyer_phone       TEXT,
  amount_kes        INTEGER NOT NULL,
  seller_earned_kes INTEGER NOT NULL,
  platform_earned_kes INTEGER NOT NULL,
  reference         TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  purchased_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_id ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_listing_id ON marketplace_purchases(listing_id);

-- Seller Wallet Table
CREATE TABLE IF NOT EXISTS seller_wallets (
  seller_id               TEXT PRIMARY KEY,
  total_published_papers  INTEGER NOT NULL DEFAULT 0,
  total_sales_count       INTEGER NOT NULL DEFAULT 0,
  gross_sales_kes         INTEGER NOT NULL DEFAULT 0,
  available_balance_kes   INTEGER NOT NULL DEFAULT 0,
  pending_balance_kes     INTEGER NOT NULL DEFAULT 0,
  withdrawal_phone        TEXT,
  last_withdrawal_at      TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id            TEXT PRIMARY KEY,
  seller_id     TEXT NOT NULL,
  amount_kes    INTEGER NOT NULL,
  phone         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_seller_id ON withdrawal_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);

-- Row Level Security
ALTER TABLE school_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_audit_events ENABLE ROW LEVEL SECURITY;

-- Allow school admins to view own subscriptions
CREATE POLICY "school_admins_view_own_subscriptions"
  ON school_subscriptions FOR SELECT
  USING (auth.uid()::text = school_id OR auth.uid()::text IN (
    SELECT user_id FROM school_members WHERE school_id = school_subscriptions.school_id AND role IN ('OWNER', 'ADMIN')
  ));

-- Allow sellers to view own listings and all approved listings
CREATE POLICY "sellers_view_own_or_approved_listings"
  ON marketplace_listings FOR SELECT
  USING (moderation_status = 'APPROVED' OR auth.uid()::text = seller_id);

-- Allow sellers to manage own wallet
CREATE POLICY "sellers_manage_own_wallet"
  ON seller_wallets FOR ALL
  USING (auth.uid()::text = seller_id);

-- Allow sellers to view own purchases and withdrawals
CREATE POLICY "sellers_view_own_withdrawals"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid()::text = seller_id);
