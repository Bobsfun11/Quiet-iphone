import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Brand, Icon, IconButton } from '../components/Primitives';
import type { Preferences } from '../model/preferences';
import { colors, fonts } from '../theme/tokens';
import { quietLaunchURL } from '../model/launchLinks';

export function SettingsScreen({ preferences, onChange, onBack, onReset }: {
  preferences: Preferences; onChange: (value: Preferences) => void; onBack: () => void; onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAutomationHelp, setShowAutomationHelp] = useState(false);
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><IconButton icon="arrow-left" label="Back to home" onPress={onBack} /><Brand small /><View style={{ width: 44 }} /></View>
    <Text accessibilityRole="header" style={styles.title}>Settings</Text>
    <Text style={styles.section}>YOUTUBE WEBSITE</Text>
    <View style={styles.group}>
      <SettingSwitch label="Start with subscriptions"
        value={preferences.launchInInbox} onChange={value => onChange({ ...preferences, launchInInbox: value })} />
      <View style={styles.line} />
      <SettingSwitch label="YouTube desktop view"
        value={preferences.desktop.youtube} onChange={value => onChange({ ...preferences, desktop: { youtube: value } })} />
    </View>
    <Text style={styles.section}>SHORTCUTS</Text>
    <View style={styles.privacy}>
      <Text style={styles.paragraph}>An iPhone Shortcut can open the filtered YouTube website when you open YouTube.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={showAutomationHelp ? 'Hide automation setup' : 'Show automation setup'}
        onPress={() => setShowAutomationHelp(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>{showAutomationHelp ? 'Hide setup steps' : 'Show setup steps →'}</Text>
      </Pressable>
      {showAutomationHelp && <View style={{ gap: 12 }}>
        <Text style={styles.paragraph}>In Shortcuts, create an automation for App → YouTube → Is Opened. Add an Open URLs action with the link below and choose Run Immediately.</Text>
        <Text selectable style={{ fontSize: 11, color: colors.green, lineHeight: 18 }}>{quietLaunchURL('youtube')}</Text>
        <Text style={styles.paragraph}>If you set up Quiet automations for other apps in an earlier version, disable those under Shortcuts → Automation.</Text>
        {Platform.OS === 'web' && <Text style={styles.paragraph}>This link opens the installed iPhone app.</Text>}
      </View>}
    </View>
    <Text style={styles.section}>PRIVACY</Text>
    <View style={styles.privacy}>
      <Text style={styles.paragraph}>Quiet stores your website sign-in on this device. Sign out through YouTube’s account menu. Resetting preferences keeps the website session.</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Reset preferences" onPress={() => setConfirmReset(true)} style={styles.reset}><Icon name="rotate-ccw" size={16} color={colors.muted} /><Text style={styles.resetText}>Reset preferences</Text></Pressable>
    {confirmReset && <View style={styles.confirm}><Text style={styles.paragraph}>Reset preferences and show the welcome screen again? Your website sign-ins are kept.</Text>
      <View style={styles.confirmRow}><Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={styles.confirmButton}><Text style={styles.rowTitle}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onReset} style={styles.confirmButton}><Text style={{ color: colors.green, fontWeight: '600' }}>Reset now</Text></Pressable></View>
    </View>}
  </ScrollView>;
}

function SettingSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.setting}><Text style={[styles.rowTitle, { flex: 1 }]}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: colors.controlTrack, true: colors.green }} thumbColor={colors.onAccent} ios_backgroundColor={colors.controlTrack} />
  </View>;
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 32 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontFamily: fonts.editorial, fontSize: 34, color: colors.ink, marginTop: 12, letterSpacing: -1 },
  section: { fontSize: 9, fontWeight: '700', letterSpacing: 1.6, color: colors.muted, marginTop: 28, marginBottom: 12 },
  group: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 17 },
  line: { height: 1, backgroundColor: colors.line }, rowTitle: { color: colors.ink, fontWeight: '500', fontSize: 13 },
  privacy: { backgroundColor: colors.soft, padding: 18, borderRadius: 20, gap: 12 },
  paragraph: { fontSize: 12, lineHeight: 19, color: colors.muted },
  reset: { minHeight: 48, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, resetText: { fontSize: 12, color: colors.muted },
  confirm: { borderWidth: 1, borderColor: colors.line, padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  confirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }, confirmButton: { padding: 12, minHeight: 44 },
});
