import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, AppState, BackHandler, FlatList, Image, KeyboardAvoidingView,
  PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { Easing, FadeInRight, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { selectionHaptic } from '../components/Motion';
import { Icon, IconButton, PrimaryButton, type IconName } from '../components/Primitives';
import type { InboxChat, InboxClient, InboxMessage, InboxPlatformId } from '../model/inbox';
import { colors, motion } from '../theme/tokens';

const platformName: Record<InboxPlatformId, string> = { instagram: 'Instagram', tiktok: 'TikTok' };
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const conversationDate = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const threadEntrance = FadeInRight.duration(motion.entrance)
  .easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System);

type InboxScreenProps = {
  platform: InboxPlatformId;
  client: InboxClient | null;
  onClose: () => void;
  onSetup: () => void;
  connectionUnavailableReason?: string;
  connectionActionLabel?: string;
};

export function InboxScreen({
  platform, client, onClose, onSetup, connectionUnavailableReason, connectionActionLabel,
}: InboxScreenProps) {
  if (client) return <ConnectedInbox key={platform} platform={platform} client={client} onClose={onClose} />;

  const actionLabel = connectionActionLabel ?? (connectionUnavailableReason ? undefined : `Connect ${platformName[platform]}`);
  return <View style={styles.screen} onAccessibilityEscape={onClose}>
    <InboxHeader title={platformName[platform]} onBack={onClose} backLabel="Back to Quiet home" />
    <InboxNotice
      icon={connectionUnavailableReason ? 'cloud-off' : 'message-circle'}
      title={connectionUnavailableReason ? actionLabel ? 'Connection required' : 'Messaging unavailable' : 'Connect your messages'}
      description={connectionUnavailableReason ?? `Connect ${platformName[platform]} to view and reply to your messages in Quiet.`}
      action={actionLabel ? { label: actionLabel, onPress: onSetup } : undefined}
    />
  </View>;
}

function ConnectedInbox({ platform, client, onClose }: { platform: InboxPlatformId; client: InboxClient; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<InboxChat | null>(null);
  const loadChats = useCallback(() => client.listChats(platform), [client, platform]);
  const { items, refreshing, failed, refresh } = useInboxData(loadChats, 10_000, chat === null);
  const search = query.trim().toLocaleLowerCase();
  const chats = useMemo(() => (items ?? [])
    .filter(item => !search || item.title.toLocaleLowerCase().includes(search))
    .sort((left, right) => timestamp(right.updatedAt) - timestamp(left.updatedAt)), [items, search]);
  const backToMessages = useCallback(() => setChat(null), []);

  if (chat) return <ChatThread key={chat.id} chat={chat} platform={platform} client={client} onBack={backToMessages} />;

  return <View style={styles.screen} onAccessibilityEscape={onClose}>
    <InboxHeader title={platformName[platform]} onBack={onClose} backLabel="Back to Quiet home" onRefresh={refresh} refreshing={refreshing} />
    <View style={styles.inboxTitleBlock}>
      <Text accessibilityRole="header" style={styles.inboxTitle}>Messages</Text>
      <View style={styles.search}>
        <Icon name="search" size={19} color={colors.muted} />
        <TextInput accessibilityLabel="Search conversations" style={styles.searchField} placeholder="Search conversations"
          placeholderTextColor={colors.muted} value={query} onChangeText={setQuery}
          autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" returnKeyType="search" />
      </View>
    </View>
    {failed && items && <Text accessibilityRole="alert" style={styles.status}>Couldn’t refresh messages. Pull down to try again.</Text>}
    <FlatList data={chats} keyExtractor={item => item.id}
      style={styles.list} contentContainerStyle={chats.length ? styles.chatList : styles.emptyList}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false} onRefresh={refresh} refreshing={refreshing}
      renderItem={({ item }) => <ChatRow chat={item} onPress={() => setChat(item)} />}
      ListEmptyComponent={items === null
        ? failed
          ? <InboxNotice icon="cloud-off" title="Couldn’t load messages" description="Check your connection and try again."
              action={{ label: 'Try again', onPress: refresh }} />
          : <Loading label="Loading conversations" />
        : <InboxNotice icon={search ? 'search' : 'message-circle'} title={search ? 'No matches' : 'No conversations yet'}
            description={search ? 'Search for a different name.' : 'Your conversations will appear here.'} />}
    />
  </View>;
}

function ChatThread({ chat, platform, client, onBack }: {
  chat: InboxChat;
  platform: InboxPlatformId;
  client: InboxClient;
  onBack: () => void;
}) {
  const loadMessages = useCallback(() => client.listMessages(platform, chat.id), [client, platform, chat.id]);
  const { items, refreshing, failed, refresh } = useInboxData(loadMessages, 5_000);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [recentlySent, setRecentlySent] = useState<InboxMessage[]>([]);
  const list = useRef<FlatList<InboxMessage>>(null);
  const sendingRef = useRef(false);
  const mounted = useRef(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    mounted.current = true;
    const hardware = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => {
      mounted.current = false;
      hardware.remove();
    };
  }, [onBack]);

  const swipeBack = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, state) =>
      Platform.OS === 'ios' && state.moveX - state.dx < 24 && state.dx > 14 && state.dx > Math.abs(state.dy) * 2,
    onPanResponderRelease: (_event, state) => {
      if (state.dx > 65) onBack();
    },
  }), [onBack]);

  const messages = useMemo(() => {
    const byId = new Map(recentlySent.map(message => [message.id, message]));
    for (const message of items ?? []) byId.set(message.id, message);
    return [...byId.values()].sort((left, right) => timestamp(right.sentAt) - timestamp(left.sentAt));
  }, [items, recentlySent]);

  useEffect(() => {
    if (!items?.length) return;
    const syncedIds = new Set(items.map(message => message.id));
    setRecentlySent(current => current.some(message => syncedIds.has(message.id))
      ? current.filter(message => !syncedIds.has(message.id))
      : current);
  }, [items]);

  async function send() {
    const body = draft.trim();
    if (!body || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendFailed(false);
    try {
      const message = await client.sendMessage(platform, chat.id, body);
      if (!mounted.current) return;
      setRecentlySent(current => [...current, message]);
      setDraft(current => current === draft ? '' : current);
      list.current?.scrollToOffset({ offset: 0, animated: !reducedMotion });
    } catch {
      if (mounted.current) setSendFailed(true);
    } finally {
      sendingRef.current = false;
      if (mounted.current) setSending(false);
    }
  }

  const sendDisabled = sending || !draft.trim() || items === null;

  return <Animated.View style={styles.screen} entering={reducedMotion ? undefined : threadEntrance}
    onAccessibilityEscape={onBack} {...swipeBack.panHandlers}>
    <InboxHeader title={chat.title} chat={chat} onBack={onBack} backLabel="Back to messages"
      onRefresh={refresh} refreshing={refreshing} />
    <KeyboardAvoidingView style={styles.list} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {failed && items && <Text accessibilityRole="alert" style={styles.status}>Couldn’t refresh this conversation.</Text>}
      {items === null && (failed
        ? <InboxNotice icon="cloud-off" title="Couldn’t load this conversation" description="Check your connection and try again."
            action={{ label: 'Try again', onPress: refresh }} />
        : <Loading label="Loading messages" />)}
      {items && <FlatList ref={list} data={messages} keyExtractor={item => item.id}
        style={styles.list} contentContainerStyle={messages.length ? styles.threadList : styles.emptyList}
        inverted={messages.length > 0}
        maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 60 }}
        keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        renderItem={({ item, index }) => {
          const older = messages[index + 1];
          const showDay = !older || localDate(older.sentAt) !== localDate(item.sentAt);
          return <MessageBubble message={item} showDay={showDay} />;
        }}
        ListEmptyComponent={<InboxNotice icon="message-circle" title="No messages yet" description="Send a message to start the conversation." />} />}
      {sendFailed && <Text accessibilityRole="alert" style={styles.status}>Couldn’t confirm sending. Check the conversation before trying again.</Text>}
      <View style={styles.composer}>
        <TextInput accessibilityLabel="Message" style={styles.composerField} placeholder="Message…"
          placeholderTextColor={colors.muted} value={draft} onChangeText={setDraft} multiline
          textAlignVertical="center" editable={items !== null} maxLength={2000} />
        <Pressable accessibilityRole="button" accessibilityLabel="Send message"
          accessibilityState={{ busy: sending, disabled: sendDisabled }}
          disabled={sendDisabled} onPress={() => { selectionHaptic(); void send(); }}
          style={({ pressed }) => [styles.send, sendDisabled && styles.disabled, pressed && styles.pressed]}>
          {sending ? <ActivityIndicator color={colors.onAccent} /> : <Icon name="send" color={colors.onAccent} size={19} />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  </Animated.View>;
}

function InboxHeader({ title, chat, onBack, backLabel, onRefresh, refreshing }: {
  title: string;
  chat?: InboxChat;
  onBack: () => void;
  backLabel: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return <View style={styles.header}>
    <IconButton icon="chevron-left" label={backLabel} onPress={onBack} />
    {chat && <Avatar chat={chat} size={34} />}
    <Text accessibilityRole="header" numberOfLines={1} style={styles.headerTitle}>{title}</Text>
    {onRefresh && <IconButton icon="refresh-cw" label="Refresh messages" disabled={refreshing} onPress={onRefresh} />}
  </View>;
}

function ChatRow({ chat, onPress }: { chat: InboxChat; onPress: () => void }) {
  return <Pressable accessibilityRole="button"
    accessibilityLabel={[chat.title, chat.unread && 'Unread', chat.preview].filter(Boolean).join('. ')}
    onPress={() => { selectionHaptic(); onPress(); }}
    style={({ pressed }) => [styles.chatRow, pressed && styles.rowPressed]}>
    <Avatar chat={chat} size={53} />
    <View style={styles.chatText}>
      <Text style={[styles.chatName, chat.unread && styles.unread]} numberOfLines={1}>{chat.title}</Text>
      <Text style={[styles.chatPreview, chat.unread && styles.unread]} numberOfLines={1}>{chat.preview || 'Conversation'}</Text>
    </View>
    <View style={styles.chatMeta}>
      <Text style={styles.meta}>{formatTime(chat.updatedAt)}</Text>
      {chat.unread && <View style={styles.unreadDot} />}
    </View>
  </Pressable>;
}

function Avatar({ chat, size }: { chat: InboxChat; size: number }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const initial = Array.from(chat.title.trim())[0]?.toLocaleUpperCase() ?? '';
  const url = chat.avatarUrl;
  return <View accessible={false} style={[styles.avatar, { width: size, height: size }]}>
    {url?.startsWith('https://') && url !== failedUrl
      ? <Image source={{ uri: url }} style={styles.avatarImage} onError={() => setFailedUrl(url)} />
      : <Text style={[styles.avatarText, { fontSize: Math.round(size * 0.36) }]}>{initial || '•'}</Text>}
  </View>;
}

function MessageBubble({ message, showDay }: { message: InboxMessage; showDay: boolean }) {
  const sent = timestamp(message.sentAt);
  return <View style={styles.message}>
    {showDay && sent !== 0 && <Text style={styles.date}>{conversationDate.format(sent)}</Text>}
    <View style={[styles.messageGroup, message.outgoing && styles.outgoingGroup]}>
      {!message.outgoing && message.senderName && <Text style={styles.sender}>{message.senderName}</Text>}
      <View style={[styles.bubble, message.outgoing && styles.outgoingBubble]}>
        <Text selectable style={[styles.messageText, message.outgoing && styles.outgoingText]}>{message.text}</Text>
      </View>
      {sent !== 0 && <Text style={styles.meta}>{timeFormat.format(sent)}</Text>}
    </View>
  </View>;
}

function InboxNotice({ icon, title, description, action }: {
  icon: IconName;
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}) {
  return <View style={styles.notice}>
    <View style={styles.noticeIcon}><Icon name={icon} size={29} color={colors.green} /></View>
    <Text accessibilityRole="header" style={styles.noticeTitle}>{title}</Text>
    <Text style={styles.noticeDescription}>{description}</Text>
    {action && <View style={styles.noticeAction}>
      <PrimaryButton title={action.label} onPress={action.onPress} />
    </View>}
  </View>;
}

function Loading({ label }: { label: string }) {
  return <View style={styles.loading}>
    <ActivityIndicator color={colors.green} accessibilityLabel={label} />
    <Text style={styles.noticeDescription}>{label}</Text>
  </View>;
}

function useInboxData<T>(load: () => Promise<T[]>, interval: number, active = true) {
  const [snapshot, setSnapshot] = useState<{
    load: () => Promise<T[]>;
    items: T[] | null;
    failed: boolean;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!active) return;
    let running = false;
    let mounted = true;

    async function update(manual = false) {
      if (running || !mounted) return;
      running = true;
      if (manual) setRefreshing(true);
      try {
        const items = await load();
        if (mounted) setSnapshot({ load, items, failed: false });
      } catch {
        if (mounted) setSnapshot(previous => ({ load, items: previous?.load === load ? previous.items : null, failed: true }));
      } finally {
        running = false;
        if (mounted) setRefreshing(false);
      }
    }

    refreshRef.current = () => { void update(true); };
    void update();
    const ticker = setInterval(() => {
      if (AppState.currentState === 'active' || Platform.OS === 'web') void update();
    }, interval);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void update();
    });
    return () => {
      mounted = false;
      clearInterval(ticker);
      subscription.remove();
    };
  }, [load, interval, active]);

  const refresh = useCallback(() => refreshRef.current(), []);
  const current = snapshot?.load === load ? snapshot : null;
  return { items: current?.items ?? null, failed: current?.failed ?? false, refreshing, refresh };
}

function timestamp(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function localDate(value: string) {
  return new Date(timestamp(value)).toDateString();
}

function formatTime(value: string) {
  const time = timestamp(value);
  if (!time) return '';
  const today = new Date().toDateString();
  return (localDate(value) === today ? timeFormat : dateFormat).format(time);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  list: { flex: 1 },
  header: {
    minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.separator,
  },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: '700' },
  inboxTitleBlock: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12, gap: 13 },
  inboxTitle: { color: colors.ink, fontSize: 33, fontWeight: '700', letterSpacing: -1.1 },
  search: {
    minHeight: 45, borderRadius: 13, borderCurve: 'continuous', flexDirection: 'row', gap: 9,
    alignItems: 'center', paddingHorizontal: 12, backgroundColor: colors.soft,
  },
  searchField: { flex: 1, paddingVertical: 10, color: colors.ink, fontSize: 16 },
  chatList: { paddingTop: 4, paddingBottom: 18 },
  chatRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 73, gap: 13, paddingVertical: 10, paddingHorizontal: 18,
  },
  rowPressed: { backgroundColor: colors.soft },
  avatar: { overflow: 'hidden', borderRadius: 100, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.green, fontWeight: '600' },
  chatText: { flex: 1, gap: 4 },
  chatName: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  chatPreview: { color: colors.muted, fontSize: 14 },
  unread: { color: colors.ink, fontWeight: '700' },
  chatMeta: { alignItems: 'flex-end', justifyContent: 'center', gap: 7, minWidth: 46 },
  unreadDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: colors.green },
  meta: { fontSize: 11, color: colors.muted, fontVariant: ['tabular-nums'] },
  emptyList: { flexGrow: 1 },
  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  noticeIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  noticeTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  noticeDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  noticeAction: { minWidth: 180, maxWidth: '100%', marginTop: 8 },
  loading: { flex: 1, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 8 },
  status: { color: colors.amber, backgroundColor: colors.lightAmber, paddingHorizontal: 16, paddingVertical: 8, fontSize: 13 },
  threadList: { paddingHorizontal: 15, paddingVertical: 11 },
  message: { marginVertical: 4 },
  date: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 16, marginBottom: 10 },
  messageGroup: { alignItems: 'flex-start', gap: 3 },
  outgoingGroup: { alignItems: 'flex-end' },
  sender: { fontSize: 12, fontWeight: '600', color: colors.muted, paddingHorizontal: 6 },
  bubble: { maxWidth: '83%', backgroundColor: colors.soft, borderRadius: 19, borderCurve: 'continuous', paddingHorizontal: 13, paddingVertical: 9 },
  outgoingBubble: { backgroundColor: colors.green },
  messageText: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  outgoingText: { color: colors.onAccent },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.separator,
  },
  composerField: {
    flex: 1, minHeight: 46, maxHeight: 132, borderRadius: 22, borderCurve: 'continuous',
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.soft,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.44 },
  pressed: { opacity: 0.7 },
});
