import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Brand, Eyebrow, Icon, IconButton } from '../components/Primitives';
import { Reveal, pressEasing, selectionHaptic } from '../components/Motion';
import { QuietSprig } from '../components/QuietSprig';
import { PLATFORMS, type PlatformId, type SocialPlatform } from '../model/platforms';
import { colors, motion, typography } from '../theme/tokens';

const details: Record<PlatformId, string> = {
  instagram: 'Photos, stories & messages', youtube: 'Search, subscriptions & long videos',
  tiktok: 'Inbox & profiles · web access varies', snapchat: 'Web chat · device support varies',
};

export function HomeScreen({ onOpen, onSettings, animateEntrance = false }: {
  onOpen: (id: PlatformId) => void; onSettings: () => void; animateEntrance?: boolean;
}) {
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Brand /><IconButton icon="sliders" label="Open settings" onPress={onSettings} style={styles.settingsButton} /></View>
    {Platform.OS === 'web' && <View style={styles.preview}><Icon name="monitor" size={14} /><Text style={styles.previewText}>Browser preview · sample content only</Text></View>}
    <Reveal enabled={animateEntrance}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>A SMALL CHANGE OF PACE</Text>
        <Text accessibilityRole="header" style={styles.title}>Your people.{"\n"}<Text style={styles.titleItalic}>Less noise.</Text></Text>
        <Text style={styles.subtitle}>A calmer place for the things{"\n"}you actually opened the app for.</Text>
        <View style={styles.art}><QuietSprig settle={animateEntrance} /></View>
      </View>
    </Reveal>
    <View style={styles.sectionHeader}><Eyebrow>YOUR QUIETER CORNER</Eyebrow><Text style={styles.sectionNote}>01 — 04</Text></View>
    <View style={styles.platforms}>
      {PLATFORMS.map((platform, index) => <Reveal key={platform.id} enabled={animateEntrance} order={index + 1}>
        <PlatformRow platform={platform} last={index === PLATFORMS.length - 1} onOpen={() => onOpen(platform.id)} />
      </Reveal>)}
    </View>
    <Reveal enabled={animateEntrance} order={4}>
      <View style={styles.note}><View style={styles.noteIcon}><Icon name="shield" size={18} color={colors.green} /></View>
        <View style={{ flex: 1 }}><Text style={styles.noteTitle}>A little more room for you.</Text>
          <Text style={styles.noteCopy}>Reels, Shorts and Spotlight are hidden in Quiet’s web views. Your original apps stay unchanged.</Text></View>
      </View>
    </Reveal>
    <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerText}>Come for a conversation. Leave when you’re done.</Text><View style={styles.footerLine} /></View>
  </ScrollView>;
}

function PlatformRow({ platform, last, onOpen }: { platform: SocialPlatform; last: boolean; onOpen: () => void }) {
  const reduced = useReducedMotion();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${platform.name}`}
    onPress={() => { selectionHaptic(); onOpen(); }} pressRetentionOffset={16}>
    {({ pressed }) => <View style={[styles.row, { backgroundColor: pressed ? colors.soft : colors.surface }]}>
      <View style={[styles.platformIcon, { backgroundColor: platform.background }]}>
        <Icon name={platform.id === 'instagram' ? 'instagram' : platform.id === 'youtube' ? 'youtube' : platform.id === 'tiktok' ? 'music' : 'message-circle'} size={25} color={platform.color} />
      </View>
      <View style={styles.cardCopy}>
        <View style={styles.cardTitleRow}><Text style={styles.cardTitle}>{platform.name}</Text>
          {platform.limitation && <Text style={styles.beta}>BETA</Text>}
        </View>
        <Text style={styles.cardSubtitle}>{details[platform.id]}</Text>
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
  kicker: { fontSize: 9, fontWeight: '600', letterSpacing: 2, color: colors.sage, marginBottom: 20 },
  title: { ...typography.title, color: colors.ink, zIndex: 1 },
  titleItalic: { color: colors.sage, fontStyle: 'italic' },
  subtitle: { marginTop: 18, color: colors.muted, fontSize: 13, lineHeight: 21, zIndex: 1, maxWidth: '77%' },
  art: { position: 'absolute', right: -3, bottom: 18, opacity: 0.9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionNote: { fontSize: 10, color: colors.muted, fontVariant: ['tabular-nums'], letterSpacing: 1 },
  platforms: { backgroundColor: colors.surface, borderRadius: 26, borderCurve: 'continuous', overflow: 'hidden', boxShadow: '0 3px 16px rgba(38, 56, 43, 0.025)' },
  row: { flexDirection: 'row', gap: 14, paddingHorizontal: 17, paddingVertical: 19, alignItems: 'center', minHeight: 94 },
  rowLine: { position: 'absolute', height: StyleSheet.hairlineWidth, left: 81, right: 18, bottom: 0, backgroundColor: colors.separator },
  platformIcon: { width: 49, height: 49, borderRadius: 17, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 4 }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...typography.headline, color: colors.ink },
  cardSubtitle: { fontSize: 11, color: colors.muted, lineHeight: 17 },
  beta: { fontSize: 7, color: colors.sage, fontWeight: '700', letterSpacing: 0.7 },
  note: { marginTop: 23, paddingVertical: 17, paddingHorizontal: 2, gap: 11, flexDirection: 'row' },
  noteIcon: { paddingTop: 1 }, noteTitle: { color: colors.green, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  noteCopy: { color: colors.muted, fontSize: 11, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 13 },
  footerLine: { width: 12, height: 1, backgroundColor: colors.line }, footerText: { fontSize: 8, color: colors.sage, letterSpacing: 0.2 },
});
