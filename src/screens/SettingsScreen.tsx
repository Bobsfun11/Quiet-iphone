import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand, Icon, IconButton } from '../components/Primitives';
import { colors, fonts } from '../theme/tokens';
import { quietLaunchURL } from '../model/launchLinks';
import { PLATFORMS } from '../model/platforms';

export function SettingsScreen({ onBack, onReset, onInstagramSetup }: {
  onBack: () => void; onReset: () => void; onInstagramSetup?: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAutomationHelp, setShowAutomationHelp] = useState(false);
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><IconButton icon="arrow-left" label="Back to home" onPress={onBack} /><Brand small /><View style={{ width: 44 }} /></View>
    <Text accessibilityRole="header" style={styles.title}>Settings</Text>
    {onInstagramSetup && <>
      <Text style={styles.section}>ACCOUNT</Text>
      <Pressable accessibilityRole="button" onPress={onInstagramSetup} style={[styles.panel, styles.account]}>
        <Text style={styles.rowTitle}>Instagram connection</Text><Icon name="chevron-right" size={18} color={colors.muted} />
      </Pressable>
    </>}
    <Text style={styles.section}>APPEARANCE</Text>
    <View style={styles.panel}>
      <Text style={styles.paragraph}>Quiet follows your iPhone’s Light or Dark appearance.</Text>
    </View>
    <Text style={styles.section}>SHORTCUTS</Text>
    <View style={styles.panel}>
      <Text style={styles.paragraph}>Use an Open URLs action to go directly to a Quiet inbox.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={showAutomationHelp ? 'Hide automation setup' : 'Show automation setup'}
        onPress={() => setShowAutomationHelp(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>{showAutomationHelp ? 'Hide setup steps' : 'Show setup steps →'}</Text>
      </Pressable>
      {showAutomationHelp && <View style={{ gap: 12 }}>
        {PLATFORMS.map(platform => <View key={platform.id} style={styles.linkRow}>
          <Text style={styles.rowTitle}>{platform.name}</Text>
          <Text selectable style={styles.link}>{quietLaunchURL(platform.id)}</Text>
        </View>)}
        <Text style={styles.paragraph}>Turn off any old YouTube or Snapchat automations in Shortcuts → Automation.</Text>
      </View>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Reset preferences" onPress={() => setConfirmReset(true)} style={styles.reset}><Icon name="rotate-ccw" size={16} color={colors.muted} /><Text style={styles.resetText}>Reset preferences</Text></Pressable>
    {confirmReset && <View style={styles.confirm}><Text style={styles.paragraph}>Reset preferences and show the welcome screen again?</Text>
      <View style={styles.confirmRow}><Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={styles.confirmButton}><Text style={styles.rowTitle}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onReset} style={styles.confirmButton}><Text style={{ color: colors.green, fontWeight: '600' }}>Reset now</Text></Pressable></View>
    </View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 32 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontFamily: fonts.editorial, fontSize: 34, color: colors.ink, marginTop: 12, letterSpacing: -1 },
  section: { fontSize: 9, fontWeight: '700', letterSpacing: 1.6, color: colors.muted, marginTop: 28, marginBottom: 12 },
  rowTitle: { color: colors.ink, fontWeight: '500', fontSize: 13 },
  panel: { backgroundColor: colors.soft, padding: 18, borderRadius: 20, gap: 12 },
  account: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkRow: { gap: 4 },
  link: { color: colors.green, fontSize: 12, lineHeight: 18 },
  paragraph: { fontSize: 12, lineHeight: 19, color: colors.muted },
  reset: { minHeight: 48, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, resetText: { fontSize: 12, color: colors.muted },
  confirm: { borderWidth: 1, borderColor: colors.line, padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  confirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }, confirmButton: { padding: 12, minHeight: 44 },
});
