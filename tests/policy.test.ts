import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationDecision } from '../src/filter/policy';
import { parseFilterMessage } from '../src/filter/bridge';
import { freshPreferences, parsePreferences } from '../src/model/preferences';

test('Instagram blocks Reels but keeps inbox, stories, explore and profiles', () => {
  for (const path of ['/reels/', '/reel/abc/', '/REELS/abc', '/%72eels/abc', '//reels/abc'])
    assert.equal(navigationDecision(`https://www.instagram.com${path}`, 'instagram'), 'block-feed', path);
  for (const path of ['/', '/direct/inbox/', '/stories/friend', '/explore/', '/friend/', '/accounts/login/'])
    assert.equal(navigationDecision(`https://www.instagram.com${path}`, 'instagram'), 'allow', path);
});
test('YouTube blocks Shorts while preserving long videos and subscriptions', () => {
  for (const path of ['/shorts', '/shorts/abc', '/feed/shorts', '/SHORTS/abc'])
    assert.equal(navigationDecision(`https://m.youtube.com${path}`, 'youtube'), 'block-feed');
  for (const path of ['/watch?v=abc', '/feed/subscriptions', '/results?search_query=shorts', '/@creator'])
    assert.equal(navigationDecision(`https://www.youtube.com${path}`, 'youtube'), 'allow');
  assert.equal(navigationDecision('https://youtu.be/regular', 'youtube'), 'allow');
});
test('TikTok blocks video feeds and preserves messaging, login and profile pages', () => {
  for (const path of ['/', '/foryou', '/following', '/explore', '/live', '/@friend/video/123', '/t/abc'])
    assert.equal(navigationDecision(`https://www.tiktok.com${path}`, 'tiktok'), 'block-feed', path);
  for (const path of ['/messages', '/login', '/@friend', '/settings'])
    assert.equal(navigationDecision(`https://www.tiktok.com${path}`, 'tiktok'), 'allow');
});
test('Snapchat hides Spotlight but keeps web chat and authentication routes', () => {
  assert.equal(navigationDecision('https://www.snapchat.com/spotlight/abc', 'snapchat'), 'block-feed');
  assert.equal(navigationDecision('https://web.snapchat.com/', 'snapchat'), 'allow');
  assert.equal(navigationDecision('https://accounts.snapchat.com/accounts/login', 'snapchat'), 'allow');
});
test('authentication hosts are allowed; lookalikes and other websites are external', () => {
  assert.equal(navigationDecision('https://accounts.google.com/ServiceLogin', 'youtube'), 'allow');
  for (const url of ['https://instagram.com.evil.example/reels/', 'https://fakeinstagram.com/', 'https://example.org/'])
    assert.equal(navigationDecision(url, 'instagram'), 'external');
});
test('unsafe navigation and app schemes are rejected', () => {
  for (const url of ['http://www.instagram.com/', 'instagram://reels', 'javascript:alert(1)', 'file:///tmp/file', 'data:text/html,test', 'intent://instagram', 'invalid', 'https://user:pass@instagram.com/'])
    assert.equal(navigationDecision(url, 'instagram'), 'deny');
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
test('preferences hydrate individual fields safely without sharing default state', () => {
  const prefs = parsePreferences('{"version":1,"onboarded":true,"showTips":false,"desktop":{"instagram":true,"youtube":"no"}}');
  assert.equal(prefs.onboarded, true); assert.equal(prefs.showTips, false);
  assert.equal(prefs.desktop.instagram, true); assert.equal(prefs.desktop.youtube, false);
  prefs.desktop.snapchat = false;
  assert.equal(freshPreferences().desktop.snapchat, true);
});
