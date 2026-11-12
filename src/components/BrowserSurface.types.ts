import type { SocialPlatform } from '../model/platforms';

export type BrowserSurfaceProps = {
  platform: SocialPlatform;
  desktop: boolean;
  launchInInbox: boolean;
  showTips: boolean;
  onClose: () => void;
  onToggleDesktop: () => void;
};
