import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Brand, Eyebrow, Icon, IconButton } from '../components/Primitives';
import { Reveal, pressEasing, selectionHaptic } from '../components/Motion';
import { QuietSprig } from '../components/QuietSprig';
import { PLATFORMS, type PlatformId, type SocialPlatform } from '../model/platforms';
import { colors, motion, typography } from '../theme/tokens';

export function HomeScreen({ onOpen, onSettings, animateEntrance = false }: {
  onOpen: (id: PlatformId) => void; onSettings: () => void; animateEntrance?: boolean;
}) {
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Brand /><IconButton icon="sliders" label="Open settings" onPress={onSettings} style={styles.settingsButton} /></View>
    {Platform.OS === 'web' && <View style={styles.preview}><Icon name="monitor" size={14} /><Text style={styles.previewText}>Browser preview · sample content only</Text></View>}
    <Reveal enabled={animateEntrance}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>Watch without{"\n"}<Text style={styles.titleItalic}>Shorts.</Text></Text>
        <Text style={styles.subtitle}>Quiet filters Shorts on the YouTube website.</Text>
        <View style={styles.art}><QuietSprig settle={animateEntrance} /></View>
      </View>
    </Reveal>
    <View style={styles.sectionHeader}><Eyebrow>FILTERED BROWSING</Eyebrow></View>
    <View style={styles.platforms}>
      {PLATFORMS.map((platform, index) => <Reveal key={platform.id} enabled={animateEntrance} order={index + 1}>
        <PlatformRow platform={platform} last={index === PLATFORMS.length - 1} onOpen={() => onOpen(platform.id)} />
      </Reveal>)}
    </View>
  </ScrollView>;
}

function PlatformRow({ platform, last, onOpen }: { platform: SocialPlatform; last: boolean; onOpen: () => void }) {
  const reduced = useReducedMotion();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${platform.name} website`}
    onPress={() => { selectionHaptic(); onOpen(); }} pressRetentionOffset={16}>
    {({ pressed }) => <View style={[styles.row, { backgroundColor: pressed ? colors.soft : colors.surface }]}>
      <View style={styles.platformIcon}>
        <Icon name="youtube" size={25} color={colors.youtubeInk} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{platform.name}</Text>
        <Text style={styles.cardSubtitle}>{platform.subtitle}</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX: pressed && !reduced ? 3 : 0 }, { translateY: pressed && !reduced ? -3 : 0 }],
        transitionProperty: 'transform', transitionDuration: reduced ? 0 : motion.press, transitionTimingFunction: pressEasing }}>
        <Icon name="arrow-up-right" size={17} color={colors.sage} />
      </Animated.View>
      {!last && <View style={styles.rowLine} />}
    </View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  settingsButton: { backgroundColor: colors.soft, borderCurve: 'continuous' },
  preview: { backgroundColor: colors.lightAmber, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 7, marginBottom: 16, alignItems: 'center' },
  previewText: { fontSize: 11, color: colors.ink },
  hero: { position: 'relative', paddingTop: 4, paddingBottom: 35 },
  title: { ...typography.title, color: colors.ink, zIndex: 1 },
  titleItalic: { color: colors.sage, fontStyle: 'italic' },
  subtitle: { marginTop: 18, color: colors.muted, fontSize: 13, lineHeight: 21, zIndex: 1, maxWidth: '77%' },
  art: { position: 'absolute', right: -3, bottom: 18, opacity: 0.9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  platforms: { backgroundColor: colors.surface, borderRadius: 26, borderCurve: 'continuous', overflow: 'hidden', boxShadow: '0 3px 16px rgba(38, 56, 43, 0.025)' },
  row: { flexDirection: 'row', gap: 14, paddingHorizontal: 17, paddingVertical: 19, alignItems: 'center', minHeight: 94 },
  rowLine: { position: 'absolute', height: StyleSheet.hairlineWidth, left: 81, right: 18, bottom: 0, backgroundColor: colors.separator },
  platformIcon: { width: 49, height: 49, borderRadius: 17, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.youtubeTint },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { ...typography.headline, color: colors.ink },
  cardSubtitle: { fontSize: 11, color: colors.muted, lineHeight: 17 },
});
