import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildFilterScript } from '../filter/script';
import { demoHTML } from '../filter/fixtures';
import { colors } from '../theme/tokens';
import { Icon, IconButton } from './Primitives';
import type { BrowserSurfaceProps } from './BrowserSurface.types';

export default function BrowserSurface({ platform, onClose }: BrowserSurfaceProps) {
  const [reload, setReload] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const html = useMemo(() => demoHTML(platform.id).replace('</head>', `<script>${buildFilterScript(platform.id, true)}</script></head>`), [platform.id]);
  return <View style={styles.container}>
    <View style={styles.header}><IconButton icon="x" label="Back to Quiet home" onPress={onClose} />
      <View style={styles.heading}><Text style={styles.title}>{platform.name} website</Text><Text style={styles.subtitle}>Local browser preview</Text></View>
      <IconButton icon="shield" label="Filter status and website help" onPress={() => setShowHelp(value => !value)} />
    </View>
    <View style={styles.notice}><Icon name="info" size={16} color={colors.amber} /><Text style={styles.noticeText}>Sample content only. Real sign-ins require the iPhone app.</Text></View>
    {showHelp && <View style={styles.help}><Text style={styles.helpTitle}>YouTube Shorts filter</Text><Text style={styles.helpText}>{platform.description}</Text>
      <Pressable accessibilityRole="button" onPress={() => setShowHelp(false)} style={styles.close}><Text style={styles.helpTitle}>Close help</Text></Pressable>
    </View>}
    {React.createElement('iframe', { key: reload, title: `${platform.name} filtering demo`, srcDoc: html, sandbox: 'allow-scripts allow-same-origin', style: { width: '100%', flex: 1, border: 0, background: 'white' } })}
    <View style={styles.toolbar}><IconButton icon="home" label="Back to Quiet home" onPress={onClose} /><View style={styles.status}><View style={styles.dot} /><Text style={styles.subtitle}>Sample filters applied</Text></View><IconButton icon="rotate-cw" label="Reload sample content" onPress={() => setReload(value => value + 1)} /></View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', padding: 8, minHeight: 62 }, heading: { flex: 1, alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink }, subtitle: { fontSize: 11, color: colors.muted, marginTop: 3 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.lightAmber }, noticeText: { color: colors.amber, fontSize: 10, flex: 1, lineHeight: 16 },
  toolbar: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderTopColor: colors.line, borderTopWidth: 1 }, status: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  help: { backgroundColor: colors.lightGreen, padding: 18, gap: 9 }, helpTitle: { fontSize: 13, fontWeight: '600', color: colors.green }, helpText: { fontSize: 12, lineHeight: 18, color: colors.muted }, close: { paddingVertical: 10 },
});
