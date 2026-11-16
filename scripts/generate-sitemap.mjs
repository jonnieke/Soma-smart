import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const publicSitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
const envPath = path.resolve(process.cwd(), '.env');

const loadEnvFile = () => {
  const vars = {};
  if (!fs.existsSync(envPath)) return vars;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = val;
  }
  return vars;
};

const envVars = loadEnvFile();
const supabaseUrl = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY || '';
const today = new Date().toISOString().slice(0, 10);

const STATIC_URLS = [
  { loc: 'https://www.somaai.co.ke/', changefreq: 'daily', priority: '1.0' },
  { loc: 'https://www.somaai.co.ke/learner', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://www.somaai.co.ke/exam-papers', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://www.somaai.co.ke/revision', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://www.somaai.co.ke/guide', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.somaai.co.ke/free-pool', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://www.somaai.co.ke/pricing', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.somaai.co.ke/teacher', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://www.somaai.co.ke/parent', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://www.somaai.co.ke/blog', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://www.somaai.co.ke/contact', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://www.somaai.co.ke/ai-tutor-kenya', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.somaai.co.ke/kcse-past-papers', changefreq: 'weekly', priority: '0.9' },
  { loc: 'https://www.somaai.co.ke/kpsea-past-papers', changefreq: 'weekly', priority: '0.9' },
  { loc: 'https://www.somaai.co.ke/cbc-notes-kenya', changefreq: 'weekly', priority: '0.9' },
  { loc: 'https://www.somaai.co.ke/lesson-plan-generator-kenya', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.somaai.co.ke/schemes-of-work-generator-kenya', changefreq: 'weekly', priority: '0.8' },
];

const escapeXml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function fetchJson(endpoint) {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) return [];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchPublishedPapers() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) return [];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/list_exam_paper_bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ p_grade: null, p_subject: null, p_exam_body: null }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function run() {
  const [papers, posts] = await Promise.all([
    fetchPublishedPapers(),
    fetchJson('blog_posts?select=slug,published_at&order=published_at.desc&limit=200'),
  ]);

  const urls = STATIC_URLS.map((u) => ({ ...u, lastmod: today }));

  for (const paper of papers) {
    if (!paper?.id) continue;
    urls.push({
      loc: `https://www.somaai.co.ke/exam-papers/${encodeURIComponent(String(paper.id))}`,
      lastmod: String(paper.created_at || today).slice(0, 10),
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  for (const post of posts) {
    if (!post?.slug) continue;
    urls.push({
      loc: `https://www.somaai.co.ke/blog/${encodeURIComponent(String(post.slug))}`,
      lastmod: String(post.published_at || today).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  const xml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
  }
  fs.writeFileSync(publicSitemapPath, xml, 'utf8');
  console.log(`[generate-sitemap] Wrote ${urls.length} URLs (${papers.length} papers, ${posts.length} blog posts).`);
}

run();
