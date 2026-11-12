import type { PlatformId, SocialPlatform } from '../model/platforms';
import { getPlatform } from '../model/platforms';

export type NavigationDecision = 'allow' | 'block-feed' | 'external' | 'deny';

export function domainMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function isBlockedPath(url: URL, platform: SocialPlatform): boolean {
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { path = url.pathname; }
  path = path.replace(/\/{2,}/g, '/');
  return platform.blockedPaths.some(pattern => new RegExp(pattern, 'i').test(path));
}

export function navigationDecision(rawURL: string, platformId: PlatformId): NavigationDecision {
  let url: URL;
  try { url = new URL(rawURL); } catch { return 'deny'; }
  if (url.protocol !== 'https:') return 'deny';
  if (url.username || url.password) return 'deny';
  const platform = getPlatform(platformId);
  const isPlatform = platform.domains.some(domain => domainMatches(url.hostname, domain));
  if (isPlatform && isBlockedPath(url, platform)) return 'block-feed';
  if (isPlatform || platform.authDomains.some(domain => domainMatches(url.hostname, domain))) return 'allow';
  return 'external';
}
