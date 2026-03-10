-- Soma AI Platform Expansion: Education Level Support
-- Run this migration to add education_level and institution_name columns to the profiles table.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'SENIOR';
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS institution_name TEXT;
-- Add an index for efficient filtering by education level
CREATE INDEX IF NOT EXISTS idx_profiles_education_level ON profiles(education_level);