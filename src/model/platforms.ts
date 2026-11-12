export type PlatformId = 'youtube';

export type SocialPlatform = {
  id: PlatformId;
  name: string;
  subtitle: string;
  description: string;
  home: string;
  inbox?: string;
  domains: string[];
  authDomains: string[];
  blockedPaths: string[];
  selectors: string[];
};

export const PLATFORMS: SocialPlatform[] = [
  {
    id: 'youtube', name: 'YouTube', subtitle: 'Website · search, subscriptions & long videos',
    description: 'Search, subscriptions and regular videos. Shorts tabs, shelves and playback stay hidden.',
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
];

export function getPlatform(id: PlatformId): SocialPlatform {
  return PLATFORMS.find(platform => platform.id === id)!;
}

export const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
