import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuietLaunch, quietLaunchURL } from '../src/model/launchLinks';
import { PLATFORMS } from '../src/model/platforms';

test('each Shortcut link opens exactly its intended platform', () => {
  for (const platform of PLATFORMS) {
    assert.deepEqual(parseQuietLaunch(quietLaunchURL(platform.id)), { platform: platform.id, inbox: false });
    assert.deepEqual(parseQuietLaunch(quietLaunchURL(platform.id, true)), { platform: platform.id, inbox: true });
  }
});
test('Shortcuts cannot inject website URLs or disable feed protection', () => {
  for (const url of [
    'quiet-social://open/youtube?url=https://evil.example',
    'quiet-social://open/youtube?filter=off',
    'quiet-social://open/youtube?view=feed',
    'quiet-social://open/youtube?view=inbox&view=home',
    'quiet-social://open/youtube#untrusted',
    'quiet-social://open/not-a-platform',
    'quiet-social://open/youtube/extra',
    'https://open/youtube',
    'quiet-social://evil.example/youtube',
    'quiet-social://user:password@open/youtube',
    null, '', 'invalid', 'a'.repeat(161),
  ]) assert.equal(parseQuietLaunch(url), null, String(url));
});

test('automations for removed platforms cannot open a website', () => {
  for (const platform of ['instagram', 'tiktok', 'snapchat']) {
    assert.equal(parseQuietLaunch(`quiet-social://open/${platform}`), null);
    assert.equal(parseQuietLaunch(`quiet-social://open/${platform}?view=inbox`), null);
  }
});
