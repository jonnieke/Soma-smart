-- ==========================================
-- Community Feed Schema for Soma AI
-- ==========================================
-- 1. community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    education_level TEXT NOT NULL,
    -- JUNIOR, SENIOR, CAMPUS (to match the user's level)
    subject TEXT,
    -- Optional, if tagging a specific subject
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false
);
-- Index for filtering posts by level and recency
CREATE INDEX IF NOT EXISTS idx_community_posts_level ON public.community_posts(education_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts(author_id);
-- 2. community_comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    upvotes INTEGER DEFAULT 0
);
-- Index for fetching comments per post
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id, created_at ASC);
-- 3. community_votes table (Handles both posts and comments)
CREATE TABLE IF NOT EXISTS public.community_votes (
    target_id UUID NOT NULL,
    -- UUID of the post or the comment
    target_type TEXT NOT NULL,
    -- 'POST' or 'COMMENT'
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL,
    -- 'UP', 'DOWN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (target_id, target_type, user_id)
);
-- ==========================================
-- RLS Policies (Row Level Security)
-- ==========================================
-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
-- Community Posts Policies
-- Anyone can view posts
CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR
SELECT USING (true);
-- Authenticated users can insert posts
CREATE POLICY "Users can create community posts" ON public.community_posts FOR
INSERT WITH CHECK (auth.uid() = author_id);
-- Creators can update their own posts
CREATE POLICY "Creators can update community posts" ON public.community_posts FOR
UPDATE USING (auth.uid() = author_id);
-- Creators can delete their own posts
CREATE POLICY "Creators can delete community posts" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);
-- Community Comments Policies
-- Anyone can view comments
CREATE POLICY "Anyone can view community comments" ON public.community_comments FOR
SELECT USING (true);
-- Authenticated users can insert comments
CREATE POLICY "Users can insert community comments" ON public.community_comments FOR
INSERT WITH CHECK (auth.uid() = author_id);
-- Creators can update their own comments
CREATE POLICY "Creators can update community comments" ON public.community_comments FOR
UPDATE USING (auth.uid() = author_id);
-- Creators can delete their own comments
CREATE POLICY "Creators can delete community comments" ON public.community_comments FOR DELETE USING (auth.uid() = author_id);
-- Community Votes Policies
-- Anyone can view votes
CREATE POLICY "Anyone can view community votes" ON public.community_votes FOR
SELECT USING (true);
-- Authenticated users can vote
CREATE POLICY "Users can insert community votes" ON public.community_votes FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update/delete their own votes
CREATE POLICY "Users can update own community votes" ON public.community_votes FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own community votes" ON public.community_votes FOR DELETE USING (auth.uid() = user_id);
-- ==========================================
-- Triggers for comment_count and upvotes
-- ==========================================
-- Trigger to update comment count on post
CREATE OR REPLACE FUNCTION public.update_post_comment_count() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN
UPDATE public.community_posts
SET comment_count = comment_count + 1
WHERE id = NEW.post_id;
ELSIF TG_OP = 'DELETE' THEN
UPDATE public.community_posts
SET comment_count = comment_count - 1
WHERE id = OLD.post_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_update_comment_count ON public.community_comments;
CREATE TRIGGER trg_update_comment_count
AFTER
INSERT
    OR DELETE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();