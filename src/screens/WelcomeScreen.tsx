import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand, Icon, PrimaryButton, type IconName } from '../components/Primitives';
import { colors, fonts } from '../theme/tokens';
import { Reveal } from '../components/Motion';
import { QuietSprig } from '../components/QuietSprig';

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const steps: { icon: IconName; title: string; copy: string }[] = [
    { icon: 'message-circle', title: 'Choose an inbox', copy: 'Open Instagram or TikTok from your home screen.' },
    { icon: 'lock', title: 'Account access', copy: 'A supported account connection is required to load or send messages.' },
  ];
  return <ScrollView contentContainerStyle={styles.content}>
    <Brand />
    <Reveal><View style={styles.hero}>
      <Text accessibilityRole="header" style={styles.title}>Quiet{"\n"}<Text style={styles.italic}>inboxes.</Text></Text>
      <View style={styles.art}><QuietSprig settle /></View>
    </View></Reveal>
    <View style={styles.steps}>{steps.map((step, index) => <Reveal key={step.title} order={index + 1}><View style={styles.step}>
      <View style={styles.stepIcon}><Icon name={step.icon} size={19} color={colors.green} /></View>
      <View style={{ flex: 1 }}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepCopy}>{step.copy}</Text></View>
    </View></Reveal>)}</View>
    <Reveal order={3}><PrimaryButton title="Continue" onPress={onContinue} /></Reveal>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 28, paddingTop: 22, gap: 24, flexGrow: 1, justifyContent: 'center' },
  hero: { gap: 18, paddingTop: 30, paddingBottom: 16 },
  art: { position: 'absolute', right: -10, bottom: -1, opacity: 0.7, zIndex: -1 },
  title: { fontFamily: fonts.editorial, fontSize: 42, lineHeight: 49, letterSpacing: -1.5, color: colors.ink, zIndex: 1 },
  italic: { fontStyle: 'italic', color: colors.sage },
  steps: { gap: 24, marginVertical: 7 },
  step: { flexDirection: 'row', gap: 14 }, stepIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.lightGreen },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 5 },
  stepCopy: { fontSize: 12, lineHeight: 20, color: colors.muted },
});
