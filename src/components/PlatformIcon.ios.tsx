import React from 'react';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { colors } from '../theme/tokens';
import type { IconName, IconProps } from './PlatformIcon.types';

const nativeSymbols: Partial<Record<IconName, SFSymbol>> = {
  'arrow-right': 'arrow.right', 'arrow-left': 'arrow.left', 'arrow-up-right': 'arrow.up.right',
  'chevron-left': 'chevron.left', 'chevron-right': 'chevron.right', 'cloud-off': 'icloud.slash',
  'refresh-cw': 'arrow.clockwise', 'rotate-cw': 'arrow.clockwise', 'rotate-ccw': 'arrow.counterclockwise',
  check: 'checkmark', heart: 'heart', home: 'house', info: 'info.circle', instagram: 'camera', lock: 'lock',
  'message-circle': 'bubble.left', monitor: 'desktopcomputer', music: 'music.note', shield: 'checkmark.shield',
  search: 'magnifyingglass', send: 'paperplane.fill', sliders: 'slider.horizontal.3',
  sun: 'sun.max', x: 'xmark', feather: 'leaf',
};

export function Icon({ name, size = 20, color = colors.ink }: IconProps) {
  return <SymbolView name={nativeSymbols[name] ?? 'questionmark.circle'} size={size} tintColor={color} weight="regular" />;
}
