import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { Icon } from '@/components/icon';
import { AppText } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';
import type { ChatMessage } from '@/types/domain';

export default function ChatThreadScreen() {
  const router = useRouter();
  const { id: rawId, personId } = useLocalSearchParams<{ id: string; personId?: string }>();
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const app = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const chat = app.chats.find((item) => item.id === conversationId);
  const userId = typeof personId === 'string' ? personId : conversationId?.replace(/^chat-/, '') ?? '';
  const person = chat?.person ?? app.friends.find((item) => item.id === userId);
  const title = person?.displayName ?? 'Conversation';

  useEffect(() => {
    let active = true;
    if (!conversationId) {
      setLoading(false);
      return;
    }
    app.loadMessages(conversationId).then((items) => {
      if (active) setMessages(items);
    }).catch(() => {
      if (active) app.showToast('Could not load this conversation');
    }).finally(() => {
      if (active) setLoading(false);
    });
    const stopLive = app.subscribeMessages(conversationId, (next) => setMessages(next), (error) => app.showToast(error.message));
    return () => { active = false; stopLive(); };
  }, [conversationId, app.loadMessages, app.subscribeMessages, app.showToast]);

  const emptyMessage = useMemo(() => Boolean(person && messages.length === 0 && !loading), [messages.length, loading, person]);

  async function send() {
    const value = draft.trim();
    if (!value || !conversationId || !person) return;
    setDraft('');
    try {
      await app.sendMessage(conversationId, value);
      setMessages(await app.loadMessages(conversationId));
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setDraft(value);
      app.showToast('Message could not be sent. Try again.');
    }
  }

  async function sendPhoto() {
    if (!conversationId || !person || !app.sendPhoto) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.86, exif: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      await app.sendPhoto(conversationId, { uri: asset.uri, contentType: asset.mimeType ?? 'image/jpeg', size: asset.fileSize ?? 0 });
      setMessages(await app.loadMessages(conversationId));
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      app.showToast(error instanceof Error ? error.message : 'Photo could not be sent. Try again.');
    } finally { setUploadingPhoto(false); }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to chats" onPress={() => router.back()} style={styles.backButton}>
            <Icon name="back" size={20} color={colors.text} />
            <AppText variant="body">Back</AppText>
          </Pressable>
          {person ? <ElsefolkAvatar user={person} size={38} /> : null}
          <AppText variant="name" style={styles.headerName}>{title}</AppText>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}>
          {loading ? <AppText variant="secondary" color={colors.muted} style={styles.emptyText}>Loading conversation…</AppText> : null}
          {!loading && !person ? <AppText variant="secondary" color={colors.muted} style={styles.emptyText}>This conversation is unavailable.</AppText> : null}
          {emptyMessage ? <AppText variant="secondary" color={colors.muted} style={styles.emptyText}>Send a message to start your conversation.</AppText> : null}
          {messages.map((message) => {
            const sent = message.senderId === 'you' || message.senderId === app.profile?.id;
            return (
              <View key={message.id} style={[styles.bubble, sent ? styles.sentBubble : styles.receivedBubble]}>
                {message.imageUrl ? <Image accessibilityLabel="Shared photo" source={{ uri: message.imageUrl }} resizeMode="cover" style={styles.photo} /> : null}
                <AppText variant="body">{message.body}</AppText>
                <AppText variant="caption" color={colors.muted} style={styles.messageTime}>{message.createdAtLabel}</AppText>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.two) }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Share a photo" disabled={uploadingPhoto || !person} onPress={() => void sendPhoto()} style={({ pressed }) => [styles.photoButton, pressed && styles.photoPressed, uploadingPhoto && styles.sendDisabled]}>
            <Icon name="plus" size={20} color={colors.brand} />
          </Pressable>
          <TextInput
            accessibilityLabel="Message"
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => void send()}
            placeholder="Message"
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.composerInput}
            value={draft}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim() || !person} onPress={() => void send()} style={({ pressed }) => [styles.sendButton, (!draft.trim() || !person) && styles.sendDisabled, pressed && styles.sendPressed]}>
            <Icon name="send" size={19} color={colors.surface} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.screen },
  keyboardAvoid: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.two, paddingHorizontal: spacing.four, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: spacing.two },
  headerName: { flex: 1, minWidth: 0 },
  messagesScroll: { flex: 1 },
  messageList: { flexGrow: 1, justifyContent: 'flex-end', gap: spacing.two, paddingHorizontal: spacing.four, paddingVertical: spacing.five },
  emptyText: { alignSelf: 'center', textAlign: 'center', padding: spacing.five },
  bubble: { maxWidth: '84%', minWidth: 74, paddingHorizontal: 13, paddingTop: 10, paddingBottom: 7, borderRadius: 16 },
  photo: { width: 220, height: 180, borderRadius: 11, marginBottom: 6, backgroundColor: colors.border },
  sentBubble: { alignSelf: 'flex-end', backgroundColor: colors.lilac, borderBottomRightRadius: 5 },
  receivedBubble: { alignSelf: 'flex-start', backgroundColor: colors.field, borderBottomLeftRadius: 5 },
  messageTime: { alignSelf: 'flex-end', marginTop: 3, fontSize: 11 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.two, paddingHorizontal: spacing.four, paddingTop: spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.screen },
  photoButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac },
  photoPressed: { opacity: 0.7 },
  composerInput: { flex: 1, minHeight: 46, maxHeight: 112, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 23, backgroundColor: colors.field, color: colors.text, fontSize: 14, lineHeight: 20 },
  sendButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: colors.brand },
  sendDisabled: { opacity: 0.48 },
  sendPressed: { backgroundColor: colors.brandPressed },
});
