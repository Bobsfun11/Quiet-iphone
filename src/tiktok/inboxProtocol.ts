// Experimental wire format adapted from the ReLttk inbox and history requests.
// See UPSTREAM-LICENSE.txt. This module makes no network requests.

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const maxFrameBytes = 4 * 1024 * 1024;

type Field = bigint | Uint8Array;
type Fields = Map<number, Field[]>;

export type TikTokInboxContext = {
  deviceId: string;
  region: string;
  locale: string;
  timeZone: string;
  userAgent: string;
  verificationId: string;
  msToken: string;
};

export type TikTokConversation = {
  id: string;
  shortId?: bigint;
  name: string;
  isGroup: boolean;
  unread: boolean;
};

export type TikTokHistoryMessage = { id: string; senderId: string; text?: string };

function varint(value: bigint): number[] {
  if (value < 0n || value > 0xffffffffffffffffn) throw new Error('TikTok field is outside the unsigned 64-bit range.');
  const bytes: number[] = [];
  while (value >= 128n) {
    bytes.push(Number(value & 127n) | 128);
    value >>= 7n;
  }
  bytes.push(Number(value));
  return bytes;
}

function int(field: number, value: number | bigint) {
  return [...varint(BigInt(field << 3)), ...varint(BigInt(value))];
}

function bytes(field: number, value: Iterable<number> & { length: number }) {
  return [...varint(BigInt((field << 3) | 2)), ...varint(BigInt(value.length)), ...value];
}

function string(field: number, value: string) {
  return bytes(field, encoder.encode(value));
}

function request(command: 203 | 301, sequence: number, payload: number[], context: TikTokInboxContext) {
  const { deviceId, region, locale, timeZone, userAgent, verificationId, msToken } = context;
  const metadata = {
    aid: '1988', app_name: 'tiktok_web', channel: 'web', device_platform: 'web_pc',
    device_id: deviceId, region, priority_region: region, os: 'windows',
    referer: 'https://www.tiktok.com/messages', root_referer: '', cookie_enabled: 'true',
    screen_width: '1920', screen_height: '1080', browser_language: locale, browser_platform: 'Win32',
    browser_name: 'Mozilla', browser_version: userAgent.replace('Mozilla/', ''), browser_online: 'true',
    verifyFp: verificationId, app_language: locale, webcast_language: locale, tz_name: timeZone,
    is_page_visible: 'true', focus_state: 'true', is_fullscreen: 'false', history_len: '2',
    user_is_login: 'true', data_collection_enabled: 'true', from_appID: '1988', locale,
    user_agent: userAgent, 'Web-Sdk-Ms-Token': msToken,
  };
  return Uint8Array.from([
    ...int(1, command), ...int(2, sequence), ...string(3, '1.7.0'), ...string(4, ''),
    ...int(5, 3), ...int(6, command === 203 ? 1 : 0), ...string(7, '3035f17:feat/call-trace-plugin'),
    ...bytes(8, bytes(command, payload)), ...string(9, deviceId), ...string(11, 'web'),
    ...Object.entries(metadata).flatMap(([key, value]) => bytes(15, [...string(1, key), ...string(2, value)])),
    ...int(18, 1),
  ]);
}

export function conversationRequest(context: TikTokInboxContext) {
  return request(203, 10002, int(1, 0), context);
}

export function historyRequest(context: TikTokInboxContext, conversation: TikTokConversation, cursor = 0n) {
  return request(301, 10011, [
    ...string(1, conversation.id), ...int(2, 1), ...int(3, conversation.shortId ?? 0n),
    ...int(4, 1), ...int(5, cursor), ...int(6, 30),
  ], context);
}

function decode(input: Uint8Array): Fields {
  if (input.length > maxFrameBytes) throw new Error('TikTok response exceeds the inbox size limit.');
  const fields: Fields = new Map();
  let offset = 0;
  function readVarint() {
    let value = 0n;
    for (let shift = 0n; shift <= 63n && offset < input.length; shift += 7n) {
      const byte = input[offset++];
      if (shift === 63n && byte > 1) break;
      value |= BigInt(byte & 127) << shift;
      if (byte < 128) return value;
    }
    throw new Error('TikTok returned a malformed integer.');
  }
  while (offset < input.length) {
    const key = readVarint();
    const number = Number(key >> 3n);
    const kind = Number(key & 7n);
    if (number === 0 || number >= 2 ** 29) throw new Error('TikTok returned a malformed field.');
    let field: Field;
    if (kind === 0) {
      field = readVarint();
    } else {
      const size = kind === 2 ? Number(readVarint()) : kind === 1 ? 8 : kind === 5 ? 4 : -1;
      if (size < 0 || size > input.length - offset) throw new Error('TikTok returned an incomplete field.');
      field = input.subarray(offset, offset + size);
      offset += size;
      if (kind !== 2) continue;
    }
    const values = fields.get(number);
    if (values) values.push(field);
    else fields.set(number, [field]);
  }
  return fields;
}

function children(fields: Fields, number: number) {
  return (fields.get(number) ?? []).flatMap(field => field instanceof Uint8Array ? [decode(field)] : []);
}

function number(fields: Fields, field: number): bigint | undefined {
  const value = fields.get(field)?.[0];
  return typeof value === 'bigint' ? value : undefined;
}

function text(fields: Fields, field: number): string | undefined {
  const value = fields.get(field)?.[0];
  return value instanceof Uint8Array ? decoder.decode(value) : undefined;
}

function response(input: Uint8Array, command: 203 | 301) {
  const fields = decode(input);
  const status = number(fields, 3);
  if (status !== undefined && status !== 0n) throw new Error(`TikTok messaging returned status ${status}.`);
  if (number(fields, 1) !== BigInt(command)) throw new Error('TikTok response does not match the requested inbox operation.');
  const payload = children(fields, 6).flatMap(body => children(body, command))[0];
  if (!payload) throw new Error('TikTok returned no inbox payload.');
  return payload;
}

export function decodeConversations(input: Uint8Array): TikTokConversation[] {
  return children(response(input, 203), 2).flatMap(conversation => {
    const id = text(conversation, 1);
    if (!id) return [];
    const details = children(conversation, 50)[0];
    return [{ id, shortId: number(conversation, 2), name: (details && text(details, 5)) || 'TikTok conversation',
      isGroup: number(conversation, 3) === 2n, unread: (number(conversation, 11) ?? 0n) > 0n }];
  });
}

export function decodeHistory(input: Uint8Array, conversationId: string): TikTokHistoryMessage[] {
  return children(response(input, 301), 1).flatMap(message => {
    if (text(message, 1) !== conversationId) return [];
    const id = number(message, 3);
    const senderId = number(message, 7);
    if (id === undefined || senderId === undefined) return [];
    const content = text(message, 8);
    let body: string | undefined;
    if (content) {
      try {
        const item: unknown = JSON.parse(content);
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') body = item.text;
      } catch {
        body = content;
      }
    }
    return [{ id: id.toString(), senderId: senderId.toString(), text: body }];
  });
}
