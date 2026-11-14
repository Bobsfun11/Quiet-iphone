import type { InboxPlatformId } from './inbox';

export type PlatformId = InboxPlatformId;

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
] as const satisfies readonly { id: PlatformId; name: string }[];

export type SocialPlatform = typeof PLATFORMS[number];
