import React, { Component, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import BrowserSurface from './src/components/BrowserSurface';
import { PrimaryButton } from './src/components/Primitives';
import { HomeScreen } from './src/screens/HomeScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { freshPreferences, parsePreferences, type Preferences } from './src/model/preferences';
import { getPlatform, type PlatformId } from './src/model/platforms';
import { colors } from './src/theme/tokens';
import { parseQuietLaunch } from './src/model/launchLinks';

const STORAGE_KEY = 'quiet.preferences.v1';
type Screen = 'home' | 'settings' | PlatformId;

function QuietApp() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [launchNumber, setLaunchNumber] = useState(0);
  const [shortcutInbox, setShortcutInbox] = useState(false);
  const [storageError, setStorageError] = useState(false);
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
      setShortcutInbox(target.inbox);
      setScreen(target.platform);
      // A second automation launch to the same platform starts at its entry
      // again, rather than silently leaving an old page on screen.
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

  return <View style={styles.outer}><SafeAreaView style={styles.app}>
    <StatusBar style="auto" />
    {storageError && <Text accessibilityRole="alert" style={styles.storageError}>Settings can’t be saved on this device right now.</Text>}
    {!preferences ? <View style={styles.center}><ActivityIndicator color={colors.green} /></View> :
      !preferences.onboarded ? <WelcomeScreen onContinue={() => setPreferences({ ...preferences, onboarded: true })} /> :
      screen === 'home' ? <HomeScreen animateEntrance={!homeHasEntered.current} onOpen={id => { setShortcutInbox(false); setScreen(id); }} onSettings={() => setScreen('settings')} /> :
      screen === 'settings' ? <SettingsScreen preferences={preferences} onChange={setPreferences} onBack={() => setScreen('home')}
        onReset={() => { setScreen('home'); setPreferences(freshPreferences()); }} /> :
      <BrowserSurface key={`${screen}-${launchNumber}`} platform={getPlatform(screen)} desktop={preferences.desktop[screen]}
        launchInInbox={shortcutInbox || preferences.launchInInbox} onClose={() => setScreen('home')}
        onToggleDesktop={() => setPreferences({ ...preferences, desktop: { ...preferences.desktop, [screen]: !preferences.desktop[screen] } })} />}
  </SafeAreaView></View>;
}

class AppBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <View style={[styles.outer, styles.center, { padding: 32, gap: 20 }]}>
      <Text style={{ fontFamily: 'Georgia', fontSize: 30, color: colors.ink }}>Let’s take a breath.</Text>
      <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 22 }}>Quiet ran into a problem. Restart the view to continue; your website sign-ins are kept.</Text>
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
