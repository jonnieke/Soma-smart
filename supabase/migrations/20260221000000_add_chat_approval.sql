-- Add parent PIN and chat approval columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parent_pin TEXT DEFAULT NULL;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS chat_approved BOOLEAN DEFAULT false;