-- SQL Migration: Add Subscription Columns to Profiles
-- 1. Add subscription_tier column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE';
-- 2. Add subscription_expiry column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE;
-- 3. (Optional) Index for performance if you have many users
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);