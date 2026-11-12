import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand, Eyebrow, Icon, PrimaryButton, type IconName } from '../components/Primitives';
import { colors, fonts } from '../theme/tokens';
import { Reveal } from '../components/Motion';
import { QuietSprig } from '../components/QuietSprig';

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const steps: { icon: IconName; title: string; copy: string }[] = [
    { icon: 'heart', title: 'Keep the connection', copy: 'Open social websites here for conversations, profiles and regular videos.' },
    { icon: 'shield', title: 'Leave the loops behind', copy: 'Reels, Shorts, TikTok feeds and Snapchat Spotlight stay hidden. Direct short-video links are blocked too.' },
    { icon: 'lock', title: 'Your accounts stay yours', copy: 'Sign in on each platform’s own website. Quiet has no account, analytics or server collecting your browsing.' },
  ];
  return <ScrollView contentContainerStyle={styles.content}>
    <Brand />
    <Reveal><View style={styles.hero}>
      <Eyebrow>A LITTLE MORE INTENTION</Eyebrow>
      <Text accessibilityRole="header" style={styles.title}>Social, with room{"\n"}to <Text style={styles.italic}>breathe.</Text></Text>
      <Text style={styles.intro}>The people you came for.{"\n"}A little space for everything else.</Text>
      <View style={styles.art}><QuietSprig settle /></View>
    </View></Reveal>
    <View style={styles.steps}>{steps.map((step, index) => <Reveal key={step.title} order={index + 1}><View style={styles.step}>
      <View style={styles.stepIcon}><Icon name={step.icon} size={19} color={colors.green} /></View>
      <View style={{ flex: 1 }}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepCopy}>{step.copy}</Text></View>
    </View></Reveal>)}</View>
    <Reveal order={4}><View style={styles.disclaimer}><Text style={styles.disclaimerCopy}>Quiet uses websites inside its own app. It doesn’t alter your installed apps. Some sign-ins and native features may be unavailable; TikTok and Snapchat support is experimental.</Text></View></Reveal>
    <Reveal order={5}><PrimaryButton title="Find my quieter corner" onPress={onContinue} /></Reveal>
    <Text style={styles.footer}>No subscription. No Quiet account. Just a little space.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 28, paddingTop: 22, gap: 24, flexGrow: 1, justifyContent: 'center' },
  hero: { gap: 18, paddingTop: 30, paddingBottom: 16 },
  art: { position: 'absolute', right: -10, bottom: -1, opacity: 0.7, zIndex: -1 },
  title: { fontFamily: fonts.editorial, fontSize: 42, lineHeight: 49, letterSpacing: -1.5, color: colors.ink, zIndex: 1 },
  italic: { fontStyle: 'italic', color: '#71876B' },
  intro: { fontSize: 14, color: colors.muted, lineHeight: 22, maxWidth: '80%', zIndex: 1 }, steps: { gap: 24, marginVertical: 7 },
  step: { flexDirection: 'row', gap: 14 }, stepIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.lightGreen },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 5 },
  stepCopy: { fontSize: 12, lineHeight: 20, color: colors.muted },
  disclaimer: { backgroundColor: colors.soft, borderRadius: 16, borderCurve: 'continuous', padding: 15 }, disclaimerCopy: { fontSize: 11, lineHeight: 18, color: colors.muted },
  footer: { fontSize: 10, color: colors.muted, textAlign: 'center', lineHeight: 16 },
});
