
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const posts = [
  {
    slug: 'mastering-kcse-revision-ai-habits',
    title: 'Mastering KCSE Revision: 5 AI-Powered Habits for Top Marks',
    excerpt: 'Stop studying hard and start studying smart. Discover how to use AI to identify your weak areas and master complex KCSE topics in half the time.',
    author_name: 'Somo Academic Team',
    read_time_minutes: 6,
    cover_image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
    content: `# Mastering KCSE Revision\n\nRevision season can be stressful, but it doesn't have to be. With the integration of AI into your study routine, you can transform how you learn.\n\n## 1. Focused Gap Analysis\nDon't waste time on what you already know. Use Somo Smart to scan your past papers and let the AI tell you exactly which topics need more attention.\n\n## 2. Active Recall with AI Quizzes\nAI can generate infinite practice questions. After reading a chapter, ask Akili to test you. This forces your brain to retrieve information, making it stick.\n\n## 3. Simplified Explanations\nStuck on a complex concept in Physics or Chemistry? Use the "Simple" mode in Somo Smart to get a breakdown that a 10-year-old would understand, then build up to the exam-level detail.\n\n## 4. Spaced Repetition\nThe brain forgets. AI tracks what you've learned and reminds you to review it just before you're about to forget it.\n\n## 5. Mock Exam Simulations\nPractice under pressure. Use our AI-generated mock exams to get used to the timing and phrasing of KCSE questions.\n\n**Start your journey to an A today!**`
  },
  {
    slug: 'cbc-transition-ai-formative-assessments',
    title: 'Transitioning to CBC: How to Leverage AI for Formative Assessments',
    excerpt: 'The Competency-Based Curriculum requires constant feedback. Learn how AI tools can save teachers hours of grading while providing deeper insights into student progress.',
    author_name: 'Dr. Jane Koech',
    read_time_minutes: 8,
    cover_image_url: 'https://images.unsplash.com/photo-1524178232363-1fb28f74b671?w=1200&q=80',
    content: `# AI and the CBC Transition\n\nThe Competency-Based Curriculum (CBC) shifts the focus from rote memorization to skill mastery. For teachers, this means more frequent and detailed assessments.\n\n## The Grading Burden\nTraditional grading for large classes is unsustainable under CBC. AI can automate the initial marking of structured tasks, allowing teachers to focus on qualitative feedback.\n\n## Real-time Progress Tracking\nSomo Smart provides a dashboard that shows which students are mastering specific competencies and who is falling behind. No more waiting for end-of-term reports to intervene.\n\n## Personalized Learning Paths\nEvery student learns differently. AI helps teachers create varied assessment tasks that cater to different learning styles—visual, auditory, and kinesthetic.\n\n## Collaborative Teaching\nUse AI to generate lesson plans and classroom activities that are strictly aligned with the latest KICD guidelines.\n\n*Join our next webinar to learn more about the Evolutionary Educator tools!*`
  },
  {
    slug: 'parents-guide-junior-secondary',
    title: "The Parent's Guide to Junior Secondary: Supporting Your Child's Growth",
    excerpt: 'Junior Secondary is a critical transition. Find out how to navigate the new curriculum and use Somo Smart to bridge the gap between home and school.',
    author_name: 'Parenting Support Hub',
    read_time_minutes: 5,
    cover_image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&q=80',
    content: `# Navigating Junior Secondary\n\nAs your child enters Junior Secondary, the academic pressure increases. As a parent, you are their biggest ally.\n\n## Understanding the Change\nJunior Secondary introduces new subjects and a deeper focus on career pathways. Stay informed about what your child is learning each week.\n\n## Encouraging Independent Study\nAt this age, children need to take ownership of their studies. Somo Smart acts as a safe, 24/7 tutor that encourages them to find answers themselves rather than just asking for the solution.\n\n## Monitoring Usage, Not Just Grades\nLook at the analytics. Is your child spending more time on Math or Languages? This can give you early clues about their natural interests and talents.\n\n## Creating a Tech-Positive Environment\nTechnology is an accelerator. Show your child that their smartphone is a powerful academic tool, not just for social media.\n\n**Together, we can ensure every child reaches their full potential.**`
  }
];

async function seed() {
  const { data, error } = await supabase.from('blog_posts').upsert(posts, { onConflict: 'slug' });
  if (error) {
    console.error('Error seeding blog posts:', error);
  } else {
    console.log('Successfully seeded blog posts!');
  }
}

seed();
