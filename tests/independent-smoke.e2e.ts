import { expect, test } from '@playwright/test';

test('start screen and timed play render without browser errors', { tag: '@smoke' }, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /find the rule/i })).toBeVisible();
  await page.getByRole('button', { name: /play now/i }).click();
  await expect(page.getByRole('heading', { name: 'What comes next?' })).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
  expect(errors).toEqual([]);
});
