import type { ChatMessage, ChatSummary, Friend, FriendRequest, Participant, RoomInvite, RoomPreview, UserProfile, UserSummary } from '@/types/domain';

export interface ProfileService {
  loadLocalProfile(): Promise<UserProfile | null>;
  saveLocalProfile(profile: UserProfile): Promise<UserProfile>;
}

export interface RoomService {
  listRooms(): Promise<RoomPreview[]>;
  findRoomByCode(code: string): Promise<RoomPreview | null>;
  /** Open a fresh generic temporary Pod and reserve its first seat. */
  startNewPod(profile: UserProfile): Promise<RoomPreview>;
  /** Server validates eligibility and reserves a seat atomically. */
  joinRoom(roomId: string, profile?: UserProfile): Promise<RoomPreview>;
  leaveRoom(roomId: string, userId?: string): Promise<void>;
  /** Server picks and reserves a different eligible room; null means there is no candidate. */
  shuffleToRoom(currentRoomId: string, profile?: UserProfile): Promise<RoomPreview | null>;
}

export interface VoiceService {
  /** Connect muted. This must not request microphone permission or publish a mic track. */
  joinRoom(room: RoomPreview): Promise<void>;
  /** Connect the new room first, then end the old connection after the new one is ready. */
  switchRoom(room: RoomPreview): Promise<void>;
  /** Unmuting may request OS microphone permission; muting should stop local publishing. */
  setMicrophoneMuted(muted: boolean): Promise<void>;
  setParticipantMutedLocally(participantId: string, muted: boolean): Promise<void>;
  leaveRoom(roomId: string): Promise<void>;
}

export interface ChatService {
  listChats(): Promise<ChatSummary[]>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, senderId: string, body: string): Promise<ChatMessage>;
  startConversation?(userId: string): Promise<string>;
  sendPhoto?(conversationId: string, image: { uri: string; contentType: string; size: number }): Promise<ChatMessage>;
  subscribeMessages?(conversationId: string, onMessages: (messages: ChatMessage[]) => void, onError: (error: Error) => void): () => void;
}

export interface FriendService {
  listFriends(): Promise<Friend[]>;
  listRequests(): Promise<FriendRequest[]>;
  searchPeople(query: string, excludedUserIds: string[]): Promise<UserSummary[]>;
  sendFriendRequest(userId: string): Promise<void>;
  acceptRequest(requestId: string): Promise<void>;
  declineRequest(requestId: string): Promise<void>;
}

export interface InviteService {
  listInvites(): Promise<RoomInvite[]>;
  sendInvite(roomId: string, friendId: string): Promise<void>;
  /** The server should accept the invite and reserve the room seat atomically. */
  acceptInvite(inviteId: string, profile?: UserProfile): Promise<RoomPreview>;
  declineInvite(inviteId: string): Promise<void>;
}

export interface SafetyService {
  submitReport(reportedUserId: string, reason: string): Promise<void>;
}

export interface AppServices {
  profiles: ProfileService;
  rooms: RoomService;
  voice: VoiceService;
  chats: ChatService;
  friends: FriendService;
  invites: InviteService;
  safety: SafetyService;
}
