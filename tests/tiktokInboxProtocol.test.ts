import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeConversations, decodeHistory } from '../src/tiktok/inboxProtocol';

test('TikTok inbox responses preserve 64-bit IDs and restrict history to the requested conversation', () => {
  const inbox = Buffer.from('08cb0118003231da0c2e122c10ffffffffffffffffff010a07303a313a313a32180258049203112a0f54696b72c5b320706f6b616c626973', 'hex');
  assert.deepEqual(decodeConversations(inbox), [{
    id: '0:1:1:2', shortId: 18446744073709551615n, isGroup: true, unread: true, name: 'Tikrų pokalbis',
  }]);
  const messages = Buffer.from('08ad0218003251ea124e0a350a07303a313a313a3218ffffffffffffffffff01389582a6efc79e84911142157b2274657874223a224c6162617320f09f8cbf227d0a150a07303a313a333a3418023804420668696464656e', 'hex');
  assert.deepEqual(decodeHistory(messages, '0:1:1:2'), [{
    id: '18446744073709551615', senderId: '1234567890123456789', text: 'Labas 🌿',
  }]);
  assert.throws(() => decodeConversations(inbox.subarray(0, -1)), /incomplete field/);
  assert.throws(() => decodeConversations(Buffer.from('08cb0118c59a0c', 'hex')), /status 200005/);
});
