import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/tokens';
import type { IconProps } from './PlatformIcon.types';

export function Icon({ name, size = 20, color = colors.ink }: IconProps) {
  return <Feather name={name} size={size} color={color} />;
}
