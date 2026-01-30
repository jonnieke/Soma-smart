-- Enable UUID extension (Required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create darasa_lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS darasa_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    topic TEXT NOT NULL,
    summary TEXT,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for darasa_lessons
ALTER TABLE darasa_lessons ENABLE ROW LEVEL SECURITY;
-- Create policy for darasa_lessons
-- Allow users to insert their own lessons
DROP POLICY IF EXISTS "Users can insert their own lessons" ON darasa_lessons;
CREATE POLICY "Users can insert their own lessons" ON darasa_lessons FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Allow users to select their own lessons
DROP POLICY IF EXISTS "Users can view their own lessons" ON darasa_lessons;
CREATE POLICY "Users can view their own lessons" ON darasa_lessons FOR
SELECT USING (auth.uid() = user_id);
-- Allow users to delete their own lessons
DROP POLICY IF EXISTS "Users can delete their own lessons" ON darasa_lessons;
CREATE POLICY "Users can delete their own lessons" ON darasa_lessons FOR DELETE USING (auth.uid() = user_id);
-- Allow users to update their own lessons
DROP POLICY IF EXISTS "Users can update their own lessons" ON darasa_lessons;
CREATE POLICY "Users can update their own lessons" ON darasa_lessons FOR
UPDATE USING (auth.uid() = user_id);