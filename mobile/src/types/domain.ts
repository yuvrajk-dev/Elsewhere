export type PresenceState = 'speaking' | 'listening' | 'muted';

export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarId: number;
  avatarColor: string;
  avatarShapeId?: number;
  avatarMarkId?: number;
  bio?: string;
  isOnline?: boolean;
};

export type UserProfile = UserSummary & { createdAt: string };
export type Participant = UserSummary & { status: PresenceState; isYou?: boolean };
export type RoomPreview = {
  id: string; code: string; title: string; description: string;
  participants: Participant[]; participantCount: number; capacity: number; premiumRequired?: boolean;
};
export type FriendRequest = { id: string; user: UserSummary };
export type Friend = UserSummary & { activeRoomCode?: string };
export type RoomInvite = { id: string; from: UserSummary; room: Pick<RoomPreview, 'id' | 'code' | 'title' | 'description'> };
export type ChatSummary = { id: string; person: UserSummary; latestMessage: string; updatedAtLabel: string; unreadCount?: number };
export type ChatMessage = { id: string; conversationId: string; senderId: string; body: string; imageUrl?: string | null; createdAtLabel: string };
export type AppTab = 'chats' | 'friends' | 'invites' | 'profile' | 'voice' | 'room';
export type SheetState =
  | { kind: 'find-room' }
  | { kind: 'friend-requests' }
  | { kind: 'invite' }
  | { kind: 'add-friend' }
  | { kind: 'edit-profile' }
  | { kind: 'participant'; participant: Participant }
  | { kind: 'report-reasons'; participant: Participant }
  | { kind: 'leave-room' }
  | null;
