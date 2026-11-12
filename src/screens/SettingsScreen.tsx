import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Brand, Eyebrow, Icon, IconButton } from '../components/Primitives';
import type { Preferences } from '../model/preferences';
import { PLATFORMS } from '../model/platforms';
import { colors, fonts } from '../theme/tokens';
import { quietLaunchURL } from '../model/launchLinks';

export function SettingsScreen({ preferences, onChange, onBack, onReset }: {
  preferences: Preferences; onChange: (value: Preferences) => void; onBack: () => void; onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAutomationHelp, setShowAutomationHelp] = useState(false);
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><IconButton icon="arrow-left" label="Back to home" onPress={onBack} /><Brand small /><View style={{ width: 44 }} /></View>
    <Eyebrow>MAKE YOURSELF AT HOME</Eyebrow><Text accessibilityRole="header" style={styles.title}>A little intention.</Text>
    <Text style={styles.intro}>Small choices for a calmer corner of the internet.</Text>
    <Text style={styles.section}>BROWSING</Text>
    <View style={styles.group}>
      <SettingSwitch label="Start with conversations" detail="Open inboxes where supported; YouTube opens subscriptions."
        value={preferences.launchInInbox} onChange={value => onChange({ ...preferences, launchInInbox: value })} />
      <View style={styles.line} />
      <SettingSwitch label="Show compatibility tips" detail="A heads-up when a website has limited iPhone support."
        value={preferences.showTips} onChange={value => onChange({ ...preferences, showTips: value })} />
    </View>
    <Text style={styles.section}>WEBSITE VIEW</Text>
    <View style={styles.group}>{PLATFORMS.map((platform, index) => <View key={platform.id}>
      {index > 0 && <View style={styles.line} />}
      <SettingSwitch label={`${platform.name} desktop view`} detail={platform.id === 'snapchat' ? 'May help; Snapchat can still reject iPhones.' : undefined}
        value={preferences.desktop[platform.id]} onChange={value => onChange({ ...preferences, desktop: { ...preferences.desktop, [platform.id]: value } })} />
    </View>)}</View>
    <Text style={styles.section}>ALWAYS ON IN QUIET</Text>
    <View style={styles.protection}><Icon name="shield" size={23} color={colors.green} /><View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>Short feeds stay hidden</Text><Text style={styles.detail}>Reels, Shorts, TikTok video feeds and Spotlight. No setting here brings them back.</Text>
    </View><Icon name="check" size={20} color={colors.green} /></View>
    <Text style={styles.section}>OPEN INTO QUIET</Text>
    <View style={styles.privacy}>
      <Text style={styles.rowTitle}>A free Shortcut can bring you here.</Text>
      <Text style={styles.paragraph}>Opening the original apps doesn’t automatically switch to Quiet. You can set an iPhone Shortcuts automation for each app to open its Quiet view instead. The original app may appear briefly first.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={showAutomationHelp ? 'Hide automation setup' : 'Show automation setup'}
        onPress={() => setShowAutomationHelp(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>{showAutomationHelp ? 'Hide setup steps' : 'Show setup steps →'}</Text>
      </Pressable>
      {showAutomationHelp && <View style={{ gap: 12 }}>
        <Text style={styles.paragraph}>In Apple’s Shortcuts app, create an automation for App → choose the original app → Is Opened. Add an Open URLs action using the matching link below. Set it to Run Immediately, or turn off Ask Before Running where available. Save and test it with the iPhone unlocked.</Text>
        {PLATFORMS.map(platform => <View key={platform.id} style={{ gap: 4 }}>
          <Text style={styles.rowTitle}>{platform.name}</Text>
          <Text selectable style={{ fontSize: 11, color: colors.green, lineHeight: 18 }}>{quietLaunchURL(platform.id, platform.id !== 'youtube')}</Text>
        </View>)}
        <Text style={styles.paragraph}>Create one automation per original app. Don’t select Quiet as the trigger. Website sign-ins are separate from the original apps, and the automation cannot preserve the exact post or message from a notification. It does not lock the original app. Disable the automation in Shortcuts whenever you need to.</Text>
        <Text style={styles.paragraph}>These links require an installed, signed Quiet build; the browser preview cannot register iPhone app links.</Text>
      </View>}
    </View>
    <Text style={styles.section}>PRIVACY & LIMITS</Text>
    <View style={styles.privacy}>
      <Text style={styles.rowTitle}>No Quiet account. No tracking.</Text>
      <Text style={styles.paragraph}>Quiet sends no browsing history, messages, passwords or analytics to a Quiet server. Each social platform still receives your activity and applies its own privacy policy.</Text>
      <Text style={styles.paragraph}>Sign-in sessions are stored by iOS WebKit on your device. Sign out through each website’s account menu. Resetting preferences does not sign you out or clear cookies.</Text>
      <Text style={styles.paragraph}>The websites may have fewer features than the installed apps. Some sign-in providers reject embedded browsers. TikTok messaging and Snapchat for Web may not work on an iPhone. Filters can need updates when a website changes.</Text>
      <Text style={styles.paragraph}>Quiet doesn’t modify or lock your original apps, provide push message notifications, or bypass platform restrictions. You can remove their Home Screen icons or use Apple Screen Time separately.</Text>
      {Platform.OS === 'web' && <Text style={[styles.paragraph, { color: colors.amber }]}>This browser preview uses sample content. Real account access and filtering require the iPhone app.</Text>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Reset preferences" onPress={() => setConfirmReset(true)} style={styles.reset}><Icon name="rotate-ccw" size={16} color={colors.muted} /><Text style={styles.resetText}>Reset preferences</Text></Pressable>
    {confirmReset && <View style={styles.confirm}><Text style={styles.paragraph}>Reset preferences and show the welcome screen again? Your website sign-ins are kept.</Text>
      <View style={styles.confirmRow}><Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={styles.confirmButton}><Text style={styles.rowTitle}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onReset} style={styles.confirmButton}><Text style={{ color: colors.green, fontWeight: '600' }}>Reset now</Text></Pressable></View>
    </View>}
    <Text style={styles.footer}>QUIET 1.0.0 · BUILT FOR A LITTLE LESS NOISE{"\n"}Independent. Not affiliated with the social platforms.</Text>
  </ScrollView>;
}

function SettingSwitch({ label, detail, value, onChange }: { label: string; detail?: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.setting}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{label}</Text>{detail && <Text style={styles.detail}>{detail}</Text>}</View>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: '#D7DDD2', true: colors.green }} thumbColor={colors.white} ios_backgroundColor="#D7DDD2" />
  </View>;
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 32 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontFamily: fonts.editorial, fontSize: 34, color: colors.ink, marginTop: 12, letterSpacing: -1 },
  intro: { color: colors.muted, lineHeight: 21, fontSize: 13, marginTop: 12, marginBottom: 5 },
  section: { fontSize: 9, fontWeight: '700', letterSpacing: 1.6, color: colors.muted, marginTop: 28, marginBottom: 12 },
  group: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 17 },
  line: { height: 1, backgroundColor: colors.line }, rowTitle: { color: colors.ink, fontWeight: '500', fontSize: 13 },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  protection: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 17, backgroundColor: colors.lightGreen },
  privacy: { backgroundColor: '#EEEFE6', padding: 18, borderRadius: 20, gap: 12 },
  paragraph: { fontSize: 12, lineHeight: 19, color: colors.muted },
  reset: { minHeight: 48, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, resetText: { fontSize: 12, color: colors.muted },
  confirm: { borderWidth: 1, borderColor: colors.line, padding: 16, borderRadius: 16, backgroundColor: colors.white },
  confirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }, confirmButton: { padding: 12, minHeight: 44 },
  footer: { color: '#8A9484', fontSize: 8, letterSpacing: 0.8, textAlign: 'center', lineHeight: 18, marginTop: 30 },
});
