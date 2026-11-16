import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://example.supabase.co/**', (route) => route.abort());
});

test('homepage exposes the primary learning experience and teacher handoff', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Soma AI homepage' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /AI study help for/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start learning/i })).toBeVisible();
  await expect(page.getByLabel('Ask a homework question')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Snap photo with camera' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload homework document' })).toBeVisible();

  await page.getByRole('button', { name: /I'm a Teacher/i }).click();
  await expect(page.getByRole('heading', { name: 'Teacher Login' })).toBeVisible();
});

test('advanced routes are not reachable when their launch flags are off', async ({ page }) => {
  await page.goto('/developers');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Soma AI homepage' })).toBeVisible();
});

test('mobile homepage does not overflow horizontally', async ({ page }) => {
  await page.goto('/');
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasHorizontalOverflow).toBe(false);
});

test('SEO guide routes, exam guide countdown, learner home, and 404 recovery render cleanly', async ({ page }) => {
  await page.goto('/kcse-past-papers');
  await expect(page.getByRole('heading', { level: 1, name: /KCSE Past Papers/i })).toBeVisible();

  await page.goto('/guide');
  await expect(page.getByText('0 Days Left')).toHaveCount(0);

  await page.goto('/learner');
  await expect(page.getByRole('button', { name: /Class Assignments View homework/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Join a Class/i })).toBeVisible();
  const learnerOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(learnerOverflow).toBe(false);

  await page.goto('/non-existent-study-page');
  await expect(page.getByText(/404/i)).toBeVisible();
});
