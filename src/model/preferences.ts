export type Preferences = {
  version: 1;
  onboarded: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1, onboarded: false,
};

export function freshPreferences(): Preferences {
  return { ...DEFAULT_PREFERENCES };
}

export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return freshPreferences();
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || value.version !== 1) return freshPreferences();
    return {
      version: 1,
      onboarded: value.onboarded === true,
    };
  } catch { return freshPreferences(); }
}
