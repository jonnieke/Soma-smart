-- Migration: Star rating, feedback, and chat messages
-- 1. Add rating and feedback columns to tutoring_requests
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS rating NUMERIC;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS feedback TEXT;
-- 2. Create chat_messages table for continuous conversations
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.tutoring_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('STUDENT', 'TEACHER')) NOT NULL,
    message_type TEXT CHECK (message_type IN ('TEXT', 'VOICE', 'VIDEO')) DEFAULT 'TEXT',
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
-- RLS: Allow all authenticated users to read/write chat messages
-- (In production, restrict to participants only)
DROP POLICY IF EXISTS "Chat participants can access messages" ON public.chat_messages;
CREATE POLICY "Chat participants can access messages" ON public.chat_messages FOR ALL USING (true);
-- Index for fast lookup by request_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_request_id ON public.chat_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);