import { Pressable, StyleSheet, View } from 'react-native';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { Icon } from '@/components/icon';
import { AppText, Button, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import type { ChatSummary, Friend, FriendRequest, Participant, RoomInvite, RoomPreview } from '@/types/domain';

export function RoomCard({ room, onJoin, onPremiumRequired }: { room: RoomPreview; onJoin: () => void; onPremiumRequired: () => void }) {
  const participants = room.participants.filter((person) => person.id !== 'you' && !person.isYou).slice(0, 3);
  const remaining = Math.max(0, room.participantCount - participants.length);
  const full = room.participantCount >= room.capacity;
  return (
    <View style={styles.roomCard}>
      <AppText variant="name" style={styles.roomTitle}>{room.title}</AppText>
      <AppText variant="body" color={colors.muted} style={styles.roomDescription}>{room.description}</AppText>
      <View style={styles.roomFooter}>
        <View style={styles.roomPeople}>
          <View style={styles.avatarStack}>
            {participants.map((person, index) => <ElsefolkAvatar key={person.id} user={person} size={42} bordered />)}
            {remaining > 0 ? <AppText variant="caption" color={colors.muted} style={styles.avatarMore}>+{remaining}</AppText> : null}
          </View>
          <View style={styles.countCopy}>
            <AppText variant="caption" color={room.participantCount === 0 ? colors.brand : colors.muted}>
              {room.participantCount === 0 ? 'Be the first to join' : `${room.participantCount} ${room.participantCount === 1 ? 'person' : 'people'}`}
            </AppText>
            {full && room.premiumRequired ? <AppText variant="caption" color={colors.muted}>Premium can join</AppText> : null}
          </View>
        </View>
        <Button
          title={full && !room.premiumRequired ? 'Full' : 'Join Pod'}
          variant="primary"
          disabled={full && !room.premiumRequired}
          onPress={full ? onPremiumRequired : onJoin}
        />
      </View>
    </View>
  );
}

export function ChatRow({ chat, onPress }: { chat: ChatSummary; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open chat with ${chat.person.displayName}`} onPress={onPress} style={({ pressed }) => [styles.chatRow, pressed && styles.pressed]}>
      <ElsefolkAvatar user={chat.person} size={50} />
      <View style={styles.flexCopy}>
        <AppText variant="name">{chat.person.displayName}</AppText>
        <AppText variant="secondary" color={colors.muted} numberOfLines={1}>{chat.latestMessage}</AppText>
      </View>
      <View style={styles.chatMeta}>
        <AppText variant="caption" color={colors.muted}>{chat.updatedAtLabel}</AppText>
        {chat.unreadCount ? <View style={styles.unread}><AppText variant="caption" color={colors.surface}>{chat.unreadCount}</AppText></View> : null}
      </View>
    </Pressable>
  );
}

export function RequestRow({ request, onAccept, onDecline }: { request: FriendRequest; onAccept: () => void; onDecline: () => void }) {
  return (
    <View style={styles.requestRow}>
      <ElsefolkAvatar user={request.user} size={42} />
      <View style={styles.flexCopy}>
        <AppText variant="name">{request.user.displayName}</AppText>
        <AppText variant="caption" color={colors.muted}>@{request.user.username}</AppText>
      </View>
      <View style={styles.requestActions}>
        <Button title="Accept" compact variant="primary" onPress={onAccept} />
        <Button title="Decline" compact onPress={onDecline} />
      </View>
    </View>
  );
}

export function FriendRow({ friend, onChat }: { friend: Friend; onChat: () => void }) {
  return (
    <View style={styles.friendRow}>
      <ElsefolkAvatar user={friend} size={44} />
      <View style={styles.flexCopy}>
        <AppText variant="name">{friend.displayName}</AppText>
        <AppText variant="caption" color={colors.muted}>@{friend.username}</AppText>
      </View>
      <Button title="Chat" onPress={onChat} />
    </View>
  );
}

export function ActiveFriendCard({ friend, onPress }: { friend: Friend; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${friend.displayName} is active in Pod ${friend.activeRoomCode}`} onPress={onPress} style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}>
      <ElsefolkAvatar user={friend} size={36} />
      <AppText variant="caption" numberOfLines={1} style={styles.activeName}>{friend.displayName}</AppText>
      <AppText variant="caption" color={colors.brand} style={styles.activeCode}>{friend.activeRoomCode}</AppText>
    </Pressable>
  );
}

export function InviteCard({ invite, onJoin, onDecline }: { invite: RoomInvite; onJoin: () => void; onDecline: () => void }) {
  return (
    <View style={styles.inviteCard}>
      <View style={styles.inviteHead}>
        <ElsefolkAvatar user={invite.from} size={46} />
        <View style={styles.flexCopy}>
          <AppText variant="name">{invite.from.displayName} invited you</AppText>
          <AppText variant="secondary" color={colors.muted}>{invite.room.title}</AppText>
        </View>
      </View>
      <AppText variant="body" color={colors.muted} style={styles.inviteDescription}>{invite.room.description || 'Come join a relaxed conversation.'}</AppText>
      <View style={styles.inviteCode}>
        <AppText variant="caption" color={colors.muted}>POD CODE</AppText>
        <AppText variant="name" color={colors.brand} style={styles.inviteCodeValue}>{invite.room.code}</AppText>
      </View>
      <View style={styles.inviteActions}>
        <Button title="Join Pod" variant="primary" onPress={onJoin} style={styles.growButton} />
        <Button title="Decline" onPress={onDecline} />
      </View>
    </View>
  );
}

export function ParticipantRow({ participant, onPress, locallyMuted = false }: { participant: Participant; onPress: () => void; locallyMuted?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${participant.displayName}, ${locallyMuted ? 'muted for you' : participant.status}${participant.isYou ? ', you' : ''}`} onPress={onPress} style={({ pressed }) => [styles.participantRow, pressed && styles.pressed]}>
      <ElsefolkAvatar user={participant} size={42} />
      <View style={styles.flexCopy}>
        <View style={styles.nameLine}>
          <AppText variant="name">{participant.displayName}</AppText>
          {participant.isYou ? <AppText variant="caption" color={colors.muted}>You</AppText> : null}
        </View>
        <AppText variant="caption" color={participant.status === 'speaking' && !locallyMuted ? colors.online : colors.muted}>{locallyMuted ? 'Muted for you' : capitalize(participant.status)}</AppText>
      </View>
      <Icon name="chevron" color={colors.icon} size={20} />
    </Pressable>
  );
}

export function MenuRow({ icon, title, onPress }: { icon: 'spark' | 'shield' | 'settings' | 'help'; title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <Icon name={icon} size={20} color={colors.icon} />
      <AppText variant="body" style={styles.menuText}>{title}</AppText>
      <Icon name="chevron" size={20} color={colors.icon} />
    </Pressable>
  );
}

export function PrivacyNote() {
  return (
    <View style={styles.privacyNote}>
      <Icon name="lock" size={18} color={colors.brand} />
      <AppText variant="secondary" color="#49418D" style={styles.privacyCopy}>Your display name, @username, and Elsefolk character are what others see. You never need to share your real name.</AppText>
    </View>
  );
}

export function Hairline() { return <Divider />; }

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  roomCard: { padding: spacing.four, marginBottom: spacing.three, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, backgroundColor: colors.surface },
  roomTitle: { fontSize: 16, lineHeight: 21 },
  roomDescription: { marginTop: 5, marginBottom: spacing.four, lineHeight: 21 },
  roomFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.two },
  roomPeople: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarMore: { marginLeft: 1, paddingHorizontal: 3 },
  countCopy: { flexShrink: 1, gap: 1 },
  chatRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.three, paddingVertical: spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  flexCopy: { flex: 1, minWidth: 0, gap: 3 },
  chatMeta: { alignItems: 'flex-end', alignSelf: 'flex-start', paddingTop: spacing.one, gap: spacing.two },
  unread: { minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.brand },
  requestRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.two, paddingVertical: spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  requestActions: { flexDirection: 'row', gap: 5 },
  friendRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  activeCard: { width: 154, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.two, padding: spacing.two, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  activeName: { flex: 1, minWidth: 0, fontWeight: '600' },
  activeCode: { fontWeight: '700' },
  inviteCard: { padding: spacing.four, marginBottom: spacing.three, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, backgroundColor: colors.surface },
  inviteHead: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.three },
  inviteDescription: { marginTop: spacing.three, marginBottom: spacing.four },
  inviteCode: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.three, marginBottom: spacing.three, borderRadius: radius.control, backgroundColor: colors.field },
  inviteCodeValue: { letterSpacing: 2 },
  inviteActions: { flexDirection: 'row', gap: spacing.two },
  growButton: { flex: 1 },
  participantRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  menuText: { flex: 1 },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.two, padding: spacing.three, marginVertical: spacing.four, borderRadius: radius.control, backgroundColor: colors.lilac },
  privacyCopy: { flex: 1, color: '#49418D' },
  pressed: { backgroundColor: colors.field },
});
