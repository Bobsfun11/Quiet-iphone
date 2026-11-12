import type { PlatformId } from './platforms';

export type Preferences = {
  version: 1;
  onboarded: boolean;
  launchInInbox: boolean;
  desktop: Record<PlatformId, boolean>;
};

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1, onboarded: false, launchInInbox: false,
  desktop: { youtube: false },
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
      launchInInbox: value.launchInInbox === true,
      desktop: { youtube: value.desktop?.youtube === true },
    };
  } catch { return freshPreferences(); }
}
