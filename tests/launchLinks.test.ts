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
    'quiet-social://open/tiktok?url=https://evil.example',
    'quiet-social://open/tiktok?filter=off',
    'quiet-social://open/tiktok?view=feed',
    'quiet-social://open/tiktok?view=inbox&view=home',
    'quiet-social://open/tiktok#untrusted',
    'quiet-social://open/not-a-platform',
    'quiet-social://open/tiktok/extra',
    'https://open/tiktok',
    'quiet-social://evil.example/tiktok',
    'quiet-social://user:password@open/tiktok',
    null, '', 'invalid', 'a'.repeat(161),
  ]) assert.equal(parseQuietLaunch(url), null, String(url));
});
