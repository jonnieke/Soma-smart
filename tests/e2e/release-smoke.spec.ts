import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://example.supabase.co/**', (route) => route.abort());
});

test('homepage exposes the teacher-first composer and auth handoff', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Soma AI homepage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prepare your next lesson with Soma' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start voice input' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible();

  await page.getByLabel('What would you like to prepare for your learners?').fill('Create a Grade 8 science lesson plan');
  await page.getByRole('button', { name: 'Create sample' }).click();
  await expect(page.getByRole('button', { name: 'Teacher login' })).toBeVisible();
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
