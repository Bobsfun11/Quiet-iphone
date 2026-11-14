import React, { Component, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { PrimaryButton } from './src/components/Primitives';
import { HomeScreen } from './src/screens/HomeScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { InstagramSetupScreen } from './src/screens/InstagramSetupScreen';
import { TikTokScreen } from './src/screens/TikTokScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { freshPreferences, parsePreferences, type Preferences } from './src/model/preferences';
import type { PlatformId } from './src/model/platforms';
import { colors } from './src/theme/tokens';
import { parseQuietLaunch } from './src/model/launchLinks';
import { instagramClient, instagramSession, type InstagramSession } from './src/model/instagramClient';

const STORAGE_KEY = 'quiet.preferences.v1';
type Screen = 'home' | 'settings' | 'instagram-setup' | PlatformId;

function QuietApp() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [launchNumber, setLaunchNumber] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const [account, setAccount] = useState<InstagramSession | null>(null);
  const [accountCheckFailed, setAccountCheckFailed] = useState(false);
  const homeHasEntered = useRef(false);
  useEffect(() => {
    if (preferences?.onboarded && screen === 'home') homeHasEntered.current = true;
  }, [preferences?.onboarded, screen]);
  useEffect(() => {
    let active = true;
    let receivedLiveURL = false;
    const receive = (raw: string | null) => {
      const target = parseQuietLaunch(raw);
      if (!active || !target) return;
      setScreen(target.platform);
      // Reopening an inbox via a shortcut leaves any previously open thread.
      setLaunchNumber(number => number + 1);
    };
    const subscription = Linking.addEventListener('url', event => { receivedLiveURL = true; receive(event.url); });
    Linking.getInitialURL().then(url => { if (!receivedLiveURL) receive(url ?? null); }).catch(() => { /* Normal Home launch is still available. */ });
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => { if (active) setPreferences(parsePreferences(raw)); })
      .catch(() => { if (active) { setPreferences(parsePreferences(null)); setStorageError(true); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!preferences) return;
    // Debounce avoids out-of-order writes if several switches change together.
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => setStorageError(true));
    }, 150);
    return () => clearTimeout(timer);
  }, [preferences]);
  useEffect(() => {
    if ((screen !== 'instagram' && screen !== 'instagram-setup') || !instagramSession) return;
    let active = true;
    setAccountCheckFailed(false);
    void instagramSession.sessionStatus().then(status => { if (active) setAccount(status); })
      .catch(() => { if (active) { setAccount(null); setAccountCheckFailed(true); } });
    return () => { active = false; };
  }, [screen, launchNumber]);

  const instagramReason = !instagramSession ? 'Instagram account connections are available in the iPhone build.'
    : accountCheckFailed ? 'Quiet couldn’t restore your Beeper session.' : undefined;

  return <View style={styles.outer}><SafeAreaView style={styles.app}>
    <StatusBar style="auto" />
    {storageError && <Text accessibilityRole="alert" style={styles.storageError}>Settings can’t be saved on this device right now.</Text>}
    {!preferences ? <View style={styles.center}><ActivityIndicator color={colors.green} /></View> :
      !preferences.onboarded ? <WelcomeScreen onContinue={() => setPreferences({ ...preferences, onboarded: true })} /> :
      screen === 'home' ? <HomeScreen animateEntrance={!homeHasEntered.current} onOpen={setScreen} onSettings={() => setScreen('settings')} /> :
      screen === 'settings' ? <SettingsScreen onBack={() => setScreen('home')}
        onInstagramSetup={instagramSession ? () => setScreen('instagram-setup') : undefined}
        onReset={() => { setScreen('home'); setPreferences(freshPreferences()); }} /> :
      screen === 'tiktok' ? <TikTokScreen key={launchNumber} onClose={() => setScreen('home')} /> :
      screen === 'instagram-setup' && (account || accountCheckFailed) ? <InstagramSetupScreen session={account ?? { state: 'signedOut' }} onSession={next => {
        setAccount(next);
        setAccountCheckFailed(false);
        if (next.state === 'ready') setScreen('instagram');
      }} onBack={() => setScreen('instagram')} /> :
      screen === 'instagram-setup' || (screen === 'instagram' && instagramSession && !account && !accountCheckFailed)
        ? <View style={styles.center}><ActivityIndicator color={colors.green} accessibilityLabel="Checking Instagram connection" /></View>
        : <InboxScreen key={`${screen}-${launchNumber}`} platform={screen}
          client={screen === 'instagram' && account?.state === 'ready' ? instagramClient : null}
          connectionUnavailableReason={instagramReason}
          connectionActionLabel={screen === 'instagram' && instagramSession
            ? account?.state === 'verificationRequired' ? 'Verify Beeper session' : 'Connect Instagram' : undefined}
          onClose={() => setScreen('home')} onSetup={() => setScreen('instagram-setup')} />}
  </SafeAreaView></View>;
}

class AppBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <View style={[styles.outer, styles.center, { padding: 32, gap: 20 }]}>
      <Text style={{ fontFamily: 'Georgia', fontSize: 30, color: colors.ink }}>Let’s take a breath.</Text>
      <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 22 }}>Quiet ran into a problem. Restart the view to continue.</Text>
      <PrimaryButton title="Restart Quiet" icon="refresh-cw" onPress={() => this.setState({ failed: false })} />
    </View>;
    return this.props.children;
  }
}

export default function App() {
  return <SafeAreaProvider><AppBoundary><QuietApp /></AppBoundary></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#E5E8DD' : colors.canvas, alignItems: 'center' },
  app: { flex: 1, backgroundColor: colors.canvas, width: '100%', maxWidth: Platform.OS === 'web' ? 460 : undefined },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  storageError: { backgroundColor: colors.lightAmber, color: colors.amber, padding: 10, fontSize: 11, textAlign: 'center' },
});
