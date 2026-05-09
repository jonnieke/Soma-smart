
-- Seed Blog Posts
INSERT INTO public.blog_posts (slug, title, excerpt, content, cover_image_url, author_name, read_time_minutes)
VALUES 
(
    'mastering-kcse-revision-ai-habits',
    'Mastering KCSE Revision: 5 AI-Powered Habits for Top Marks',
    'Stop studying hard and start studying smart. Discover how to use AI to identify your weak areas and master complex KCSE topics in half the time.',
    '# Mastering KCSE Revision

Revision season can be stressful, but it doesn''t have to be. With the integration of AI into your study routine, you can transform how you learn.

## 1. Focused Gap Analysis
Don''t waste time on what you already know. Use Somo Smart to scan your past papers and let the AI tell you exactly which topics need more attention.

## 2. Active Recall with AI Quizzes
AI can generate infinite practice questions. After reading a chapter, ask Akili to test you. This forces your brain to retrieve information, making it stick.

## 3. Simplified Explanations
Stuck on a complex concept in Physics or Chemistry? Use the "Simple" mode in Somo Smart to get a breakdown that a 10-year-old would understand, then build up to the exam-level detail.

## 4. Spaced Repetition
The brain forgets. AI tracks what you''ve learned and reminds you to review it just before you''re about to forget it.

## 5. Mock Exam Simulations
Practice under pressure. Use our AI-generated mock exams to get used to the timing and phrasing of KCSE questions.

**Start your journey to an A today!**',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
    'Somo Academic Team',
    6
),
(
    'cbc-transition-ai-formative-assessments',
    'Transitioning to CBC: How to Leverage AI for Formative Assessments',
    'The Competency-Based Curriculum requires constant feedback. Learn how AI tools can save teachers hours of grading while providing deeper insights into student progress.',
    '# AI and the CBC Transition

The Competency-Based Curriculum (CBC) shifts the focus from rote memorization to skill mastery. For teachers, this means more frequent and detailed assessments.

## The Grading Burden
Traditional grading for large classes is unsustainable under CBC. AI can automate the initial marking of structured tasks, allowing teachers to focus on qualitative feedback.

## Real-time Progress Tracking
Somo Smart provides a dashboard that shows which students are mastering specific competencies and who is falling behind. No more waiting for end-of-term reports to intervene.

## Personalized Learning Paths
Every student learns differently. AI helps teachers create varied assessment tasks that cater to different learning styles—visual, auditory, and kinesthetic.

## Collaborative Teaching
Use AI to generate lesson plans and classroom activities that are strictly aligned with the latest KICD guidelines.

*Join our next webinar to learn more about the Evolutionary Educator tools!*',
    'https://images.unsplash.com/photo-1524178232363-1fb28f74b671?w=1200&q=80',
    'Dr. Jane Koech',
    8
),
(
    'parents-guide-junior-secondary',
    'The Parent''s Guide to Junior Secondary: Supporting Your Child''s Growth',
    'Junior Secondary is a critical transition. Find out how to navigate the new curriculum and use Somo Smart to bridge the gap between home and school.',
    '# Navigating Junior Secondary

As your child enters Junior Secondary, the academic pressure increases. As a parent, you are their biggest ally.

## Understanding the Change
Junior Secondary introduces new subjects and a deeper focus on career pathways. Stay informed about what your child is learning each week.

## Encouraging Independent Study
At this age, children need to take ownership of their studies. Somo Smart acts as a safe, 24/7 tutor that encourages them to find answers themselves rather than just asking for the solution.

## Monitoring Usage, Not Just Grades
Look at the analytics. Is your child spending more time on Math or Languages? This can give you early clues about their natural interests and talents.

## Creating a Tech-Positive Environment
Technology is an accelerator. Show your child that their smartphone is a powerful academic tool, not just for social media.

**Together, we can ensure every child reaches their full potential.**',
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&q=80',
    'Parenting Support Hub',
    5
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url,
    author_name = EXCLUDED.author_name,
    read_time_minutes = EXCLUDED.read_time_minutes,
    updated_at = now();
