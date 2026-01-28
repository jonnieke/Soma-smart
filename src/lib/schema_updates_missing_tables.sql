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
DROP POLICY IF EXISTS "Users can manage their own lessons" ON darasa_lessons;
CREATE POLICY "Users can manage their own lessons" ON darasa_lessons FOR ALL USING (auth.uid() = user_id);
-- Create activities table (Found missing in errors)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    type TEXT NOT NULL,
    topic TEXT NOT NULL,
    score INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- Create policy for activities (Open for now as student_id is not auth.uid)
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
CREATE POLICY "Enable read access for all users" ON activities FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON activities;
CREATE POLICY "Enable insert access for all users" ON activities FOR
INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable delete access for all users" ON activities;
CREATE POLICY "Enable delete access for all users" ON activities FOR DELETE USING (true);