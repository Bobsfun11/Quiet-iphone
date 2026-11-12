import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { colors } from '../theme/tokens';

// Original geometric artwork. One small settling motion, never an attention loop.
export function QuietSprig({ settle = false, large = false }: { settle?: boolean; large?: boolean }) {
  const reduced = useReducedMotion();
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    pointerEvents="none" style={[styles.scene, large && { transform: [{ scale: 1.2 }] }]}>
    <View style={styles.sun} /><View style={styles.orbit} /><View style={styles.seed} />
    <Animated.View style={[styles.sprig, settle && !reduced ? {
      animationName: { '0%': { transform: [{ rotate: '-7deg' }] }, '65%': { transform: [{ rotate: '2deg' }] }, '100%': { transform: [{ rotate: '0deg' }] } },
      animationDuration: 900, animationIterationCount: 1, animationTimingFunction: 'ease-in-out',
    } : {}]}>
      <View style={styles.stem} /><View style={[styles.leaf, styles.leafOne]} />
      <View style={[styles.leaf, styles.leafTwo]} /><View style={[styles.leaf, styles.leafThree]} />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { width: 108, height: 156 },
  sun: { position: 'absolute', width: 85, height: 85, borderRadius: 44, backgroundColor: colors.artSun, bottom: 5, right: 0 },
  orbit: { position: 'absolute', width: 97, height: 97, borderRadius: 49, borderWidth: 1, borderColor: colors.artOrbit, bottom: 0, right: -5 },
  seed: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warmAccent, left: 13, top: 32 },
  sprig: { position: 'absolute', width: 100, height: 148, left: 0, bottom: 0, transformOrigin: '60% 100%' },
  stem: { position: 'absolute', width: 2, height: 115, backgroundColor: colors.artStem, bottom: 10, left: 58, transform: [{ rotate: '12deg' }] },
  leaf: { position: 'absolute', width: 28, height: 48, borderTopLeftRadius: 40, borderBottomRightRadius: 40, backgroundColor: colors.artLeaf },
  leafOne: { left: 30, top: 44, transform: [{ rotate: '-60deg' }] },
  leafTwo: { left: 59, top: 13, transform: [{ rotate: '10deg' }], backgroundColor: colors.artLightLeaf },
  leafThree: { left: 59, top: 81, transform: [{ rotate: '28deg' }], backgroundColor: colors.artDarkLeaf },
});
