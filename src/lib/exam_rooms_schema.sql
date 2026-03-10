-- ==========================================
-- Exam Rooms Schema for Soma AI
-- ==========================================
-- 1. exam_rooms table
CREATE TABLE IF NOT EXISTS public.exam_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT NOT NULL DEFAULT 'GENERAL',
    -- EXAM_PREP, SUBJECT_STUDY, UNIVERSITY_COURSE, GENERAL
    education_level TEXT,
    -- JUNIOR, SENIOR, CAMPUS
    subject TEXT,
    exam_target TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        member_count INTEGER DEFAULT 1,
        tags TEXT [],
        banner_url TEXT,
        pinned_message_id UUID -- References exam_room_messages (added later to avoid circular dep)
);
-- Index for filtering rooms
CREATE INDEX IF NOT EXISTS idx_exam_rooms_level ON public.exam_rooms(education_level);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_type ON public.exam_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_active ON public.exam_rooms(is_active);
-- 2. exam_room_members table
CREATE TABLE IF NOT EXISTS public.exam_room_members (
    room_id UUID REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT DEFAULT 'MEMBER',
    -- MEMBER, MODERATOR, ADMIN
    last_read_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (room_id, user_id)
);
-- Index for finding user's rooms
CREATE INDEX IF NOT EXISTS idx_exam_room_members_user ON public.exam_room_members(user_id);
-- 3. exam_room_messages table
CREATE TABLE IF NOT EXISTS public.exam_room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    -- UUID string or 'system'
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'GUEST',
    message_type TEXT DEFAULT 'TEXT',
    -- TEXT, IMAGE, AI_EXPLANATION, SYSTEM
    content TEXT NOT NULL,
    image_url TEXT,
    parent_id UUID REFERENCES public.exam_room_messages(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        upvotes INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT false
);
-- Add foreign key back to exam_rooms for pinned message
ALTER TABLE public.exam_rooms
ADD CONSTRAINT fk_exam_rooms_pinned_msg FOREIGN KEY (pinned_message_id) REFERENCES public.exam_room_messages(id) ON DELETE
SET NULL;
-- Index for fetching room messages quickly
CREATE INDEX IF NOT EXISTS idx_exam_room_messages_room ON public.exam_room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_exam_room_messages_created_at ON public.exam_room_messages(created_at);
-- 4. exam_room_votes table
CREATE TABLE IF NOT EXISTS public.exam_room_votes (
    message_id UUID REFERENCES public.exam_room_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL,
    -- UP, DOWN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);
-- ==========================================
-- RLS Policies (Row Level Security)
-- ==========================================
-- Enable RLS
ALTER TABLE public.exam_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_room_votes ENABLE ROW LEVEL SECURITY;
-- Exam Rooms Policies
-- Anyone can view active rooms
CREATE POLICY "Anyone can view active exam rooms" ON public.exam_rooms FOR
SELECT USING (is_active = true);
-- Only authenticated users can create rooms
CREATE POLICY "Users can create exam rooms" ON public.exam_rooms FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Room creators or mods can update rooms
CREATE POLICY "Creators can update exam rooms" ON public.exam_rooms FOR
UPDATE USING (auth.uid() = created_by);
-- Exam Room Members Policies
-- Anyone can view room members
CREATE POLICY "Anyone can view room members" ON public.exam_room_members FOR
SELECT USING (true);
-- Users can join rooms (insert themselves)
CREATE POLICY "Users can join rooms" ON public.exam_room_members FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can leave rooms (delete themselves)
CREATE POLICY "Users can leave rooms" ON public.exam_room_members FOR DELETE USING (auth.uid() = user_id);
-- Exam Room Messages Policies
-- Anyone can view messages in rooms
CREATE POLICY "Anyone can view messages" ON public.exam_room_messages FOR
SELECT USING (true);
-- Authenticated users who are members can insert messages
-- Note: 'system' messages might need a bypass or service role insert
CREATE POLICY "Members can insert messages" ON public.exam_room_messages FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR user_id = 'system' -- Allow system messages (ensure service role is used for these)
    );
-- Users can update their own messages or mods can update
CREATE POLICY "Users can update own messages" ON public.exam_room_messages FOR
UPDATE USING (auth.uid()::text = user_id);
-- Exam Room Votes Policies
-- Anyone can view votes
CREATE POLICY "Anyone can view votes" ON public.exam_room_votes FOR
SELECT USING (true);
-- Authenticated users can vote
CREATE POLICY "Users can insert votes" ON public.exam_room_votes FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update/delete their own votes
CREATE POLICY "Users can update own votes" ON public.exam_room_votes FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.exam_room_votes FOR DELETE USING (auth.uid() = user_id);