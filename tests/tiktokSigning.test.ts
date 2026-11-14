import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signTikTokQrQuery } from '../src/tiktok/signing';

const fixture = {
  userAgent: 'Quiet compatibility check',
  timestampSeconds: 1794630400,
  dynosaur: { timestampMicrosLow: 3155123000, keyWords: Array.from({ length: 12 }, (_, i) => 0xffffffff - i * 90131) },
  gnarly: { timestampMicrosLow: 3155123741, keyWords: Uint32Array.from({ length: 12 }, (_, i) => i * 1381541 + 7) },
};

test('experimental TikTok query signatures match the pinned Python reference', () => {
  const vectors = [
    { query: 'aid=1459&device_platform=web&lang=en&next=%2Fmessages%2F&msToken=', body: '', requestCount: 2,
      sha256: '570fc0464173e22d25c822fdbd963cb66faf962c1277addcfd557a4a9710f68c' },
    { query: 'aid=1459&region=LT&lang=en', body: '{"message":"Labas 🌿"}', requestCount: 19,
      sha256: 'c1709b9d67e6660fd8ac07ae205923de2677086f24f6079361dcd7b764165a62' },
  ];
  for (const { sha256, ...input } of vectors) {
    const signed = signTikTokQrQuery({ ...fixture, ...input });
    assert.equal(createHash('sha256').update(signed).digest('hex'), sha256);
  }
});
