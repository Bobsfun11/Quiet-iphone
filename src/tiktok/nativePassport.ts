import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { TikTokQrChallenge } from './qrChallenge';
import { conversationRequest, decodeConversations, decodeHistory, historyRequest, type TikTokConversation } from './inboxProtocol';
import type { InboxClient } from '../model/inbox';

type Attempt = {
  id: string;
  deviceId: string;
  verificationId: string;
  region: string;
  language: string;
  timeZone: string;
};

type NativePassport = {
  openTikTokAttempt(): Promise<Attempt>;
  closeTikTokAttempt(id: string): Promise<void>;
  tiktokRandomWords(): Promise<number[]>;
  tiktokPassportRequest(id: string, url: string, userAgent: string, ticket: string | null): Promise<string>;
  tiktokInboxRequest(id: string, payload: string, history: boolean): Promise<string>;
  tiktokProfile(id: string): Promise<{ userId: string; deviceId?: string }>;
};

export const nativeTikTokPassport = Platform.OS === 'ios'
  ? requireOptionalNativeModule<NativePassport>('QuietMatrix')
  : null;

export async function openTikTokAttempt() {
  if (!nativeTikTokPassport) throw new Error('TikTok sign-in is available in the iPhone build.');
  const native = nativeTikTokPassport;
  const attempt = await native.openTikTokAttempt();
  const crypto = async () => Uint32Array.from(await native.tiktokRandomWords());
  const challenge = new TikTokQrChallenge(attempt, crypto, async (url, headers) => {
    const json = await native.tiktokPassportRequest(attempt.id, url, headers['User-Agent'], headers['x-tt-passport-ttwid-ticket'] ?? null);
    return JSON.parse(json) as unknown;
  });
  return { attempt, challenge, native };
}

export async function openTikTokInbox({ attempt, native }: Awaited<ReturnType<typeof openTikTokAttempt>>): Promise<InboxClient> {
  const { userId, deviceId } = await native.tiktokProfile(attempt.id);
  const context = {
    ...attempt,
    deviceId: deviceId ?? attempt.deviceId,
    locale: attempt.language,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    msToken: '',
  };
  let conversations = new Map<string, TikTokConversation>();
  async function read(request: Uint8Array, history = false) {
    const encoded = btoa(Array.from(request, byte => String.fromCharCode(byte)).join(''));
    const result = await native.tiktokInboxRequest(attempt.id, encoded, history);
    return Uint8Array.from(atob(result), character => character.charCodeAt(0));
  }
  async function loadChats() {
    const rooms = decodeConversations(await read(conversationRequest(context)));
    conversations = new Map(rooms.map(room => [room.id, room]));
    return rooms.map(room => ({ id: room.id, title: room.name, updatedAt: room.updatedAt ?? '', unread: room.unread, preview: '' }));
  }
  const firstChats = await loadChats();
  let readyChats: typeof firstChats | undefined = firstChats;
  return {
    async listChats() {
      const cached = readyChats;
      readyChats = undefined;
      return cached ?? loadChats();
    },
    async listMessages(_, id) {
      const room = conversations.get(id);
      if (!room) throw new Error('This TikTok conversation is unavailable.');
      const messages = decodeHistory(await read(historyRequest(context, room), true), id);
      return messages.map(message => ({ id: message.id, text: message.text ?? 'Attachment', sentAt: message.sentAt ?? '', outgoing: message.senderId === userId }));
    },
  };
}
