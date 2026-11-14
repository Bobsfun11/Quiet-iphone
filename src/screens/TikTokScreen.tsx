import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton, PrimaryButton } from '../components/Primitives';
import type { InboxClient } from '../model/inbox';
import { nativeTikTokPassport, openTikTokAttempt, openTikTokInbox } from '../tiktok/nativePassport';
import { colors } from '../theme/tokens';
import { InboxScreen } from './InboxScreen';

type Attempt = Awaited<ReturnType<typeof openTikTokAttempt>>;

export function TikTokScreen({ onClose }: { onClose: () => void }) {
  const [client, setClient] = useState<InboxClient | null>(null);
  const [image, setImage] = useState<string>();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const activeAttempt = useRef<Attempt | undefined>(undefined);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current += 1;
    const active = activeAttempt.current;
    if (active) void active.native.closeTikTokAttempt(active.attempt.id).catch(() => {});
  }, []);

  useEffect(() => {
    if (!image) return;
    const active = activeAttempt.current;
    if (!active) return;
    const current = generation.current;
    let checking = false;
    async function check() {
      if (!active || checking || AppState.currentState !== 'active' || current !== generation.current) return;
      checking = true;
      try {
        const result = await active.challenge.poll();
        if (current !== generation.current) return;
        if (result === 'new') {
          setStatus('');
        } else if (result === 'scanned') {
          setStatus('Confirm the request in TikTok, then return to Quiet.');
        } else if (result === 'confirmed') {
          setBusy(true);
          setStatus('Checking access to your conversations…');
          try {
            const next = await openTikTokInbox(active);
            if (current === generation.current) setClient(next);
          } catch {
            if (current === generation.current) setStatus('TikTok approved sign-in, but Quiet couldn’t access your conversations.');
          } finally {
            if (current === generation.current) { setImage(undefined); setBusy(false); }
          }
        } else {
          setImage(undefined);
          setStatus(result === 'expired' ? 'The code expired. Request a new one.'
            : 'TikTok asked for extra verification. This test can’t complete that step.');
        }
      } catch {
        if (current === generation.current) setStatus('Couldn’t check the code. Quiet will try again.');
      } finally {
        checking = false;
      }
    }
    const timer = setInterval(() => { void check(); }, 3_500);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [image]);

  async function start() {
    if (busy) return;
    const current = ++generation.current;
    setBusy(true);
    setImage(undefined);
    setStatus('');
    try {
      const active = await openTikTokAttempt();
      if (current !== generation.current) {
        await active.native.closeTikTokAttempt(active.attempt.id);
        return;
      }
      activeAttempt.current = active;
      await active.challenge.start();
      if (!active.challenge.imageUri) throw new Error('TikTok returned no QR image.');
      if (current === generation.current) setImage(active.challenge.imageUri);
    } catch {
      if (current === generation.current) setStatus('Couldn’t get a sign-in code from TikTok. Try again.');
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  if (client) return <InboxScreen platform="tiktok" client={client} onClose={onClose} onSetup={() => {}} />;
  if (!nativeTikTokPassport) return <InboxScreen platform="tiktok" client={null} onClose={onClose} onSetup={() => {}}
    connectionUnavailableReason="TikTok sign-in is available in the iPhone build." />;

  return <View style={styles.screen} onAccessibilityEscape={onClose}>
    <View style={styles.header}>
      <IconButton icon="chevron-left" label="Back to Quiet home" onPress={onClose} />
      <Text accessibilityRole="header" style={styles.headerTitle}>TikTok</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>Connect TikTok</Text>
      <Text style={styles.text}>Try opening your existing conversations in Quiet. Sending is still unavailable in this test.</Text>
      {image && !busy && <>
        <View style={styles.qr}>
          <Image source={{ uri: image }} style={styles.image} accessibilityLabel="TikTok sign-in QR code" />
        </View>
        <Text style={styles.text}>Take a screenshot. In TikTok, open your profile’s QR scanner, select the screenshot from Photos, and approve the sign-in. Then return here.</Text>
      </>}
      {status ? <Text accessibilityLiveRegion="polite" style={styles.text}>{status}</Text> : null}
      {busy ? <ActivityIndicator color={colors.green} accessibilityLabel="Connecting to TikTok" />
        : <PrimaryButton title={image ? 'Get a new code' : 'Get sign-in code'} icon="lock" onPress={() => { void start(); }} />}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 57, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  content: { padding: 22, paddingBottom: 32, gap: 16 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '700' },
  text: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  qr: { alignSelf: 'center', padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF' },
  image: { width: 212, height: 212 },
});
