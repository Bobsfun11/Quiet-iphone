import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationDecision } from '../src/filter/policy';
import { parseFilterMessage } from '../src/filter/bridge';
import { freshPreferences, parsePreferences } from '../src/model/preferences';

test('YouTube blocks Shorts while preserving long videos and subscriptions', () => {
  for (const path of ['/shorts', '/shorts/abc', '/feed/shorts', '/SHORTS/abc'])
    assert.equal(navigationDecision(`https://m.youtube.com${path}`, 'youtube'), 'block-feed');
  for (const path of ['/watch?v=abc', '/feed/subscriptions', '/results?search_query=shorts', '/@creator'])
    assert.equal(navigationDecision(`https://www.youtube.com${path}`, 'youtube'), 'allow');
  assert.equal(navigationDecision('https://youtu.be/regular', 'youtube'), 'allow');
});
test('authentication hosts are allowed; lookalikes and other websites are external', () => {
  assert.equal(navigationDecision('https://accounts.google.com/ServiceLogin', 'youtube'), 'allow');
  for (const url of [
    'https://youtube.com.evil.example/shorts/', 'https://fakeyoutube.com/', 'https://example.org/',
    'https://www.instagram.com/direct/inbox/', 'https://www.tiktok.com/messages', 'https://web.snapchat.com/',
  ]) assert.equal(navigationDecision(url, 'youtube'), 'external');
});
test('unsafe navigation and app schemes are rejected', () => {
  for (const url of ['http://www.youtube.com/', 'youtube://shorts', 'javascript:alert(1)', 'file:///tmp/file', 'data:text/html,test', 'intent://youtube', 'invalid', 'https://user:pass@youtube.com/'])
    assert.equal(navigationDecision(url, 'youtube'), 'deny');
});
test('message bridge only accepts bounded status events', () => {
  assert.deepEqual(parseFilterMessage('{"channel":"quiet-v1","type":"ready"}'), { type: 'ready' });
  assert.deepEqual(parseFilterMessage('{"channel":"quiet-v1","type":"hidden","count":4}'), { type: 'hidden', count: 4 });
  for (const raw of ['oops', 'null', '{"type":"ready"}', '{"channel":"quiet-v1","type":"navigate","url":"https://example.com"}', '{"channel":"quiet-v1","type":"hidden","count":-1}', 'x'.repeat(161)])
    assert.equal(parseFilterMessage(raw), null);
});
test('preferences reject malformed data and unknown versions', () => {
  for (const raw of [null, '{oops', 'null', '{"version":2}', '[]'])
    assert.deepEqual(parsePreferences(raw), freshPreferences());
});
test('preferences keep YouTube and onboarding settings from existing installs', () => {
  const prefs = parsePreferences('{"version":1,"onboarded":true,"showTips":false,"launchInInbox":true,"desktop":{"instagram":true,"youtube":true,"tiktok":true,"snapchat":true}}');
  assert.deepEqual(prefs, { version: 1, onboarded: true, launchInInbox: true, desktop: { youtube: true } });
  assert.equal(parsePreferences('{"version":1,"desktop":{"youtube":"yes"}}').desktop.youtube, false);
  const fresh = freshPreferences();
  fresh.desktop.youtube = true;
  assert.equal(freshPreferences().desktop.youtube, false);
});
