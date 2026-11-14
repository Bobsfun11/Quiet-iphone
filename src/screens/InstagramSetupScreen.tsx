import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconButton, PrimaryButton } from '../components/Primitives';
import { instagramSession, type InstagramSession } from '../model/instagramClient';
import { colors } from '../theme/tokens';

const ACCOUNT_GUIDE = 'https://help.beeper.com/instagram';
const PASSWORD_GUIDE = 'https://help.beeper.com/quick-references/how-can-i-reset-or-set-a-password';
const RECOVERY_GUIDE = 'https://help.beeper.com/en_US/ios/saving-your-beeper-recovery-code-on-beeper-ios';

export function InstagramSetupScreen({ session, onSession, onBack }: {
  session: InstagramSession;
  onSession: (value: InstagramSession) => void;
  onBack: () => void;
}) {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const verification = session.state === 'verificationRequired';

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function connect() {
    if (!instagramSession || inFlight.current || !secret.trim() || (!verification && !username.trim())) return;
    inFlight.current = true;
    setWorking(true);
    setError('');
    try {
      const next = verification
        ? await instagramSession.verify(secret.trim())
        : await instagramSession.signIn(username.trim(), secret);
      onSession(next);
      if (mounted.current) setSecret('');
    } catch {
      if (mounted.current) setError(verification
        ? 'Couldn’t verify this device. Check your recovery code and try again.'
        : 'Couldn’t sign in. Check your Beeper username, Matrix password and connection.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setWorking(false);
    }
  }

  async function signOut() {
    if (!instagramSession || inFlight.current) return;
    inFlight.current = true;
    setWorking(true);
    setError('');
    try {
      await instagramSession.signOut();
      onSession({ state: 'signedOut' });
      if (mounted.current) setSecret('');
    } catch {
      if (mounted.current) setError('Couldn’t sign out. Try again.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setWorking(false);
    }
  }

  function openGuide(url: string) {
    void Linking.openURL(url).catch(() => setError('Couldn’t open the Beeper guide.'));
  }

  return <KeyboardAvoidingView style={styles.screen} behavior="padding">
    <View style={styles.header}>
      <IconButton icon="chevron-left" label="Back to Instagram inbox" onPress={onBack} />
      <Text accessibilityRole="header" style={styles.headerTitle}>Instagram account</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{verification ? 'Verify this iPhone' : session.state === 'ready' ? 'Connected to Beeper' : 'Connect through Beeper'}</Text>
      {session.state === 'ready' ? <Text style={styles.copy}>{session.userId || 'Your Instagram inbox is connected.'}</Text>
        : verification ? <>
          <Text style={styles.copy}>Use your Beeper recovery code so Quiet can decrypt your conversations on this iPhone.</Text>
          <Pressable accessibilityRole="link" onPress={() => openGuide(RECOVERY_GUIDE)} style={styles.linkButton}><Text style={styles.link}>Find your recovery code</Text></Pressable>
        </> : <>
          <Text style={styles.copy}>Connect Instagram using Beeper Cloud, then create a Matrix password for your Beeper account.</Text>
          <View style={styles.guides}>
            <Pressable accessibilityRole="link" onPress={() => openGuide(ACCOUNT_GUIDE)} style={styles.linkButton}><Text style={styles.link}>Connect Instagram in Beeper</Text></Pressable>
            <Pressable accessibilityRole="link" onPress={() => openGuide(PASSWORD_GUIDE)} style={styles.linkButton}><Text style={styles.link}>Create a Matrix password</Text></Pressable>
          </View>
          <Text style={styles.note}>Beeper Cloud processes Instagram messages to sync them to Quiet.</Text>
          <Text style={styles.label}>Beeper username or email</Text>
          <TextInput accessibilityLabel="Beeper username or email" style={styles.input} value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false} editable={!working} autoComplete="username" />
        </>}
      {session.state !== 'ready' && <>
        <Text style={styles.label}>{verification ? 'Beeper recovery code' : 'Beeper Matrix password'}</Text>
        <TextInput key={session.state} accessibilityLabel={verification ? 'Beeper recovery code' : 'Beeper Matrix password'}
          style={styles.input} value={secret} onChangeText={setSecret} secureTextEntry
          autoCapitalize="none" autoCorrect={false} autoComplete={verification ? 'off' : 'current-password'} editable={!working}
          onSubmitEditing={() => { void connect(); }} />
        <PrimaryButton title={verification ? 'Verify iPhone' : 'Sign in to Beeper'} icon="lock" onPress={() => { void connect(); }}
          disabled={working || !secret.trim() || (!verification && !username.trim())} />
      </>}
      {working && <ActivityIndicator color={colors.green} accessibilityLabel="Connecting to Beeper" />}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {session.state !== 'signedOut' && <Pressable accessibilityRole="button" onPress={() => { void signOut(); }}
        disabled={working} style={styles.linkButton}><Text style={styles.link}>Disconnect from Quiet</Text></Pressable>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 57, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  content: { padding: 22, paddingBottom: 32, gap: 14 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.7 },
  copy: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  guides: { gap: 2 },
  linkButton: { minHeight: 44, justifyContent: 'center' },
  link: { color: colors.green, fontSize: 15, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: colors.surface, color: colors.ink, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  error: { color: colors.amber, fontSize: 14, lineHeight: 20 },
});
