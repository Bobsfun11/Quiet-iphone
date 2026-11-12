import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { WebViewNavigationEvent, ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { buildFilterScript } from '../filter/script';
import { navigationDecision } from '../filter/policy';
import { parseFilterMessage } from '../filter/bridge';
import { DESKTOP_USER_AGENT } from '../model/platforms';
import { colors, fonts } from '../theme/tokens';
import { useReducedMotion } from 'react-native-reanimated';
import { Icon, IconButton, PrimaryButton } from './Primitives';
import type { BrowserSurfaceProps } from './BrowserSurface.types';

export default function BrowserSurface({ platform, desktop, launchInInbox, onClose, onToggleDesktop }: BrowserSurfaceProps) {
  const web = useRef<WebView<{}>>(null);
  const reducedMotion = useReducedMotion();
  const entry = launchInInbox && platform.inbox ? platform.inbox : platform.home;
  const [source, setSource] = useState({ uri: entry });
  const [navigation, setNavigation] = useState({ canGoBack: false, canGoForward: false, url: entry });
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const script = useMemo(() => buildFilterScript(platform.id), [platform.id]);
  const safeEntry = useCallback(() => { setError(null); setSource({ uri: entry }); }, [entry]);

  const openExternal = useCallback((raw: string) => {
    let url: URL;
    try { url = new URL(raw); } catch { return; }
    if (url.protocol !== 'https:' || url.username || url.password) {
      setNotice('App-opening links are disabled so you stay in Quiet.'); return;
    }
    Alert.alert('Open outside Quiet?', `This opens ${url.hostname} in your browser. Quiet’s filters won’t apply there.`, [
      { text: 'Stay here', style: 'cancel' },
      { text: 'Open browser', onPress: () => { Linking.openURL(url.href).catch(() => setNotice('Your browser could not open this link.')); } },
    ]);
  }, []);

  const decide = useCallback((url: string): boolean => {
    const decision = navigationDecision(url, platform.id);
    if (decision === 'allow') return true;
    if (decision === 'block-feed') setNotice('Short-video feed blocked. Your other browsing stays available.');
    else if (decision === 'external') openExternal(url);
    else setNotice('Quiet keeps you on secure websites. Links into the original apps stay disabled.');
    return false;
  }, [platform.id, openExternal]);

  const onShouldStart = useCallback((request: ShouldStartLoadRequest) => {
    // Authentication and embedded media use cross-origin subframes. Only top
    // level navigation can change the site the user is browsing.
    if (request.isTopFrame === false) {
      try { return new URL(request.url).protocol === 'https:' || request.url === 'about:blank'; }
      catch { return false; }
    }
    if (request.url === 'about:blank') return true;
    return decide(request.url);
  }, [decide]);

  const onNavigation = (state: WebViewNavigation) => {
    setNavigation({ canGoBack: state.canGoBack, canGoForward: state.canGoForward, url: state.url });
    // WKWebView also reports client-side History API navigations here. The
    // document-start script is primary; this is an independent fallback.
    if (navigationDecision(state.url, platform.id) === 'block-feed') {
      web.current?.stopLoading(); setNotice('Short-video feed blocked.'); safeEntry();
    }
  };

  const onLoadStart = (event: WebViewNavigationEvent) => {
    if (event.nativeEvent.url !== 'about:blank') { setReady(false); setLoading(true); setProgress(0); setError(null); }
  };

  return <View style={styles.container}>
    <View style={styles.header}>
      <IconButton icon="x" label="Back to Quiet home" onPress={onClose} />
      <View style={styles.heading}><Text style={styles.title}>{platform.name} website</Text>
        <Text style={styles.origin} numberOfLines={1}>{(() => { try { return new URL(navigation.url).hostname; } catch { return 'Secure browsing'; } })()}</Text>
      </View>
      <IconButton icon="shield" label="Filter status and website help" onPress={() => setShowInfo(true)} />
    </View>
    <View style={styles.progressTrack}>{loading && <View style={[styles.progress, { width: `${Math.max(6, progress * 100)}%` }]} />}</View>
    <View style={styles.webContainer}>
      <WebView<{}> ref={web} key={`${platform.id}-${desktop ? 'desktop' : 'mobile'}`} style={styles.web}
        source={source} userAgent={desktop ? DESKTOP_USER_AGENT : undefined}
        applicationNameForUserAgent="Quiet/1.0"
        javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled
        incognito={false} cacheEnabled
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={script}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly
        injectedJavaScript={script}
        injectedJavaScriptForMainFrameOnly
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={onNavigation}
        onLoadStart={onLoadStart}
        onLoadProgress={event => setProgress(event.nativeEvent.progress)}
        onLoadEnd={() => setLoading(false)}
        onMessage={event => {
          // The bridge is only a status indicator, never an authority for
          // navigation or a transport for website/user data.
          const message = parseFilterMessage(event.nativeEvent.data);
          if (message?.type === 'ready') setReady(true);
          if (message?.type === 'feed-blocked') setNotice('That short-video feed is kept out of Quiet.');
        }}
        onOpenWindow={event => {
          if (decide(event.nativeEvent.targetUrl)) setSource({ uri: event.nativeEvent.targetUrl });
        }}
        onFileDownload={event => openExternal(event.nativeEvent.downloadUrl)}
        onError={event => {
          if (event.nativeEvent.code === -999) return;
          setLoading(false); setError('This website could not load. Check your connection, then try again.');
        }}
        onHttpError={event => {
          if (event.nativeEvent.statusCode >= 400 && event.nativeEvent.url === navigation.url) {
            setLoading(false); setError(`The website returned an error (${event.nativeEvent.statusCode}). It may limit access from embedded browsers.`);
          }
        }}
        onContentProcessDidTerminate={() => { setError('The website was paused by iOS. Reload to continue.'); setLoading(false); }}
        allowsInlineMediaPlayback allowsPictureInPictureMediaPlayback
        mediaPlaybackRequiresUserAction mediaCapturePermissionGrantType="prompt"
        allowsBackForwardNavigationGestures allowsLinkPreview={false}
        setSupportMultipleWindows={false} mixedContentMode="never"
        webviewDebuggingEnabled={__DEV__}
        autoManageStatusBarEnabled={false}
        contentInsetAdjustmentBehavior="never"
      />
      {loading && progress < 0.15 && <View style={styles.loading} pointerEvents="none"><ActivityIndicator color={colors.green} /><Text style={styles.loadingText}>Opening {platform.name}…</Text></View>}
      {error && <View style={styles.error}><Icon name="cloud-off" size={38} color={colors.muted} />
        <Text style={styles.errorTitle}>A small interruption.</Text><Text style={styles.errorText}>{error}</Text>
        <PrimaryButton title="Try again" icon="refresh-cw" onPress={() => { setError(null); web.current?.reload(); }} />
        <Pressable accessibilityRole="button" onPress={() => setShowInfo(true)} style={styles.help}><Text style={styles.helpText}>Website help & compatibility</Text></Pressable>
      </View>}
    </View>
    {notice && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notice" onPress={() => setNotice(null)} style={styles.notice}>
      <Icon name="shield" size={16} color={colors.green} /><Text style={styles.noticeText}>{notice}</Text><Icon name="x" size={15} />
    </Pressable>}
    <View style={styles.toolbar}>
      <IconButton icon="chevron-left" label="Go back" disabled={!navigation.canGoBack} onPress={() => web.current?.goBack()} />
      <IconButton icon="chevron-right" label="Go forward" disabled={!navigation.canGoForward} onPress={() => web.current?.goForward()} />
      <Pressable accessibilityRole="button" accessibilityLabel="Open platform home" onPress={safeEntry} style={styles.status}>
        <View style={[styles.dot, { backgroundColor: ready ? colors.green : colors.amber }]} />
        <Text style={styles.statusText}>{ready ? 'Filtered view' : loading ? 'Connecting' : 'Web view'}</Text>
      </Pressable>
      <IconButton icon={loading ? 'x' : 'rotate-cw'} label={loading ? 'Stop loading' : 'Reload website'}
        onPress={() => loading ? (web.current?.stopLoading(), setLoading(false)) : web.current?.reload()} />
    </View>
    <Modal visible={showInfo} transparent animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={() => setShowInfo(false)}>
      <View style={styles.scrim}><ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <View style={styles.sheetHeader}><Icon name="shield" size={26} color={colors.green} /><IconButton icon="x" label="Close website help" onPress={() => setShowInfo(false)} /></View>
        <Text style={styles.sheetTitle}>YouTube website</Text><Text style={styles.sheetCopy}>{platform.description}</Text>
        <Text style={styles.sheetCopy}>Google sign-in may limit access from embedded browsers. Sign out using YouTube’s account menu.</Text>
        <PrimaryButton title={desktop ? 'Switch to mobile website' : 'Try desktop website'} icon="monitor" onPress={() => { setShowInfo(false); setReady(false); onToggleDesktop(); }} />
        <Text style={styles.smallPrint}>No website data is sent to a Quiet server. Website changes can affect filters.</Text>
      </ScrollView></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  heading: { flex: 1, alignItems: 'center' }, title: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  origin: { fontSize: 11, color: colors.muted, marginTop: 3, maxWidth: 230 },
  progressTrack: { height: 2, backgroundColor: colors.line }, progress: { height: 2, backgroundColor: colors.green },
  webContainer: { flex: 1, backgroundColor: colors.surface }, web: { flex: 1, backgroundColor: colors.surface },
  loading: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: colors.canvas },
  loadingText: { color: colors.muted, fontSize: 13 },
  error: { position: 'absolute', inset: 0, backgroundColor: colors.canvas, justifyContent: 'center', padding: 30, gap: 20 },
  errorTitle: { fontSize: 28, fontFamily: fonts.editorial, color: colors.ink }, errorText: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  help: { minHeight: 44, justifyContent: 'center', alignItems: 'center' }, helpText: { color: colors.green, fontSize: 13 },
  toolbar: { height: 62, flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line },
  status: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7, minHeight: 44 },
  dot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 12, color: colors.muted },
  notice: { padding: 14, backgroundColor: colors.lightGreen, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, color: colors.green, fontSize: 12, lineHeight: 18 },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#14261D77' },
  sheet: { maxHeight: '92%', flexGrow: 0, backgroundColor: colors.canvas, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  sheetContent: { padding: 26, paddingBottom: 42, gap: 17 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: fonts.editorial, fontSize: 29, color: colors.ink },
  sheetCopy: { fontSize: 14, lineHeight: 21, color: colors.muted },
  smallPrint: { fontSize: 11, color: colors.muted, lineHeight: 17 },
});
