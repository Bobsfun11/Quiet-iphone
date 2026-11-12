import { PLATFORMS, type PlatformId } from './platforms';

export type Preferences = {
  version: 1;
  onboarded: boolean;
  showTips: boolean;
  launchInInbox: boolean;
  desktop: Record<PlatformId, boolean>;
};

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1, onboarded: false, showTips: true, launchInInbox: false,
  desktop: { instagram: false, youtube: false, tiktok: true, snapchat: true },
};

export function freshPreferences(): Preferences {
  return { ...DEFAULT_PREFERENCES, desktop: { ...DEFAULT_PREFERENCES.desktop } };
}

export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return freshPreferences();
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || value.version !== 1) return freshPreferences();
    return {
      version: 1,
      onboarded: value.onboarded === true,
      showTips: typeof value.showTips === 'boolean' ? value.showTips : true,
      launchInInbox: value.launchInInbox === true,
      desktop: Object.fromEntries(PLATFORMS.map(p => [p.id,
        typeof value.desktop?.[p.id] === 'boolean' ? value.desktop[p.id] : DEFAULT_PREFERENCES.desktop[p.id],
      ])) as Preferences['desktop'],
    };
  } catch { return freshPreferences(); }
}
