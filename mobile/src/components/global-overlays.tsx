import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { AvatarCustomizer } from '@/components/avatar-customizer';
import { AppText, Button, IconButton, SearchField, TextField } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { avatarPalettes, isUsernameAvailable } from '@/data/mock-data';
import { RequestRow } from '@/components/social-rows';
import { useApp } from '@/state/app-provider';
import type { RoomPreview, UserSummary } from '@/types/domain';

export function GlobalOverlays() {
  const router = useRouter();
  const app = useApp();
  const insets = useSafeAreaInsets();
  const findRoom = app.findRoom;
  const searchPeople = app.searchPeople;
  const [roomCode, setRoomCode] = useState('');
  const [searchResult, setSearchResult] = useState<RoomPreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [peopleResults, setPeopleResults] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(app.profile?.displayName ?? '');
  const [username, setUsername] = useState(app.profile?.username ?? '');
  const [bio, setBio] = useState(app.profile?.bio ?? '');
  const [avatarId, setAvatarId] = useState(app.profile?.avatarId ?? 4);
  const [avatarColor, setAvatarColor] = useState(app.profile?.avatarColor ?? avatarPalettes[3]);
  const [avatarMarkId, setAvatarMarkId] = useState(app.profile?.avatarMarkId ?? app.profile?.avatarId ?? 4);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (app.sheet?.kind === 'find-room') {
      setRoomCode('');
      setSearchResult(null);
    }
    if (app.sheet?.kind === 'add-friend') {
      setSearchUser('');
      setSelectedUserId(null);
    }
    if (app.sheet?.kind === 'edit-profile' && app.profile) {
      setDisplayName(app.profile.displayName);
      setUsername(app.profile.username);
      setBio(app.profile.bio ?? '');
      setAvatarId(app.profile.avatarId);
      setAvatarColor(app.profile.avatarColor);
      setAvatarMarkId(app.profile.avatarMarkId ?? app.profile.avatarId);
    }
    if (app.sheet?.kind === 'participant') setBioExpanded(false);
  }, [app.sheet, app.profile]);

  useEffect(() => {
    if (app.sheet?.kind !== 'find-room' || roomCode.length !== 4) {
      setSearching(false);
      if (roomCode.length < 4) setSearchResult(null);
      return;
    }
    let active = true;
    setSearching(true);
    findRoom(roomCode).then((room) => {
      if (!active) return;
      setSearchResult(room);
      setSearching(false);
    }).catch(() => {
      if (active) {
        setSearchResult(null);
        setSearching(false);
      }
    });
    return () => { active = false; };
  }, [findRoom, app.sheet?.kind, roomCode]);

  useEffect(() => {
    if (app.sheet?.kind !== 'add-friend' || !searchUser.trim()) {
      setPeopleResults([]);
      return;
    }
    let active = true;
    searchPeople(searchUser).then((results) => {
      if (active) setPeopleResults(results);
    }).catch(() => {
      if (active) setPeopleResults([]);
    });
    return () => { active = false; };
  }, [searchPeople, app.sheet?.kind, searchUser]);

  const selectedPerson = useMemo(() => peopleResults.find((person) => person.id === selectedUserId) ?? null, [peopleResults, selectedUserId]);
  const close = () => app.closeSheet();

  async function join(room: RoomPreview) {
    setBusy(true);
    try {
      await app.joinRoom(room.id);
      close();
      router.navigate('/(tabs)/room' as never);
    } catch (error) {
      app.showToast(error instanceof Error ? error.message : 'Could not join the Pod. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      app.showToast('Choose a display name between 2 and 24 characters');
      return;
    }
    if (!/^[a-z0-9_]{3,18}$/.test(username) || !isUsernameAvailable(username, app.profile?.id)) {
      app.showToast('Choose an available username: 3–18 letters, numbers, or underscores');
      return;
    }
    setBusy(true);
    try {
      await app.updateProfile({ displayName: trimmed, username: username.toLowerCase(), bio: bio.trim(), avatarId, avatarShapeId: avatarId, avatarColor, avatarMarkId });
      close();
      app.showToast('Profile saved');
    } catch {
      app.showToast('Could not save your profile. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function shareRoom() {
    if (!app.activeRoom) return;
    try {
      await Share.share({ message: `Join me for a relaxed conversation in my Pod. Pod code: ${app.activeRoom.code}` });
    } catch {
      app.showToast('Could not open the share sheet');
    }
  }

  async function sendFriendRequest() {
    if (!selectedPerson) return;
    try {
      await app.sendFriendRequest(selectedPerson.id);
      app.showToast(`Request sent to ${selectedPerson.displayName}`);
    } catch {
      app.showToast('Could not send the request. Try again.');
    }
  }

  async function inviteFriend(friendId: string, displayName: string) {
    try {
      await app.sendInvite(friendId);
      app.showToast(`Invite sent to ${displayName}`);
    } catch {
      app.showToast('Could not send the invite. Try again.');
    }
  }

  async function submitReport(reportedUserId: string, reason: string) {
    try {
      await app.submitReport(reportedUserId, reason);
      close();
      app.showToast('Report submitted');
    } catch {
      app.showToast('Could not submit the report. Try again.');
    }
  }

  async function confirmLeaveRoom() {
    setBusy(true);
    try {
      await app.leaveRoom();
      close();
      router.replace('/(tabs)/voice');
    } catch {
      app.showToast('Could not leave the Pod. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleParticipantMute(participantId: string, displayName: string) {
    const muted = app.localMutedParticipantIds.includes(participantId);
    try {
      await app.toggleLocalMute(participantId);
      close();
      app.showToast(muted ? `${displayName} unmuted for you` : `${displayName} muted for you`);
    } catch {
      app.showToast('Could not change this listening setting. Try again.');
    }
  }

  const sheet = app.sheet;
  const visiblePeople = peopleResults;
  const requestSent = selectedPerson ? app.sentFriendRequestIds.includes(selectedPerson.id) : false;

  return (
    <>
      <Modal
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
        transparent
        visible={Boolean(sheet)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <Pressable accessibilityLabel="Close sheet" onPress={close} style={StyleSheet.absoluteFill} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.six) }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <AppText variant="section" style={styles.sheetTitle}>{titleFor(sheet)}</AppText>
                <AppText variant="secondary" color={colors.muted}>{descriptionFor(sheet, app.activeRoom?.code)}</AppText>
              </View>
              <IconButton icon="close" label="Close" tone="plain" onPress={close} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
              {sheet?.kind === 'find-room' && (
                <>
                  <View style={styles.codeInputWrap}>
                    <TextInput
                      accessibilityLabel="Four-digit Pod code"
                      autoFocus
                      autoCapitalize="none"
                      keyboardType="numeric"
                      maxLength={4}
                      onChangeText={(value) => setRoomCode(value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4-digit Pod code"
                      placeholderTextColor={colors.muted}
                      style={styles.codeInput}
                      value={roomCode}
                    />
                  </View>
                  {roomCode.length < 4 ? <AppText variant="secondary" color={colors.muted} style={styles.resultHint}>Enter all four digits to find a Pod.</AppText> : null}
                  {searching ? <AppText variant="secondary" color={colors.muted} style={styles.resultHint}>Looking for that Pod…</AppText> : null}
                  {!searching && roomCode.length === 4 && !searchResult ? <EmptyCodeResult onClear={() => setRoomCode('')} /> : null}
                  {searchResult ? <RoomMatch
                    room={searchResult}
                    busy={busy}
                    onJoin={() => void join(searchResult)}
                    onPremiumRequired={() => app.showToast('Premium Pod access is not configured yet')}
                  /> : null}
                </>
              )}

              {sheet?.kind === 'friend-requests' && (
                app.friendRequests.length ? app.friendRequests.map((request) => (
                  <RequestRow key={request.id} request={request} onAccept={() => void app.acceptRequest(request.id)} onDecline={() => void app.declineRequest(request.id)} />
                )) : <AppText variant="secondary" color={colors.muted} style={styles.resultHint}>No received requests right now.</AppText>
              )}

              {sheet?.kind === 'invite' && (
                <>
                  <View style={styles.codeCard}>
                    <AppText variant="caption" color={colors.muted}>POD CODE</AppText>
                    <AppText variant="title" style={styles.roomCode}>{app.activeRoom?.code ?? '----'}</AppText>
                    <AppText variant="secondary" color={colors.muted}>Share this Pod code with a friend.</AppText>
                  </View>
                  <Button title="Share code" icon="send" variant="primary" onPress={() => void shareRoom()} style={styles.fullButton} />
                  <AppText variant="caption" style={styles.fieldLabel}>Invite a friend</AppText>
                  {app.friends.map((friend) => (
                    <View key={friend.id} style={styles.inviteFriendRow}>
                      <ElsefolkAvatar user={friend} size={40} />
                      <View style={styles.flexCopy}><AppText variant="name">{friend.displayName}</AppText><AppText variant="caption" color={colors.muted}>@{friend.username}</AppText></View>
                      <Button title="Invite" compact onPress={() => void inviteFriend(friend.id, friend.displayName)} />
                    </View>
                  ))}
                  {app.friends.length === 0 ? <AppText variant="secondary" color={colors.muted}>Add a friend before inviting them to a Pod.</AppText> : null}
                </>
              )}

              {sheet?.kind === 'add-friend' && (
                <>
                  <SearchField value={searchUser} onChangeText={(value) => { setSearchUser(value); setSelectedUserId(null); }} placeholder="Search by name or @username" compact autoFocus />
                  {selectedPerson ? (
                    <View style={styles.selectedPerson}>
                      <ElsefolkAvatar user={selectedPerson} size={56} />
                      <View style={styles.flexCopy}><AppText variant="name">{selectedPerson.displayName}</AppText><AppText variant="caption" color={colors.muted}>@{selectedPerson.username}</AppText><AppText variant="secondary" color={colors.muted}>{selectedPerson.bio}</AppText></View>
                    </View>
                  ) : !searchUser.trim() ? (
                    <AppText variant="secondary" color={colors.muted} style={styles.resultHint}>Enter a name or username to search.</AppText>
                  ) : visiblePeople.length ? visiblePeople.slice(0, 5).map((person) => (
                    <Pressable key={person.id} onPress={() => setSelectedUserId(person.id)} style={({ pressed }) => [styles.personResult, pressed && styles.pressedRow]}>
                      <ElsefolkAvatar user={person} size={42} />
                      <View style={styles.flexCopy}><AppText variant="name">{person.displayName}</AppText><AppText variant="caption" color={colors.muted}>@{person.username}</AppText></View>
                    </Pressable>
                  )) : <AppText variant="secondary" color={colors.muted} style={styles.resultHint}>No people found. Try another name.</AppText>}
                  {selectedPerson ? <Button title={requestSent ? 'Sent' : 'Send request'} variant={requestSent ? 'secondary' : 'primary'} disabled={requestSent} onPress={() => void sendFriendRequest()} style={styles.fullButton} /> : null}
                </>
              )}

              {sheet?.kind === 'edit-profile' && (
                <>
                  <TextField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="What should people call you?" maxLength={24} />
                  <TextField label="Username" value={username} onChangeText={(value) => setUsername(value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '').slice(0, 18))} placeholder="yourname" maxLength={18} />
                  <AppText variant="caption" color={colors.muted}>Your unique @username helps friends find you.</AppText>
                  <TextField label="Short bio" value={bio} onChangeText={setBio} placeholder="A little about you" maxLength={120} multiline />
                  <AppText variant="caption" style={styles.fieldLabel}>Customize your Elsefolk</AppText>
                  <AvatarCustomizer shapeId={avatarId} color={avatarColor} markId={avatarMarkId} onShapeChange={setAvatarId} onColorChange={setAvatarColor} onMarkChange={setAvatarMarkId} />
                  <Button title={busy ? 'Saving…' : 'Save changes'} variant="primary" disabled={busy} onPress={() => void saveProfile()} style={styles.fullButton} />
                </>
              )}

              {sheet?.kind === 'participant' && (
                <>
                  <View style={styles.profilePreview}>
                    <ElsefolkAvatar user={sheet.participant} size={64} />
                    <AppText variant="section">{sheet.participant.displayName}</AppText>
                    <AppText variant="caption" color={colors.muted}>@{sheet.participant.username}</AppText>
                    <AppText variant="secondary" color={colors.muted} numberOfLines={bioExpanded ? undefined : 2} style={styles.bioText}>{sheet.participant.bio || 'No bio yet.'}</AppText>
                  </View>
                  <Button title={bioExpanded ? 'Show less' : 'Read full bio'} variant="quiet" onPress={() => setBioExpanded((value) => !value)} style={styles.fullButton} />
                  <Button title={app.localMutedParticipantIds.includes(sheet.participant.id) ? 'Unmute for you' : 'Mute this person'} icon="mic-off" onPress={() => void toggleParticipantMute(sheet.participant.id, sheet.participant.displayName)} style={styles.fullButton} />
                  <Button title="Report" variant="danger" icon="shield" onPress={() => app.showSheet({ kind: 'report-reasons', participant: sheet.participant })} style={styles.fullButton} />
                </>
              )}

              {sheet?.kind === 'report-reasons' && (
                <>
                  <AppText variant="secondary" color={colors.muted}>Choose the reason that best describes your concern.</AppText>
                  <Button title="Harassment" variant="outline" onPress={() => void submitReport(sheet.participant.id, 'harassment')} style={styles.fullButton} />
                  <Button title="Inappropriate behavior" variant="outline" onPress={() => void submitReport(sheet.participant.id, 'inappropriate_behavior')} style={styles.fullButton} />
                  <Button title="Something else" variant="danger" onPress={() => void submitReport(sheet.participant.id, 'other')} style={styles.fullButton} />
                </>
              )}

              {sheet?.kind === 'leave-room' && (
                <>
                  <View style={styles.infoCard}>
                    <AppText variant="secondary" color={colors.muted}>Your microphone will turn off and you will return to Pods.</AppText>
                  </View>
                  <View style={styles.confirmActions}>
                    <Button title="Stay" variant="outline" disabled={busy} onPress={close} style={styles.confirmButton} />
                    <Button title={busy ? 'Leaving…' : 'Leave Pod'} accessibilityLabel="Confirm leave Pod" variant="danger" disabled={busy} onPress={() => void confirmLeaveRoom()} style={styles.confirmButton} />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {app.toast ? <View pointerEvents="none" style={styles.toast}><AppText variant="secondary" color={colors.surface}>{app.toast}</AppText></View> : null}
    </>
  );
}

function titleFor(sheet: ReturnType<typeof useApp>['sheet']) {
  switch (sheet?.kind) {
    case 'find-room': return 'Find a Pod';
    case 'friend-requests': return 'Friend requests';
    case 'invite': return 'Invite someone';
    case 'add-friend': return 'Add a friend';
    case 'edit-profile': return 'Edit profile';
    case 'participant': return 'About this person';
    case 'report-reasons': return 'Report this person?';
    case 'leave-room': return 'Leave this Pod?';
    default: return '';
  }
}

function descriptionFor(sheet: ReturnType<typeof useApp>['sheet'], code?: string) {
  switch (sheet?.kind) {
    case 'find-room': return 'Enter the four-digit code to find a Pod.';
    case 'friend-requests': return 'Requests from people who want to connect.';
    case 'invite': return code ? 'Share this Pod code with a friend.' : 'Invite a friend to join the conversation.';
    case 'add-friend': return 'Search by display name or @username.';
    case 'edit-profile': return 'Choose how friends recognize you.';
    case 'participant': return 'Pod participant';
    case 'report-reasons': return 'Choose a reason so the report can be reviewed.';
    case 'leave-room': return 'If others remain, you can rejoin when a seat is available.';
    default: return '';
  }
}

function EmptyCodeResult({ onClear }: { onClear: () => void }) {
  return (
    <View style={styles.emptyCode}>
      <AppText variant="name">No Pod found</AppText>
      <AppText variant="secondary" color={colors.muted}>Check the code and try again.</AppText>
      <Button title="Clear code" onPress={onClear} compact style={styles.clearCode} />
    </View>
  );
}

function RoomMatch({ room, onJoin, onPremiumRequired, busy }: { room: RoomPreview; onJoin: () => void; onPremiumRequired: () => void; busy: boolean }) {
  const full = room.participantCount >= room.capacity;
  const premiumInfo = full && room.premiumRequired;
  return (
    <View style={styles.matchCard}>
      <AppText variant="name">{room.title}</AppText>
      <AppText variant="secondary" color={colors.muted} style={styles.matchDescription}>{room.description}</AppText>
      <View style={styles.matchFooter}>
        <AppText variant="caption" color={colors.muted}>{room.participantCount} people</AppText>
        <Button
          title={busy ? 'Joining…' : full && !premiumInfo ? 'Full' : 'Join Pod'}
          variant="primary"
          compact
          disabled={busy || (full && !premiumInfo)}
          onPress={premiumInfo ? onPremiumRequired : onJoin}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: colors.overlay },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '92%', paddingHorizontal: spacing.five, paddingTop: spacing.three, paddingBottom: spacing.six, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, backgroundColor: colors.screen },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 4, backgroundColor: '#D8D6E2', marginBottom: spacing.four },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.three, marginBottom: spacing.four },
  sheetHeaderText: { flex: 1, gap: 4 },
  sheetTitle: { fontSize: 21, lineHeight: 27, letterSpacing: -0.5 },
  sheetBody: { paddingBottom: spacing.two },
  fullButton: { width: '100%', marginTop: spacing.four },
  confirmActions: { flexDirection: 'row', gap: spacing.two, marginTop: spacing.four },
  confirmButton: { flex: 1 },
  infoCard: { marginTop: spacing.four, padding: spacing.three, borderRadius: radius.control, backgroundColor: colors.lilac },
  codeInputWrap: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, backgroundColor: colors.field },
  codeInput: { minHeight: 42, paddingHorizontal: spacing.three, color: colors.text, fontSize: 16, letterSpacing: 2 },
  fieldLabel: { color: colors.text, fontWeight: '600', marginTop: spacing.three, marginBottom: spacing.two },
  resultHint: { marginTop: spacing.four },
  emptyCode: { marginTop: spacing.four, padding: spacing.four, borderRadius: radius.control, backgroundColor: colors.field, gap: 5 },
  clearCode: { alignSelf: 'flex-start', marginTop: spacing.two },
  matchCard: { marginTop: spacing.four, padding: spacing.four, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, backgroundColor: colors.surface },
  matchDescription: { marginTop: 4, marginBottom: spacing.three },
  matchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.three },
  codeCard: { alignItems: 'center', padding: spacing.five, borderRadius: radius.card, backgroundColor: colors.lilac, gap: spacing.two },
  roomCode: { fontSize: 34, lineHeight: 40, letterSpacing: 3 },
  inviteFriendRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  flexCopy: { flex: 1, minWidth: 0, gap: 2 },
  selectedPerson: { flexDirection: 'row', alignItems: 'center', gap: spacing.three, padding: spacing.three, marginTop: spacing.four, borderRadius: radius.card, backgroundColor: colors.field },
  personResult: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  pressedRow: { backgroundColor: colors.field },
  profilePreview: { alignItems: 'center', paddingVertical: spacing.three, gap: 4 },
  bioText: { textAlign: 'center', marginTop: spacing.two },
  toast: { position: 'absolute', alignSelf: 'center', bottom: 94, maxWidth: '90%', paddingHorizontal: spacing.four, paddingVertical: spacing.three, borderRadius: radius.pill, backgroundColor: '#302D42' },
});
