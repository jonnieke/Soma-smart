-- Add active_sessions column to profiles table to support multiple concurrent logins
-- Default is empty array
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_sessions text [] DEFAULT '{}';
-- Existing session_id column remains for backward compatibility or primary session tracking if needed, active_sessions will be the source of truth for concurrent access.