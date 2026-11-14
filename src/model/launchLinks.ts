import { PLATFORMS, type PlatformId } from './platforms';

export type QuietLaunch = { platform: PlatformId };

export function quietLaunchURL(platform: PlatformId): string {
  return `quiet-social://open/${platform}`;
}

// Existing Instagram and TikTok shortcuts can still open their native inboxes.
// The view parameter is retained only for links created by earlier builds.
export function parseQuietLaunch(raw: string | null): QuietLaunch | null {
  if (!raw || raw.length > 160) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'quiet-social:' || url.hostname !== 'open' || url.username || url.password || url.port || url.hash)
      return null;
    const platform = PLATFORMS.find(item => url.pathname === `/${item.id}`)?.id;
    if (!platform) return null;
    const keys = [...url.searchParams.keys()];
    if (keys.some(key => key !== 'view') || url.searchParams.getAll('view').length > 1) return null;
    const view = url.searchParams.get('view');
    if (view !== null && view !== 'inbox' && view !== 'home') return null;
    return { platform };
  } catch { return null; }
}
