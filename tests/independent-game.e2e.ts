import { expect, test } from '@playwright/test';

test('unique numeric continuation increments once, wrong answer ends run, replay resets', { tag: '@functional' }, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { Math.random = () => 0.3; });
  await page.getByRole('button', { name: /play now/i }).click();
  // The ol loses its list role under the app's list-style CSS in Chromium.
  const sequence = page.locator('ol[aria-label="Sequence to complete"]');
  await expect(sequence.locator('li')).toHaveCount(5);
  await expect(page.getByLabel('Missing next term')).toBeVisible();
  const choices = page.getByRole('group', { name: 'Answer choices' }).getByRole('button');
  await expect(choices).toHaveCount(3);
  const labels = await choices.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  expect(new Set(labels).size).toBe(3);
  await page.getByRole('button', { name: /, 9, number 9/ }).click();
  await expect(page.getByRole('status')).toContainText('Chain 1');
  await expect(page.getByRole('complementary', { name: 'Run status' })).toContainText('01');
  await expect(page.getByRole('heading', { name: 'What comes next?' })).toBeVisible();
  const nextChoices = page.getByRole('group', { name: 'Answer choices' }).getByRole('button');
  const nextSequence = await sequence.locator('li').first().getAttribute('aria-label');
  const wrong = nextChoices.filter({ hasNotText: nextSequence?.split(',')[0] ?? 'never' }).first();
  await wrong.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Chain broken at 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /chain broken/i })).toBeVisible();
  await expect(page.getByText('YOUR BEST')).toBeVisible();
  await page.getByRole('button', { name: /play again/i }).click();
  await expect(page.getByRole('complementary', { name: 'Run status' })).toContainText('00');
  await expect(page.getByRole('timer')).toContainText('12s');
});

test('timeout is a failure and retains prior local best', { tag: '@sanity' }, async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: /play now/i }).click();
  await expect(page.getByRole('timer')).toContainText('12s');
  await page.clock.runFor(12_100);
  await expect(page.getByRole('alert').filter({ hasText: 'Time ran out' })).toBeVisible();
  await page.clock.runFor(800);
  await expect(page.getByText('Time ran out before your answer.')).toBeVisible();
  await expect(page.getByText('YOUR CHAIN')).toBeVisible();
});

test('reload retains browser-local best and mobile has no horizontal overflow', { tag: '@regression' }, async ({ page, isMobile }) => {
  await page.addInitScript(() => localStorage.setItem('dbc.bestChain.v1', '7'));
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Your best chain' })).toContainText('07');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Your best chain' })).toContainText('07');
  if (isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name: /play now/i }).click();
  await expect(page.getByRole('timer')).toBeVisible();
});
