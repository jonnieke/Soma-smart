import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('[prerender-seo] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

const ROUTES = [
  {
    route: '/ai-tutor-kenya',
    title: 'AI Tutor Kenya | Ask Akili CBC, KPSEA & KCSE Homework Help | Soma AI',
    description:
      'Get instant step-by-step CBC, KPSEA, and KCSE homework explanations with Ask Akili. Snap a photo or type any question with Kenyan syllabus marking points.',
    h1: 'Step-by-step CBC, KPSEA & KCSE homework help in seconds',
    body: 'Type a question, snap a photo of your exercise book, or upload a PDF. Akili explains the method clearly with KNEC-style marking points and saves notes offline.',
  },
  {
    route: '/kcse-past-papers',
    title: 'KCSE Past Papers & Marking Schemes Kenya | Soma AI',
    description:
      'Practise verified KCSE past papers and marking schemes across Mathematics, Biology, Chemistry, Physics, English, and Kiswahili. Unlock papers or a 24h pass for KES 20.',
    h1: 'KCSE Past Papers with Step-by-Step Marking Schemes',
    body: 'Revise Paper 1, Paper 2, and Paper 3 questions with method-mark guidance, timed practice drills, and instant phone-number restoration.',
  },
  {
    route: '/kpsea-past-papers',
    title: 'KPSEA Past Papers & Grade 6 Revision Kenya | Soma AI',
    description:
      'Prepare Grade 6 candidates for KPSEA with CBC-aligned past papers, Science & Math drills, Kiswahili Insha, and step-by-step Akili explanations.',
    h1: 'Grade 6 KPSEA Past Papers & Interactive Practice Drills',
    body: 'Build exam speed and confidence across Mathematics, English, Kiswahili, Integrated Science, and Social Studies with child-friendly guidance.',
  },
  {
    route: '/cbc-notes-kenya',
    title: 'CBC Notes Kenya (Primary & Junior Secondary) | Soma AI',
    description:
      'Access curriculum-aligned CBC study notes for Primary and Junior Secondary (Grade 7, 8, 9) including Mathematics, Integrated Science, Agriculture, and Kiswahili.',
    h1: 'Clear CBC & JSS Study Notes Ready for Offline Revision',
    body: 'Study structured notes across Mathematics, English, Kiswahili, Integrated Science, Social Studies, and Agriculture, with instant practice checks.',
  },
  {
    route: '/lesson-plan-generator-kenya',
    title: 'CBC Lesson Plan Generator for Kenyan Teachers | Soma AI',
    description:
      'Generate CBC-aligned lesson plans, class notes, homework quizzes, and marking feedback in minutes with Soma AI Teacher Studio.',
    h1: 'Generate CBC Lesson Plans, Class Notes & Homework Fast',
    body: 'Save hours of weekly prep with structured Kenyan lesson plans, printable exams, and instant WhatsApp class invite codes.',
  },
  {
    route: '/schemes-of-work-generator-kenya',
    title: 'Schemes of Work & Syllabus Tracker Kenya | Soma AI',
    description:
      'Plan termly Kenyan CBC & 8-4-4 schemes of work, track syllabus coverage, and align class assessments with KNEC term dates.',
    h1: 'Termly Schemes of Work & Syllabus Coverage for Kenyan Schools',
    body: 'Organise weekly strands, lesson objectives, learning resources, and assessments aligned to the Kenyan school calendar.',
  },
  {
    route: '/exam-papers',
    title: 'KCSE, KPSEA & CBC Exam Paper Bank Kenya | Soma AI Past Papers',
    description:
      'Browse and unlock verified KCSE, KPSEA, KJSEA, and CBC past papers with marking schemes from KES 20 via M-Pesa.',
    h1: 'Kenyan Exam Paper Bank — KCSE, KPSEA & CBC Past Papers',
    body: 'Search past papers by grade, subject, and exam body. Unlock a single paper or 24-hour AI Revision Pass from KES 20.',
  },
  {
    route: '/guide',
    title: 'Soma Guide | KCSE, KPSEA & CBC Academic Calendar & Exam Updates Kenya',
    description:
      'Official Kenyan educational guide for KCSE, KPSEA, and CBC students. Access school term calendars, KNEC exam dates, study strategy tips, and direct revision tools.',
    h1: 'Soma Guide — Kenyan School Calendar & KNEC Exam Preparation',
    body: 'Stay ahead with Kenyan term dates, KNEC marking strategies for Mathematics, Biology, Chemistry, English and Kiswahili, and direct revision links.',
  },
  {
    route: '/revision',
    title: 'Candidates Exam Hub — KCSE, KJSEA & KPSEA Revision | Soma AI',
    description:
      'Timed past paper practice, step-by-step marking rubrics, and KES 20 24-hour revision passes for KCSE, KJSEA, and KPSEA candidates in Kenya.',
    h1: 'Candidates Exam Hub for KCSE, KJSEA & KPSEA',
    body: 'Practise timed questions, check KNEC method marks, and restore your 24-hour pass using your phone number.',
  },
  {
    route: '/free-pool',
    title: 'Free Revision Pool — Kenyan CBC, KPSEA & KCSE Study Notes | Soma AI',
    description:
      'Explore community-pooled CBC, KPSEA, and KCSE homework solutions, worked examples, and practice drills for free on Soma AI.',
    h1: 'Free Kenyan Revision Pool',
    body: 'Browse verified curriculum explanations and practice drills contributed across Kenyan subjects and grades.',
  },
  {
    route: '/blog',
    title: 'Educational Journal & Exam Insights | Soma AI Blog',
    description:
      'Discover study tips, exam strategies, and educational insights tailored for the Kenyan CBC, KPSEA, and KCSE curriculum on the Soma AI Journal.',
    h1: 'Soma AI Educational Journal & Exam Insights',
    body: 'Study strategies, KNEC preparation guides, and curriculum insights for Kenyan learners, parents, and teachers.',
  },
];

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

let generated = 0;

for (const entry of ROUTES) {
  const canonical = `https://www.somaai.co.ke${entry.route}`;
  const safeTitle = escapeHtml(entry.title);
  const safeDesc = escapeHtml(entry.description);
  const safeH1 = escapeHtml(entry.h1);
  const safeBody = escapeHtml(entry.body);

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonical}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  const fallbackHtml = `<div id="root">
    <main style="max-width:720px;margin:48px auto;padding:0 20px;font-family:system-ui,sans-serif;color:#0f172a;">
      <h1>${safeH1}</h1>
      <p>${safeBody}</p>
      <p><a href="/">Ask Akili Home</a> · <a href="/learner">My Classroom</a> · <a href="/exam-papers">Exam Paper Bank</a> · <a href="/revision">Candidates Hub</a> · <a href="/guide">Exam Calendar</a></p>
    </main>
  </div>`;

  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<script/, `${fallbackHtml}\n  <script`);

  const targetDir = path.join(distDir, entry.route.replace(/^\//, ''));
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  generated += 1;
}

console.log(`[prerender-seo] Pre-rendered ${generated} SEO routes into dist/.`);
