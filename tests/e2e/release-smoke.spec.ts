import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://example.supabase.co/**', (route) => route.abort());
});

test('homepage exposes the primary learning experience and teacher handoff', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Soma AI homepage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Understand more/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start learning/i })).toBeVisible();
  await expect(page.getByLabel('Ask a homework question')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask with voice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Snap photo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload homework file' })).toBeVisible();

  await page.getByRole('button', { name: 'Open Teacher Studio' }).click();
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
