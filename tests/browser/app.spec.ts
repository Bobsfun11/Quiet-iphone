import { test, expect } from '@playwright/test';

test('welcome, four platform previews, settings persistence and reset all work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my quieter corner' }).click();
  await expect(page.getByRole('heading', { name: /Your people/ })).toBeVisible();
  for (const name of ['Instagram', 'YouTube', 'TikTok', 'Snapchat']) {
    await page.getByRole('button', { name: `Open ${name}`, exact: true }).click();
    await expect(page.getByText('Sample content only. Real sign-ins require the iPhone app.')).toBeVisible();
    const frame = page.frameLocator(`iframe[title="${name} filtering demo"]`);
    await expect(frame.locator('#short-shelf')).toBeHidden();
    await expect(frame.locator('#regular-content')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Quiet home' }).first().click();
  }
  await page.getByRole('button', { name: 'Open settings' }).click();
  const setting = page.getByRole('switch', { name: 'Start with conversations' });
  await setting.check();
  // Wait for the debounced durable write, then verify a completely new mount.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('quiet.preferences.v1'))).toContain('"launchInInbox":true');
  await page.reload();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('switch', { name: 'Start with conversations' })).toBeChecked();
  await page.getByRole('button', { name: 'Reset preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Reset now', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Find my quieter corner' })).toBeVisible();
});

test('home layout fits a phone screen and contains no hidden native-app promises', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my quieter corner' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByText('Browser preview · sample content only')).toBeVisible();
  await expect(page.getByText(/Your original apps stay unchanged/)).toBeVisible();
  await page.screenshot({ path: 'test-results/quiet-home.png', fullPage: true, animations: 'disabled' });
});

test('reduced-motion onboarding and automation instructions work without runtime errors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my quieter corner' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Show automation setup' }).click();
  await expect(page.getByText('quiet-social://open/tiktok?view=inbox', { exact: true })).toBeVisible();
  await expect(page.getByText('quiet-social://open/instagram?view=inbox', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide automation setup' }).click();
  await page.getByRole('button', { name: 'Back to home', exact: true }).click();
  await page.getByRole('button', { name: 'Open YouTube', exact: true }).click();
  await expect(page.getByText('Sample content only. Real sign-ins require the iPhone app.')).toBeVisible();
  expect(errors).toEqual([]);
});
