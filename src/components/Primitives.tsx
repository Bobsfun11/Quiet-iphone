import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { colors, motion, typography } from '../theme/tokens';
import { pressEasing, selectionHaptic } from './Motion';
import { Icon } from './PlatformIcon';
import type { IconName } from './PlatformIcon.types';

export { Icon };
export type { IconName };

export function IconButton({ icon, label, onPress, disabled = false, style }: {
  icon: IconName; label: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    accessibilityState={{ disabled }} onPress={() => { selectionHaptic(); onPress(); }} hitSlop={8} pressRetentionOffset={16}
    onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
    <Animated.View style={[styles.iconButton, { opacity: disabled ? 0.3 : pressed ? 0.65 : 1,
      transform: [{ scale: pressed && !reduced ? 0.97 : 1 }], transitionProperty: ['transform', 'opacity'],
      transitionDuration: reduced ? 0 : motion.press, transitionTimingFunction: pressEasing }, style]}>
      <Icon name={icon} />
    </Animated.View>
  </Pressable>;
}

export function PrimaryButton({ title, onPress, icon = 'arrow-right' }: { title: string; onPress: () => void; icon?: IconName }) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { selectionHaptic(); onPress(); }}
    onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} pressRetentionOffset={16}>
    <Animated.View style={[styles.primary, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
      transitionProperty: ['transform', 'opacity'], transitionDuration: reduced ? 0 : motion.press, transitionTimingFunction: pressEasing }]}>
      <Text style={styles.primaryText}>{title}</Text><Icon name={icon} color={colors.white} size={19} />
    </Animated.View>
  </Pressable>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <View style={styles.brand}><View style={[styles.mark, small && { width: 30, height: 30, borderRadius: 11 }]}>
    <View style={styles.markLine} /><View style={[styles.markLine, { height: 15 }]} /><View style={[styles.markLine, { height: 9 }]} />
  </View><Text style={[styles.brandText, small && { fontSize: 22 }]}>quiet<Text style={{ color: '#78957F' }}>.</Text></Text></View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

const styles = StyleSheet.create({
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  primary: { minHeight: 58, backgroundColor: colors.green, borderRadius: 20, borderCurve: 'continuous', paddingHorizontal: 22, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontSize: 28, fontWeight: '700', letterSpacing: -1.3, color: colors.ink },
  mark: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, width: 36, height: 36, backgroundColor: colors.green, borderRadius: 12 },
  markLine: { width: 3, height: 21, borderRadius: 2, backgroundColor: '#E8EFCE' },
  eyebrow: { ...typography.eyebrow, color: colors.muted },
});
