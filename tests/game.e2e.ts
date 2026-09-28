import { expect, test } from '@playwright/test';

test('start, unique choice, keyboard success, local best and replay', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /find the rule/i })).toBeVisible();
  await page.getByRole('button', { name: /play now/i }).click();
  await expect(page.getByRole('heading', { name: 'What comes next?' })).toBeVisible();
  await expect(page.locator('.sequenceTile')).toHaveCount(4);
  await expect(page.getByLabel('Missing next term')).toBeVisible();
  const sequence = await page.locator('.sequenceTile').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')!.split(',')[0]));
  const target = /^\d+$/.test(sequence[0]) ? '9' : sequence[0];
  const buttons = page.locator('.answerButton');
  const labels = await buttons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')!));
  const index = labels.findIndex((label) => label.split(',')[1].trim() === target);
  expect(index).toBeGreaterThanOrEqual(0);
  if (index === 0) await buttons.nth(index).click();
  else await page.keyboard.press('abcd'[index]);
  await expect(page.getByText(/link added/i)).toBeVisible();
  await expect(page.locator('.scoreNumber')).toHaveText('01');
  await expect(page.getByRole('heading', { name: 'What comes next?' })).toBeVisible();
  const wrong = page.locator('.answerButton').filter({ hasNotText: target }).first();
  await wrong.click();
  await expect(page.getByRole('heading', { name: /chain broken/i })).toBeVisible();
  await expect(page.getByText('YOUR BEST')).toBeVisible();
  await expect(page.locator('.resultStats strong').last()).toHaveText('01');
  await page.reload();
  await expect(page.locator('.previewTop strong')).toHaveText('01');
  await page.getByRole('button', { name: /play now/i }).click();
  await expect(page.locator('.scoreNumber')).toHaveText('00');
});

test('timer expires once and mobile layout does not scroll horizontally', async ({ page, isMobile }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: /play now/i }).click();
  await expect(page.getByRole('timer')).toContainText('12s');
  if (isMobile) {
    const sizes = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
    expect(sizes.page).toBeLessThanOrEqual(sizes.viewport);
    const minHeight = await page.locator('.answerButton').first().evaluate((node) => node.getBoundingClientRect().height);
    expect(minHeight).toBeGreaterThanOrEqual(64);
  }
  await page.clock.runFor(12_001);
  await expect(page.getByText('Time ran out.')).toBeVisible();
  await page.clock.runFor(800);
  await expect(page.getByRole('heading', { name: /chain broken/i })).toBeVisible();
  await expect(page.locator('.resultStats strong').first()).toHaveText('00');
});
