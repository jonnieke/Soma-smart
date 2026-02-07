-- Add parent_phone column to profiles table for enhanced parent login security
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parent_phone TEXT;
-- Index for faster lookups during parent login
CREATE INDEX IF NOT EXISTS idx_profiles_student_id_parent_phone ON profiles(student_id, parent_phone);