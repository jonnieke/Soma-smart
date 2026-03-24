-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    author_name TEXT NOT NULL,
    read_time_minutes INTEGER DEFAULT 5,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to blog posts
CREATE POLICY "Public blog posts are viewable by everyone" 
ON public.blog_posts FOR SELECT 
USING (true);

-- Allow authenticated users to manage posts
CREATE POLICY "Authenticated users can insert blog posts" 
ON public.blog_posts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update blog posts" 
ON public.blog_posts FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete blog posts" 
ON public.blog_posts FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_posts_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_blog_posts_modtime ON public.blog_posts;

CREATE TRIGGER trigger_update_blog_posts_modtime
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_modtime();

-- Insert Sample Blog Post
INSERT INTO public.blog_posts (slug, title, excerpt, content, cover_image_url, author_name, read_time_minutes)
VALUES (
    'how-to-prepare-for-kcse-mathematics',
    'How to Prepare for KCSE Mathematics: A Comprehensive Guide',
    'Discover proven strategies and techniques to master KCSE Mathematics. From understanding core concepts to practicing past papers efficiently, this guide covers everything you need to score an A.',
    '# How to Prepare for KCSE Mathematics

Mathematics is often considered a challenging subject, but with the right preparation strategy, you can easily secure top marks in your KCSE exams. 

## 1. Understand the Syllabus
The first step is to thoroughly review the KNEC syllabus. Make sure you cover all topics from Form 1 to Form 4. 

## 2. Practice Past Papers
Practicing past papers is crucial. It familiarizes you with the exam format and the types of questions commonly asked. 

## 3. Focus on Weak Areas
Use Somo Smart analytics to identify topics where you struggle the most and dedicate more time to them. 

## 4. Seek Help
Don’t hesitate to ask your teachers or use the **Somo Smart AI Explainer** whenever you get stuck. 

## Conclusion
Consistency is key. Practice daily and stay positive. You got this!',
    'https://images.unsplash.com/photo-1632559646295-c1e14afb8e5c?w=1200&q=80',
    'Somo Education Team',
    4
) ON CONFLICT (slug) DO NOTHING;
