import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshPreferences, parsePreferences } from '../src/model/preferences';

test('preferences reject malformed data and unknown versions', () => {
  for (const raw of [null, '{oops', 'null', '{"version":2}', '[]'])
    assert.deepEqual(parsePreferences(raw), freshPreferences());
});
test('preferences keep onboarding from existing installs and drop old website settings', () => {
  const prefs = parsePreferences('{"version":1,"onboarded":true,"showTips":false,"launchInInbox":true,"desktop":{"instagram":true,"youtube":true,"tiktok":true,"snapchat":true}}');
  assert.deepEqual(prefs, { version: 1, onboarded: true });
  assert.equal(parsePreferences('{"version":1,"onboarded":"yes"}').onboarded, false);
});
