export type InboxPlatformId = 'instagram' | 'tiktok';

export type InboxChat = {
  id: string;
  title: string;
  avatarUrl?: string;
  preview: string;
  updatedAt: string;
  unread: boolean;
};

export type InboxMessage = {
  id: string;
  text: string;
  sentAt: string;
  outgoing: boolean;
  senderName?: string;
};

export type InboxClient = {
  listChats(platform: InboxPlatformId): Promise<InboxChat[]>;
  listMessages(platform: InboxPlatformId, chatId: string): Promise<InboxMessage[]>;
  sendMessage(platform: InboxPlatformId, chatId: string, text: string): Promise<InboxMessage>;
};
