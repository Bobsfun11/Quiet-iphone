import type React from 'react';
import type Feather from '@expo/vector-icons/Feather';
import type { OpaqueColorValue } from 'react-native';

export type IconName = React.ComponentProps<typeof Feather>['name'];
export type IconProps = { name: IconName; size?: number; color?: string | OpaqueColorValue };
