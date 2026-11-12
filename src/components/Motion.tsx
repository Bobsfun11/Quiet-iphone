import React, { useMemo } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, ReduceMotion, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '../theme/tokens';

export const pressEasing = cubicBezier(0.23, 1, 0.32, 1);

export function Reveal({ children, order = 0, enabled = true, style }: {
  children: React.ReactNode; order?: number; enabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const entering = useMemo(() => enabled ? (reduced ? FadeIn : FadeInDown)
    .duration(reduced ? motion.press : motion.entrance).delay(reduced ? 0 : order * motion.stagger)
    .easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.System) : undefined,
  [enabled, order, reduced]);
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}

export function selectionHaptic() {
  if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => { /* Visual feedback works without haptics. */ });
}
