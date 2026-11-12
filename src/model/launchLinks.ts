import { PLATFORMS, type PlatformId } from './platforms';

export type QuietLaunch = { platform: PlatformId; inbox: boolean };

export function quietLaunchURL(platform: PlatformId, inbox = false): string {
  return `quiet-social://open/${platform}${inbox ? '?view=inbox' : ''}`;
}

// Shortcuts may select a platform and the inbox view; they cannot inject an
// arbitrary website, disable filtering or send account/session information.
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
    return { platform, inbox: view === 'inbox' };
  } catch { return null; }
}
