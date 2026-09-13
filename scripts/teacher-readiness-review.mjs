// Read-only live route review plus isolated local teacher fixtures. No production writes.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const out = 'artifacts/teacher-review-2026-09-13';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const localOnly = process.argv.includes('--local-only');
const results = localOnly ? JSON.parse(await readFile(`${out}/observations.json`, 'utf8')).filter(r => r.mode.startsWith('live')) : [];
const journeysOnly = process.argv.includes('--journeys-only');
const routes = ['/teacher', '/teacher/paper-studio', '/teacher/paper-studio/create', '/teacher/paper-studio/questions', '/teacher/paper-studio/editor/paper_sample_01', '/teacher/creator-studio', '/teacher/paper-bank', '/teacher/paper-bank/purchases', '/teacher/assessments', '/teacher/content', '/teacher/intelligence', '/teacher/reports'];
const live = await browser.newContext({ viewport: { width: 390, height: 844 } });
await live.route('**/*', async route => {
  const request = route.request();
  if (!['GET', 'HEAD'].includes(request.method())) return route.abort();
  return route.continue();
});
const page = await live.newPage();
for (const path of localOnly ? [] : routes) {
  try {
    await page.goto(`https://www.somaai.co.ke${path}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Skip to content' }).waitFor({ timeout: 15000 });
    await page.waitForTimeout(1300);
    results.push({ mode: 'live guest read-only', path, url: page.url(), ...(await page.evaluate(() => ({ headings: [...document.querySelectorAll('h1,h2')].map(e => e.textContent), navigation: [...document.querySelectorAll('nav')].map(e => e.innerText), overflow: document.documentElement.scrollWidth > innerWidth + 1, text: document.body.innerText.slice(0, 6000) }))) });
    if (['/teacher/paper-studio/editor/paper_sample_01', '/teacher/paper-studio/create'].includes(path)) await page.screenshot({ path: `${out}/${path.includes('editor') ? 'paper-editor' : 'paper-wizard'}-mobile.png`, fullPage: true });
  } catch (error) { results.push({ mode: 'live guest', path, error: String(error) }); }
  console.log('Reviewed', path);
  await writeFile(`${out}/observations.json`, JSON.stringify(results, null, 2));
}
await live.close();
const local = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const mockWrites = [];
const uid = '11111111-1111-4111-8111-111111111111';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'teacher-review@example.test', app_metadata: {}, user_metadata: {} };
const profile = { id: uid, role: 'TEACHER', full_name: 'Teacher Review Fixture', email: user.email, classes: ['Grade 6'], subjects: ['Science & Technology'], is_pro: false, subscription_plan: 'FREE', active_sessions: [], usage_teacher: 0 };
await local.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === '127.0.0.1') return route.continue();
  if (url.hostname !== 'example.supabase.co') return route.abort();
  if (!['GET', 'HEAD'].includes(route.request().method())) mockWrites.push({ path: url.pathname, method: route.request().method() });
  let body = [];
  if (url.pathname.includes('/auth/v1/user')) body = user;
  else if (url.pathname.includes('/rest/v1/profiles')) body = route.request().headers().accept?.includes('object') ? profile : [profile];
  else if (url.pathname.includes('/functions/')) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Isolated review: AI service unavailable' }) });
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});
await local.addInitScript(({ user, uid }) => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: uid, exp, role: 'authenticated' }))}.review-only`;
  localStorage.setItem('sb-example-auth-token', JSON.stringify({ access_token: jwt, refresh_token: 'review-only', expires_at: exp, expires_in: 3600, token_type: 'bearer', user }));
  localStorage.setItem(`soma_teacher_onboarded_${uid}`, '1');
}, { user, uid });
const teacher = await local.newPage();
if (journeysOnly) {
  const journeyResults = [];
  await teacher.goto('http://127.0.0.1:4173/teacher');
  await teacher.getByText('Welcome back, Teacher', { exact: false }).waitFor({ timeout: 30000 });
  await teacher.goto('http://127.0.0.1:4173/teacher/paper-studio');
  await teacher.getByRole('link', { name: 'Soma homepage', exact: true }).click();
  await teacher.waitForTimeout(1500);
  journeyResults.push({ test: 'signed-in first Soma homepage link', finalUrl: teacher.url() });
  for (const path of ['/teacher/notes', '/teacher/homework']) {
    await teacher.goto(`http://127.0.0.1:4173${path}`);
    await teacher.waitForTimeout(1500);
    journeyResults.push({ test: 'direct tool route', path, text: await teacher.locator('body').innerText() });
  }
  await teacher.goto('http://127.0.0.1:4173/teacher');
  await teacher.getByText('Welcome back, Teacher', { exact: false }).waitFor();
  await teacher.evaluate(uid => localStorage.setItem(`soma_teacher_workflow_draft_${uid}_HOMEWORK`, JSON.stringify({ draftType: 'HOMEWORK', payload: { topic: 'Soil erosion', grade: 'Grade 6', subject: 'Science & Technology', difficulty: 'MEDIUM', homework: { title: 'Review fixture homework', questions: [{ question: 'What is soil erosion?', answer: 'Removal of topsoil', explanation: 'By water or wind' }] } } })), uid);
  await teacher.getByRole('button', { name: 'Homework', exact: true }).click();
  await teacher.getByText('Review fixture homework').waitFor();
  const messages = [];
  teacher.on('dialog', async dialog => { messages.push(dialog.message()); await dialog.dismiss(); });
  const start = mockWrites.length;
  await teacher.getByRole('button', { name: /Assign/i }).click();
  await teacher.waitForTimeout(500);
  journeyResults.push({ test: 'assign homework', messages, writes: mockWrites.slice(start) });
  await teacher.goto('http://127.0.0.1:4173/teacher');
  await teacher.getByText('Welcome back, Teacher', { exact: false }).waitFor();
  await teacher.getByRole('button', { name: 'Marking', exact: true }).first().click();
  await teacher.getByRole('button', { name: 'Auto-Grade New Paper' }).click();
  journeyResults.push({ test: 'marking without enrolled learners', text: await teacher.locator('body').innerText() });
  await teacher.screenshot({ path: `${out}/marking-roster-required.png`, fullPage: true });
  await writeFile(`${out}/journey-observations.json`, JSON.stringify(journeyResults, null, 2));
  console.log(JSON.stringify(journeyResults.filter(r => !r.text), null, 2));
  await browser.close();
  process.exit(0);
}
await teacher.goto('http://127.0.0.1:4173/teacher');
await teacher.getByText('Welcome back, Teacher', { exact: false }).waitFor({ timeout: 30000 });
await teacher.screenshot({ path: `${out}/teacher-home-desktop.png`, fullPage: true });
results.push({ mode: 'local mocked teacher', path: '/teacher', text: await teacher.locator('body').innerText() });
await writeFile(`${out}/observations.json`, JSON.stringify(results, null, 2));
await teacher.setViewportSize({ width: 390, height: 844 });
await teacher.screenshot({ path: `${out}/teacher-home-mobile.png`, fullPage: true });
results.push({ mode: 'local mocked teacher mobile', path: '/teacher', overflow: await teacher.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) });
await teacher.setViewportSize({ width: 1440, height: 1000 });
for (const label of ['Notes', 'Plans', 'Scheme', 'Homework', 'Marking', 'Create Quiz', 'Classroom Stream', 'View All', 'Open class sharing', 'More teacher tools']) {
  try {
    await teacher.goto('http://127.0.0.1:4173/teacher');
    await teacher.getByText('Welcome back, Teacher', { exact: false }).waitFor({ timeout: 15000 });
    await teacher.getByRole('button', { name: label, exact: true }).first().click({ timeout: 5000 });
    await teacher.waitForTimeout(700);
    results.push({ mode: 'local tool discovery', label, url: teacher.url(), text: (await teacher.locator('body').innerText()).slice(0, 11000) });
    if (label === 'Notes' || label === 'Marking') await teacher.screenshot({ path: `${out}/${label.toLowerCase()}-desktop.png`, fullPage: true });
  } catch (error) { results.push({ mode: 'local tool discovery', label, error: String(error).slice(0, 1200) }); }
  console.log('Checked teacher tool:', label);
  await writeFile(`${out}/observations.json`, JSON.stringify(results, null, 2));
}
await teacher.setViewportSize({ width: 390, height: 844 });
await teacher.goto('http://127.0.0.1:4173/teacher/paper-studio/create');
// Default wizard asks for nine questions and 30 marks. Review the actual resulting paper.
for (let step = 1; step < 6; step++) {
  try { await teacher.getByRole('button', { name: /Next/i }).click({ timeout: 2500 }); }
  catch (error) {
    results.push({ mode: 'local wizard mobile obstruction', step, error: String(error).slice(0, 2000) });
    await teacher.screenshot({ path: `${out}/wizard-next-obstruction.png` });
    await teacher.setViewportSize({ width: 1440, height: 1000 });
    await teacher.getByRole('button', { name: /Next/i }).click();
  }
}
await teacher.getByRole('button', { name: /Assemble Examination Paper/i }).click();
await teacher.waitForURL('**/editor/**');
const paper = await teacher.evaluate(() => JSON.parse(localStorage.getItem('soma_paper_studio_papers'))[0]);
results.push({ mode: 'local isolated assembly', requestedQuestions: 9, requestedMarks: 30, actualQuestions: paper.sections.reduce((n, s) => n + s.questions.length, 0), declaredMarks: paper.totalMarks, actualMarks: paper.sections.reduce((n, s) => n + s.questions.reduce((m, q) => m + q.marks, 0), 0), ownerId: paper.ownerId });
await writeFile(`${out}/observations.json`, JSON.stringify(results, null, 2));
await teacher.getByRole('button', { name: /Print|Preview/i }).first().click();
const dialogs = []; const downloads = [];
teacher.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
teacher.on('download', download => downloads.push(download.suggestedFilename()));
await teacher.getByRole('button', { name: /Export DOCX/i }).click();
await teacher.waitForTimeout(300);
results.push({ mode: 'local DOCX export', dialogs, downloads });
await writeFile(`${out}/observations.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.filter(r => r.mode.includes('assembly') || r.mode.includes('export')), null, 2));
await browser.close();
