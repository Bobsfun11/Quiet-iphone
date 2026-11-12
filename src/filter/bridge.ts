export type FilterMessage = { type: 'ready' } | { type: 'feed-blocked' } | { type: 'hidden'; count: number };

// No page text, credentials, cookies, account names or URLs are accepted by the bridge.
export function parseFilterMessage(raw: string): FilterMessage | null {
  if (raw.length > 160) return null;
  try {
    const message = JSON.parse(raw);
    if (!message || message.channel !== 'quiet-v1') return null;
    if (message.type === 'ready') return { type: 'ready' };
    if (message.type === 'feed-blocked') return { type: 'feed-blocked' };
    if (message.type === 'hidden' && Number.isSafeInteger(message.count) && message.count > 0 && message.count <= 10000)
      return { type: 'hidden', count: message.count };
  } catch { /* Untrusted website messages are ignored. */ }
  return null;
}
