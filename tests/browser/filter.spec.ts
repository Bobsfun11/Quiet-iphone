import { test, expect } from '@playwright/test';
import { PLATFORMS } from '../../src/model/platforms';
import { demoHTML } from '../../src/filter/fixtures';
import { buildFilterScript } from '../../src/filter/script';

for (const platform of PLATFORMS) {
  test(`${platform.name}: hides short feeds and preserves normal content, profiles and login`, async ({ page }) => {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML(platform.id) }));
    await page.addInitScript({ content: buildFilterScript(platform.id) });
    await page.goto(platform.home);
    await expect(page.locator('#short-link')).toBeHidden();
    await expect(page.locator('#short-shelf')).toBeHidden();
    await expect(page.locator('#normal-link')).toBeVisible();
    await expect(page.locator('#profile-link')).toBeVisible();
    await expect(page.locator('#regular-content')).toBeVisible();
    await expect(page.locator('#regular-video')).toBeVisible();
    await page.locator('#email').fill('sample@example.test');
    await page.locator('#password').fill('not-a-real-password');
    await expect(page.locator('#email')).toHaveValue('sample@example.test');
    await expect(page.locator('#password')).toHaveValue('not-a-real-password');
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  });
}

test('YouTube: filters dynamically added shelves and changed navigation URLs', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('youtube') }));
  await page.addInitScript({ content: buildFilterScript('youtube') });
  await page.goto('https://m.youtube.com/');
  await page.evaluate(() => {
    const shelf = document.createElement('ytm-reel-shelf-renderer');
    shelf.id = 'lazy-shelf'; shelf.textContent = 'Late Shorts recommendations'; document.body.appendChild(shelf);
    document.getElementById('normal-link')!.setAttribute('href', '/shorts/late');
  });
  await expect(page.locator('#lazy-shelf')).toBeHidden();
  await expect(page.locator('#normal-link')).toBeHidden();
});

test('YouTube: intercepts client-side feed navigation and safely dismisses the guard', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('youtube') }));
  await page.addInitScript({ content: buildFilterScript('youtube') });
  await page.goto('https://m.youtube.com/');
  await page.evaluate(() => history.pushState({}, '', '/shorts/attempt'));
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
  await page.getByRole('button', { name: 'Back to what matters' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => history.pushState({}, '', '/watch?v=regular'));
  expect(new URL(page.url()).pathname).toBe('/watch');
});

test('Instagram: blocks unstyled direct Reel links without preventing messages', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('instagram') }));
  await page.addInitScript({ content: buildFilterScript('instagram') });
  await page.goto('https://www.instagram.com/direct/inbox/');
  await page.evaluate(() => {
    const link = document.createElement('a'); link.href = '/REEL/direct'; link.id = 'direct-reel'; link.textContent = 'A shared reel'; document.body.appendChild(link);
  });
  // The capture listener also protects links activated before a scan or by
  // website code, even when the link is already hidden by route semantics.
  await page.locator('#direct-reel').evaluate(element => (element as HTMLAnchorElement).click());
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/direct/inbox/');
  await page.getByRole('button', { name: 'Back to what matters' }).click();
  await expect(page.locator('#normal-link')).toBeVisible();
});

test('absolute and encoded short-video links are hidden regardless of their label', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('youtube') }));
  await page.addInitScript({ content: buildFilterScript('youtube') });
  await page.goto('https://m.youtube.com/');
  await page.evaluate(() => {
    for (const [id, href] of [['absolute', 'https://www.youtube.com/SHORTS/abc'], ['encoded', '/%73horts/abc']]) {
      const link = document.createElement('a'); link.id = id; link.href = href; link.textContent = '動画'; document.body.appendChild(link);
    }
  });
  await expect(page.locator('#absolute')).toBeHidden();
  await expect(page.locator('#encoded')).toBeHidden();
  await expect(page.locator('#profile-link')).toBeVisible();
});

test('initial blocked routes are covered and hidden media cannot keep playing', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('youtube') }));
  await page.addInitScript({ content: buildFilterScript('youtube') });
  await page.goto('https://m.youtube.com/shorts/initial');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Back to what matters' }).click();
  await expect(page).toHaveURL('https://m.youtube.com/');
  await page.evaluate(() => {
    const video = document.querySelector('#short-media') as HTMLVideoElement;
    let paused = false;
    video.pause = () => { paused = true; };
    video.dispatchEvent(new Event('play', { bubbles: true }));
    document.body.dataset.mediaPaused = String(paused);
  });
  await expect(page.locator('body')).toHaveAttribute('data-media-paused', 'true');
});

test('filter is not injected on authentication or unrelated origins', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('youtube') }));
  await page.addInitScript({ content: buildFilterScript('youtube') });
  for (const origin of ['https://accounts.google.com', 'https://youtube.com.evil.example']) {
    await page.goto(origin);
    await expect(page.locator('#short-shelf')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('quiet-filter-css'))).toBeNull();
  }
});

test('reinjection stays idempotent and website DOM replacement reinstalls filters', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: demoHTML('youtube') }));
  await page.addInitScript({ content: buildFilterScript('youtube') });
  await page.goto('https://m.youtube.com/');
  await page.evaluate(buildFilterScript('youtube'));
  expect(await page.locator('#quiet-filter-css').count()).toBe(1);
  await page.evaluate(() => document.getElementById('quiet-filter-css')?.remove());
  await expect(page.locator('#quiet-filter-css')).toHaveCount(1);
});
