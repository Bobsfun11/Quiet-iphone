export type PlatformId = 'instagram' | 'youtube' | 'tiktok' | 'snapchat';

export type SocialPlatform = {
  id: PlatformId;
  name: string;
  subtitle: string;
  description: string;
  letter: string;
  color: string;
  background: string;
  home: string;
  inbox?: string;
  domains: string[];
  authDomains: string[];
  blockedPaths: string[];
  selectors: string[];
  limitation?: string;
};

export const PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram', name: 'Instagram', subtitle: 'Friends, photos & messages',
    description: 'Your feed, profiles, stories and inbox. Reels navigation and feeds stay hidden.',
    letter: 'ig', color: '#9A476B', background: '#F5E8ED',
    home: 'https://www.instagram.com/', inbox: 'https://www.instagram.com/direct/inbox/',
    domains: ['instagram.com'], authDomains: ['facebook.com'],
    blockedPaths: ['^/reels?(?:/|$)'],
    selectors: [
      'a[href="/reels/"]', 'a[href="/reels"]',
      'nav a[href^="/reel/"]', '[role="navigation"] a[href^="/reel/"]',
      'a:has(svg[aria-label="Reels"])',
      '[data-testid="reels-tab"]', '[data-quiet-short-form="instagram"]',
    ],
  },
  {
    id: 'youtube', name: 'YouTube', subtitle: 'Long videos. Your subscriptions.',
    description: 'Search, subscriptions and regular videos. Shorts tabs, shelves and playback stay hidden.',
    letter: 'yt', color: '#B34639', background: '#FAEAE5',
    home: 'https://m.youtube.com/', inbox: 'https://m.youtube.com/feed/subscriptions',
    domains: ['youtube.com', 'youtu.be'],
    authDomains: ['accounts.google.com', 'accounts.youtube.com', 'consent.youtube.com', 'consent.google.com'],
    blockedPaths: ['^/shorts(?:/|$)', '^/feed/shorts(?:/|$)'],
    selectors: [
      'ytd-reel-shelf-renderer', 'ytm-reel-shelf-renderer', 'ytd-rich-shelf-renderer[is-shorts]',
      'ytm-shorts-lockup-view-model', 'yt-shorts-lockup-view-model',
      'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
      'ytm-rich-item-renderer:has(a[href^="/shorts/"])',
      'ytm-pivot-bar-item-renderer:has(a[href^="/shorts"])',
      'ytd-guide-entry-renderer:has(a[href^="/shorts"])',
      'a[href^="/shorts"]', 'a[href^="/feed/shorts"]', '[data-quiet-short-form="youtube"]',
    ],
  },
  {
    id: 'tiktok', name: 'TikTok', subtitle: 'People & inbox, without the feed',
    description: 'Open profiles or your inbox when TikTok supports it. For You, Following, Live and video routes stay blocked.',
    letter: 'tk', color: '#283C42', background: '#E6ECEB',
    home: 'https://www.tiktok.com/messages', inbox: 'https://www.tiktok.com/messages',
    domains: ['tiktok.com'], authDomains: [],
    blockedPaths: ['^/$', '^/(?:foryou|following|explore|live)(?:/|$)', '^/@[^/]+/video(?:/|$)', '^/t/'],
    selectors: [
      '[data-e2e="recommend-list-item-container"]', '[data-e2e="recommend-list-item-container-parent"]',
      '[data-e2e="nav-foryou"]', '[data-e2e="nav-following"]', '[data-e2e="nav-live"]',
      'a[href="/foryou"]', 'a[href="/following"]', 'a[href="/explore"]', 'a[href="/live"]',
      'a[href*="/video/"]', '[data-quiet-short-form="tiktok"]',
    ],
    limitation: 'TikTok may require its native app for messaging, posting or sign-in. Quiet cannot enable features missing from TikTok’s website.',
  },
  {
    id: 'snapchat', name: 'Snapchat', subtitle: 'Conversations, without Spotlight',
    description: 'Try Snapchat for Web with Spotlight navigation and feeds hidden. Web access depends on Snapchat’s device support.',
    letter: 'sc', color: '#86701D', background: '#F5F0CF',
    home: 'https://web.snapchat.com/', inbox: 'https://web.snapchat.com/',
    domains: ['snapchat.com'], authDomains: ['accounts.snapchat.com'],
    blockedPaths: ['^/spotlight(?:/|$)'],
    selectors: [
      'a[href^="/spotlight"]', 'a[href*="snapchat.com/spotlight"]',
      '[data-testid="spotlight-tab"]', '[data-testid="spotlight-feed"]',
      '[data-quiet-short-form="snapchat"]',
    ],
    limitation: 'Snapchat for Web may reject iPhones even in desktop mode. Chat, camera, calls and notifications are not guaranteed. The native app stays unchanged.',
  },
];

export function getPlatform(id: PlatformId): SocialPlatform {
  return PLATFORMS.find(platform => platform.id === id)!;
}

export const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
