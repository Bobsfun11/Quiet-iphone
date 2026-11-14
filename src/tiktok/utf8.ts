export function encodeUtf8(value: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
  const escaped = encodeURIComponent(value);
  const bytes = escaped.match(/%[0-9A-F]{2}|./g) ?? [];
  return Uint8Array.from(bytes, part => part.startsWith('%') ? parseInt(part.slice(1), 16) : part.charCodeAt(0));
}

export function decodeUtf8(value: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8', { fatal: true }).decode(value);
  return decodeURIComponent(Array.from(value, byte => '%' + byte.toString(16).padStart(2, '0')).join(''));
}
