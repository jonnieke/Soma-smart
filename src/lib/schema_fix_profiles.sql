-- Fix for missing columns in 'profiles' table
-- Add 'classes' column (Array of text)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS classes TEXT [] DEFAULT '{}';
-- Add 'subjects' column (Array of text)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subjects TEXT [] DEFAULT '{}';
-- Add 'email' column if missing (good for reference)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;
-- Verify schema cache reload (usually happens automatically but good comment)
-- If this still fails, go to API Settings -> Reload Schema Cache