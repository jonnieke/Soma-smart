-- SQL Migration: Add Subscription Columns to Profiles
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- 1. Add subscription_tier column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE';
-- 2. Add subscription_expiry column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE;
-- 3. (Optional) Index for performance if you have many users
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
-- 4. Verify columns exist (Run this check separately if needed)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('subscription_tier', 'subscription_expiry');