import { test, expect } from '@playwright/test';

test('the two inboxes show their unavailable state and onboarding can be reset', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your inboxes.' })).toBeVisible();
  for (const platform of ['Instagram', 'TikTok']) {
    await page.getByRole('button', { name: `Open ${platform} inbox`, exact: true }).click();
    await expect(page.getByRole('heading', { name: platform, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Messaging unavailable' })).toBeVisible();
    await expect(page.getByRole('button', { name: /connect|sign in|log in/i })).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.getByRole('button', { name: 'Back to Quiet home' }).click();
  }

  await expect.poll(() => page.evaluate(() => localStorage.getItem('quiet.preferences.v1'))).toContain('"onboarded":true');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your inboxes.' })).toBeVisible();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Reset preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Reset now', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
});

test('home fits a phone screen and shows only Instagram and TikTok', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByText('Interface preview')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Instagram inbox', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open TikTok inbox', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /open (youtube|snapchat)/i })).toHaveCount(0);
});

test('reduced-motion onboarding, inbox navigation and shortcut instructions work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Show automation setup' }).click();
  await expect(page.getByText('quiet-social://open/instagram', { exact: true })).toBeVisible();
  await expect(page.getByText('quiet-social://open/tiktok', { exact: true })).toBeVisible();
  await expect(page.getByText('quiet-social://open/youtube', { exact: true })).toHaveCount(0);
  await expect(page.getByText('quiet-social://open/snapchat', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Hide automation setup' }).click();
  await page.getByRole('button', { name: 'Back to home', exact: true }).click();
  await page.getByRole('button', { name: 'Open TikTok inbox', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Messaging unavailable' })).toBeVisible();
  expect(errors).toEqual([]);
});
