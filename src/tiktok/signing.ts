// Experimental port of the TikTok v5.3.2 web signing format. See UPSTREAM-LICENSE.txt.

type SigningMaterial = {
  /** The low 32 bits of the Unix timestamp in microseconds. */
  timestampMicrosLow: number;
  /** Twelve unsigned 32-bit words from the caller's secure random source. */
  keyWords: readonly number[] | Uint32Array;
};

type SigningInput = {
  /** The original URL-encoded query, without a leading question mark. */
  query: string;
  body?: string;
  userAgent: string;
  timestampSeconds: number;
  requestCount: number;
  dynosaur: SigningMaterial;
  gnarly: SigningMaterial;
};

const encoder = new TextEncoder();
const version = '5.3.2';
const sdkVersion = '2.0.0.561';
const environmentCode = 1;
const userBehaviorCode = 8;
const canvasValue = 411533585;
const chachaConstants = [1196819126, 600974999, 3863347763, 1451689750];
const columnQuarters = [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]] as const;
const diagonalQuarters = [[0, 5, 10, 15], [1, 6, 11, 12], [2, 7, 8, 13], [3, 4, 9, 14]] as const;
const base64Alphabet = 'u09tbS3UvgDEe6r-ZVMXzLpsAohTn7mdINQlW412GqBjfYiyk8JORCF5/xKHwacP';
const md5Constants = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32));
const md5Shifts = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]];

function rotateLeft(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

function md5Hex(text: string): string {
  // The legacy protocol requires MD5 as a field checksum.
  const input = encoder.encode(text);
  const bytes = new Uint8Array(Math.ceil((input.length + 9) / 64) * 64);
  bytes.set(input);
  bytes[input.length] = 0x80;
  const data = new DataView(bytes.buffer);
  data.setUint32(bytes.length - 8, input.length * 8, true);
  data.setUint32(bytes.length - 4, Math.floor(input.length / 2 ** 29), true);
  let state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  for (let offset = 0; offset < bytes.length; offset += 64) {
    let [a, b, c, d] = state;
    for (let index = 0; index < 64; index += 1) {
      const round = index >>> 4;
      let mixed: number;
      let word: number;
      switch (round) {
        case 0:
          mixed = (b & c) | (~b & d);
          word = index;
          break;
        case 1:
          mixed = (d & b) | (~d & c);
          word = (5 * index + 1) % 16;
          break;
        case 2:
          mixed = b ^ c ^ d;
          word = (3 * index + 5) % 16;
          break;
        default:
          mixed = c ^ (b | ~d);
          word = (7 * index) % 16;
      }
      const value = a + mixed + md5Constants[index] + data.getUint32(offset + word * 4, true);
      [a, b, c, d] = [d, (b + rotateLeft(value, md5Shifts[round][index % 4])) | 0, b, c];
    }
    state = state.map((value, index) => (value + [a, b, c, d][index]) | 0);
  }

  return Array.from(littleEndianWords(state), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function littleEndianWords(words: readonly number[] | Uint32Array): Uint8Array {
  const bytes = new Uint8Array(words.length * 4);
  const view = new DataView(bytes.buffer);
  words.forEach((word, index) => view.setUint32(index * 4, word, true));
  return bytes;
}

function chachaQuarter(words: Uint32Array, a: number, b: number, c: number, d: number): void {
  words[a] += words[b];
  words[d] = rotateLeft(words[d] ^ words[a], 16);
  words[c] += words[d];
  words[b] = rotateLeft(words[b] ^ words[c], 12);
  words[a] += words[b];
  words[d] = rotateLeft(words[d] ^ words[a], 8);
  words[c] += words[d];
  words[b] = rotateLeft(words[b] ^ words[c], 7);
}

function encipher(payload: Uint8Array, keyWords: SigningMaterial['keyWords']): Uint8Array {
  const state = Uint32Array.from([...chachaConstants, ...keyWords]);
  let lowBits = 0;
  for (const word of keyWords) lowBits += word & 15;
  const rounds = 5 + (lowBits & 15);
  const result = new Uint8Array(payload.length);

  for (let offset = 0; offset < payload.length; offset += 64) {
    const words = state.slice();
    for (let round = 0; round < rounds; round += 1) {
      const quarters = round % 2 === 0 ? columnQuarters : diagonalQuarters;
      for (const [a, b, c, d] of quarters) chachaQuarter(words, a, b, c, d);
    }
    const stream = littleEndianWords(words.map((word, index) => word + state[index]));
    for (let index = 0; index < Math.min(64, payload.length - offset); index += 1) {
      result[offset + index] = payload[offset + index] ^ stream[index];
    }
    state[12] += 1;
  }

  return result;
}

function encodeBase64(bytes: Uint8Array): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    output += base64Alphabet[a >>> 2];
    output += base64Alphabet[((a & 3) << 4) | (b >>> 4)];
    output += index + 1 < bytes.length ? base64Alphabet[((b & 15) << 2) | (c >>> 6)] : '=';
    output += index + 2 < bytes.length ? base64Alphabet[c & 63] : '=';
  }
  return output;
}

function signPayload(header: number, payload: Uint8Array, keyWords: SigningMaterial['keyWords']): string {
  const key = littleEndianWords(keyWords);
  const encrypted = encipher(payload, keyWords);
  // The wire format inserts the key among the encrypted bytes at a checksum-derived offset.
  const byteSum = encrypted.reduce((sum, byte) => sum + byte, 0) + key.reduce((sum, byte) => sum + byte, 0);
  const position = byteSum % (encrypted.length + 1);
  const result = new Uint8Array(1 + key.length + encrypted.length);
  result[0] = header;
  result.set(encrypted.subarray(0, position), 1);
  result.set(key, 1 + position);
  result.set(encrypted.subarray(position), 1 + position + key.length);
  return encodeBase64(result);
}

function bigEndian(value: number, length: 2 | 4): number[] {
  return length === 2 ? [(value >>> 8) & 255, value & 255] : [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function encodeInteger(value: number): number[] {
  return bigEndian(value, value < 0xfe01 ? 2 : 4);
}

function timestampCheck(timestampSeconds: number, timestampMicrosLow: number): number {
  const halves = (timestampSeconds >>> 16) ^ (timestampMicrosLow >>> 16) ^ (timestampSeconds & 0xffff) ^ (timestampMicrosLow & 0xffff);
  return (environmentCode << 16) | halves;
}

function dynosaurText(value: string | number, checksum = false): number[] {
  const text = String(value);
  const bytes = Array.from({ length: Math.max(text.length, 4) }, (_, index) => {
    if (index >= text.length) return 0xdd + index;
    const character = text.charCodeAt(index);
    if (checksum) {
      const shifted = (((character ^ (102 + index)) + (index & 0xaa)) ^ 0xa5) << 1;
      return ((shifted + (shifted >>> 8)) & 255) ^ 0xbb;
    }
    const shifted = ((character ^ (103 + index)) + (index & 0xaa) + 1) << 2;
    return ((((shifted + (shifted >>> 8)) & 255) ^ 0xbb) + 1) & 255;
  });
  return [...bytes, ...bigEndian(text.length, 2)];
}

function dynosaurHash(text: string): number[] {
  let hash = 2166136260;
  for (const byte of encoder.encode(text)) hash = Math.imul(Math.imul(hash ^ byte, 16777619), 33);
  return bigEndian(hash, 4);
}

function signDynosaur(query: string, body: string, input: SigningInput): string {
  const { timestampSeconds, requestCount, userAgent, dynosaur } = input;
  const { timestampMicrosLow, keyWords } = dynosaur;
  const fixedField = [94, 222, 223, 224, 0, 1];
  const bodyHash = dynosaurHash(body);
  const fields = [
    fixedField, fixedField, fixedField, dynosaurText(0),
    dynosaurText(timestampCheck(timestampSeconds, timestampMicrosLow)), dynosaurText(requestCount),
    dynosaurText(environmentCode), dynosaurText(timestampSeconds), dynosaurText(0), dynosaurText(0),
    dynosaurText(version), bodyHash, dynosaurText(canvasValue), dynosaurText(0), dynosaurHash(query),
    dynosaurText(requestCount), dynosaurHash(userAgent), dynosaurText(sdkVersion), dynosaurText(0),
    dynosaurText(0), dynosaurText(timestampMicrosLow), dynosaurText(0), dynosaurText(userBehaviorCode),
    dynosaurText(0), bodyHash,
  ];
  fields[0] = dynosaurText(fields.reduce((sum, field) => sum ^ field[1], 0), true);
  const payload = Uint8Array.from(fields.flatMap((field, index) => [32 + index, ...encodeInteger(field.length), ...field]));
  return signPayload(0x4b, payload, keyWords);
}

function signGnarly(query: string, body: string, input: SigningInput): string {
  const { timestampSeconds, requestCount, userAgent, gnarly } = input;
  const { timestampMicrosLow, keyWords } = gnarly;
  const fields = [
    0, environmentCode, userBehaviorCode, md5Hex(query), md5Hex(body), md5Hex(userAgent),
    timestampSeconds, canvasValue, timestampMicrosLow, version, sdkVersion, 1, requestCount, requestCount,
    timestampCheck(timestampSeconds, timestampMicrosLow),
    ((((canvasValue & 0xffff) ^ (timestampMicrosLow >>> 16)) << 16) | ((timestampSeconds ^ timestampMicrosLow) & 0xffff)) >>> 0,
  ];
  const textOrNumber = (field: string | number) => typeof field === 'number'
    ? field
    : encoder.encode(field).subarray(0, 4).reduce((value, byte) => (value << 8) | byte, 0);
  const fullChecksum = fields.reduce<number>((checksum, field) => checksum ^ textOrNumber(field), 0);
  fields.push(fullChecksum >>> 0);
  fields[0] = fields.reduce<number>((checksum, field) => typeof field === 'number' ? checksum ^ field : checksum, 0) >>> 0;

  // Version 5.3.2 counts field 16 but only serializes its contribution to field 0.
  const order = [0, 12, 15, 13, 4, 8, 11, 7, 5, 3, 10, 14, 6, 9, 1, 2];
  const records = order.flatMap((index) => {
    const field = fields[index];
    const bytes = typeof field === 'number' ? encodeInteger(field) : Array.from(encoder.encode(field));
    return [index, ...encodeInteger(bytes.length), ...bytes];
  });
  return signPayload(0x4b, Uint8Array.from([fields.length, ...records]), keyWords);
}

function isUint32(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

/** Signs a query for the experimental TikTok web QR protocol. This function makes no requests. */
export function signTikTokQrQuery(input: SigningInput): string {
  const { timestampSeconds, requestCount, dynosaur, gnarly, body = '' } = input;
  for (const { keyWords, timestampMicrosLow } of [dynosaur, gnarly]) {
    if (keyWords.length !== 12 || !keyWords.every(isUint32) || !isUint32(timestampMicrosLow)) {
      throw new RangeError('TikTok signing requires twelve unsigned 32-bit key words and a 32-bit microsecond timestamp.');
    }
  }
  if (!isUint32(timestampSeconds) || !isUint32(requestCount) || requestCount === 0) {
    throw new RangeError('TikTok signing requires a 32-bit timestamp and a positive 32-bit request count.');
  }
  const query = input.query.replace(/&+$/, '').replace(/(^|&)msToken=$/, '').replace(/&+$/, '');
  const signature = signDynosaur(query, body, input);
  const signed = `${query}&msToken=&X-Dynosaur=${encodeURIComponent(signature)}&X-Bogus=1`;
  return `${signed}&X-Gnarly=${encodeURIComponent(signGnarly(signed, body, input))}`;
}
