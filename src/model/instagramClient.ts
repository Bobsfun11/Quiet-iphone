import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { InboxChat, InboxClient, InboxMessage, InboxPlatformId } from './inbox';

export type InstagramSession = {
  state: 'signedOut' | 'verificationRequired' | 'ready';
  userId?: string;
};

type QuietMatrix = {
  sessionStatus(): Promise<InstagramSession>;
  signIn(username: string, password: string): Promise<InstagramSession>;
  verify(recoveryKey: string): Promise<InstagramSession>;
  signOut(): Promise<void>;
  listChats(): Promise<InboxChat[]>;
  listMessages(chatId: string): Promise<InboxMessage[]>;
  sendMessage(chatId: string, text: string): Promise<InboxMessage>;
};

export const instagramSession = Platform.OS === 'ios'
  ? requireOptionalNativeModule<QuietMatrix>('QuietMatrix')
  : null;

function requireInstagram(platform: InboxPlatformId): QuietMatrix {
  if (platform !== 'instagram' || !instagramSession) throw new Error('Instagram messaging is unavailable.');
  return instagramSession;
}

export const instagramClient: InboxClient = {
  async listChats(platform) {
    return requireInstagram(platform).listChats();
  },
  async listMessages(platform, chatId) {
    return requireInstagram(platform).listMessages(chatId);
  },
  async sendMessage(platform, chatId, text) {
    return requireInstagram(platform).sendMessage(chatId, text);
  },
};
