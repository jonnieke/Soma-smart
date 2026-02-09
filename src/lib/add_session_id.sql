-- Add sessionId column for Single Device Login feature
ALTER TABLE profiles
ADD COLUMN session_id TEXT;