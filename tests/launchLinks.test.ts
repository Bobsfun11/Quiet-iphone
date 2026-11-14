import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuietLaunch, quietLaunchURL } from '../src/model/launchLinks';
import { PLATFORMS } from '../src/model/platforms';

test('each Shortcut link opens exactly its intended platform', () => {
  for (const platform of PLATFORMS) {
    const url = quietLaunchURL(platform.id);
    assert.deepEqual(parseQuietLaunch(url), { platform: platform.id });
    assert.deepEqual(parseQuietLaunch(`${url}?view=inbox`), { platform: platform.id });
    assert.deepEqual(parseQuietLaunch(`${url}?view=home`), { platform: platform.id });
  }
});
test('Shortcuts accept only supported inbox routes', () => {
  for (const url of [
    'quiet-social://open/instagram?url=https://evil.example',
    'quiet-social://open/instagram?filter=off',
    'quiet-social://open/tiktok?view=feed',
    'quiet-social://open/tiktok?view=inbox&view=home',
    'quiet-social://open/instagram#untrusted',
    'quiet-social://open/not-a-platform',
    'quiet-social://open/instagram/extra',
    'https://open/tiktok',
    'quiet-social://evil.example/instagram',
    'quiet-social://user:password@open/tiktok',
    null, '', 'invalid', 'a'.repeat(161),
  ]) assert.equal(parseQuietLaunch(url), null, String(url));
});

test('automations for YouTube and Snapchat no longer select a screen', () => {
  for (const platform of ['youtube', 'snapchat']) {
    assert.equal(parseQuietLaunch(`quiet-social://open/${platform}`), null);
    assert.equal(parseQuietLaunch(`quiet-social://open/${platform}?view=inbox`), null);
  }
});
