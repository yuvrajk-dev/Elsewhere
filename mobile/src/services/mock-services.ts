import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialMessages, mockChats, mockFriends, mockInvites, mockRequests, mockRooms, people } from '@/data/mock-data';
import type { AppServices, ChatService, FriendService, InviteService, ProfileService, RoomService, SafetyService, VoiceService } from '@/services/contracts';
import type { ChatMessage, ChatSummary, Friend, FriendRequest, RoomInvite, RoomPreview, UserProfile } from '@/types/domain';

const PROFILE_STORAGE_KEY = 'voice-app/profile/v1';

function copyRoom(room: RoomPreview): RoomPreview {
  return { ...room, participants: room.participants.map((person) => ({ ...person })) };
}

const profiles: ProfileService = {
  async loadLocalProfile() {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  },
  async saveLocalProfile(profile) {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  },
};

let rooms = mockRooms.map(copyRoom);
const automaticPodThemes = [
  ['Good Company', 'A welcoming place for open, easygoing conversation.'],
  ['Curious Minds', 'Bring a question, an idea, or something you have been wondering about.'],
  ['Today’s Little Wins', 'Share something that made today a little better.'],
  ['A Fresh Perspective', 'Trade thoughts and hear how other people see things.'],
  ['The Cozy Corner', 'Settle in for a friendly chat about whatever is on your mind.'],
  ['Small Discoveries', 'Talk about something interesting you found or learned.'],
  ['Open Conversation', 'No set topic. Start wherever feels comfortable.'],
  ['Stories & Side Notes', 'Bring a story, a tangent, or a fun detail from your day.'],
  ['Slow Sunday', 'Take a breath and enjoy some relaxed company.'],
  ['Bright Ideas', 'Share a thought, ask a question, or build on someone else’s idea.'],
  ['Around Here', 'Talk about places, routines, and the little things nearby.'],
  ['A Moment to Chat', 'Drop in for a light conversation and meet someone new.'],
  ['The Listening Room', 'A thoughtful space for stories and good questions.'],
  ['Tea Break', 'Pause for a friendly chat and a change of pace.'],
  ['Curiosity Club', 'Follow an interesting question wherever it leads.'],
  ['Good Questions', 'Ask something you have always wanted to ask.'],
  ['The Common Room', 'An easy place to meet and talk about anything.'],
  ['Passing Thoughts', 'Share what has been on your mind lately.'],
  ['Little Stories', 'Trade everyday stories, funny moments, and small surprises.'],
  ['Kind Company', 'A welcoming chat for anyone looking for a little company.'],
  ['New Angles', 'Explore a topic from a different point of view.'],
  ['The Open Seat', 'There is room for one more voice and a new conversation.'],
  ['A Good Pause', 'Take a break and enjoy a calm conversation.'],
  ['Common Ground', 'Find a shared interest or discover something new.'],
];

function addParticipant(room: RoomPreview, profile: UserProfile) {
  const existing = room.participants.some((person) => person.id === profile.id);
  if (existing) return copyRoom(room);
  if (room.participantCount >= room.capacity) throw new Error('This Pod is full. Try another Pod.');
  room.participants = [...room.participants, { ...profile, status: 'muted', isYou: true }];
  room.participantCount += 1;
  return copyRoom(room);
}

const roomService: RoomService = {
  async listRooms() {
    return rooms.map(copyRoom);
  },
  async findRoomByCode(code) {
    const room = rooms.find((item) => item.code === code);
    return room ? copyRoom(room) : null;
  },
  async startNewPod(profile) {
    const previousRoom = rooms.find((room) => room.participants.some((person) => person.id === profile.id));
    if (previousRoom) {
      previousRoom.participants = previousRoom.participants.filter((person) => person.id !== profile.id);
      previousRoom.participantCount = Math.max(0, previousRoom.participantCount - 1);
      if (previousRoom.id.startsWith('local-room-') && previousRoom.participantCount === 0) {
        rooms = rooms.filter((room) => room.id !== previousRoom.id);
      }
    }
    const usedCodes = new Set(rooms.map((room) => room.code));
    let code = '';
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
    } while (usedCodes.has(code));
    const usedTitles = new Set(rooms.map((room) => room.title));
    const unusedThemes = automaticPodThemes.filter(([title]) => !usedTitles.has(title));
    const themes = unusedThemes.length ? unusedThemes : automaticPodThemes;
    const theme = themes[Math.floor(Math.random() * themes.length)] ?? automaticPodThemes[0];
    const room: RoomPreview = {
      id: `local-room-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`, code, title: theme[0], description: theme[1],
      participants: [], participantCount: 0, capacity: 5,
    };
    rooms = [room, ...rooms];
    return addParticipant(room, profile);
  },
  async joinRoom(roomId, profile) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw new Error('Pod not found. Refresh and try again.');
    if (profile) return addParticipant(room, profile);
    if (room.participantCount >= room.capacity) throw new Error('This Pod is full. Try another Pod.');
    return copyRoom(room);
  },
  async leaveRoom(roomId, userId) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room || !userId) return;
    const nextParticipants = room.participants.filter((person) => person.id !== userId);
    if (nextParticipants.length === room.participants.length) return;
    room.participants = nextParticipants;
    room.participantCount = Math.max(0, room.participantCount - 1);
    if (room.id.startsWith('local-room-') && room.participantCount === 0) rooms = rooms.filter((item) => item.id !== roomId);
  },
  async shuffleToRoom(currentRoomId, profile) {
    const available = rooms.filter((room) => room.id !== currentRoomId && room.participantCount < room.capacity);
    if (available.length === 0) return null;
    const room = available[Math.floor(Math.random() * available.length)];
    return profile ? addParticipant(room, profile) : copyRoom(room);
  },
};

let friends: Friend[] = mockFriends.map((friend) => ({ ...friend }));
let requests: FriendRequest[] = mockRequests.map((request) => ({ ...request, user: { ...request.user } }));
const sentRequests = new Set<string>();
const friendService: FriendService = {
  async listFriends() {
    return friends.map((friend) => ({ ...friend }));
  },
  async listRequests() {
    return requests.map((request) => ({ ...request, user: { ...request.user } }));
  },
  async searchPeople(query, excludedUserIds) {
    const normalized = query.trim().replace(/^@/, '').toLowerCase();
    if (!normalized) return [];
    return people.filter((person) =>
      !excludedUserIds.includes(person.id)
      && !requests.some((request) => request.user.id === person.id)
      && !sentRequests.has(person.id)
      && (`${person.displayName} ${person.username}`).toLowerCase().includes(normalized),
    ).map((person) => ({ ...person }));
  },
  async sendFriendRequest(userId) {
    if (friends.some((friend) => friend.id === userId) || requests.some((request) => request.user.id === userId)) return;
    const person = people.find((candidate) => candidate.id === userId);
    if (!person) throw new Error('This person is no longer available.');
    sentRequests.add(userId);
  },
  async acceptRequest(requestId) {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;
    friends = friends.some((friend) => friend.id === request.user.id) ? friends : [...friends, { ...request.user }];
    requests = requests.filter((item) => item.id !== requestId);
  },
  async declineRequest(requestId) {
    requests = requests.filter((item) => item.id !== requestId);
  },
};

let invites: RoomInvite[] = mockInvites.map((invite) => ({ ...invite, from: { ...invite.from }, room: { ...invite.room } }));
const inviteService: InviteService = {
  async listInvites() {
    return invites.map((invite) => ({ ...invite, from: { ...invite.from }, room: { ...invite.room } }));
  },
  async sendInvite(roomId, friendId) {
    if (!rooms.some((room) => room.id === roomId) || !friends.some((friend) => friend.id === friendId)) {
      throw new Error('This Pod or friend is no longer available.');
    }
    // The preview accepts the action locally; delivery is added with the app API.
  },
  async acceptInvite(inviteId, profile) {
    const invite = invites.find((item) => item.id === inviteId);
    if (!invite) throw new Error('This invite is no longer available.');
    const room = await roomService.joinRoom(invite.room.id, profile);
    invites = invites.filter((item) => item.id !== inviteId);
    return room;
  },
  async declineInvite(inviteId) {
    invites = invites.filter((item) => item.id !== inviteId);
  },
};

const voice: VoiceService = {
  async joinRoom(_room) {
    // The preview simulates a successful muted connection. LiveKit will replace this method.
  },
  async switchRoom(_room) {
    // The preview simulates an accepted room switch while keeping the old room until ready.
  },
  async setMicrophoneMuted(_muted) {
    // UI-only preview. A real implementation will request OS permission and control LiveKit.
  },
  async setParticipantMutedLocally(_participantId, _muted) {
    // Local listening state is simulated until the LiveKit room is connected.
  },
  async leaveRoom(_roomId) {
    // Connection cleanup is simulated until the LiveKit room is connected.
  },
};

let chats = mockChats.map((chat) => ({ ...chat, person: { ...chat.person } }));
const messages: Record<string, ChatMessage[]> = Object.fromEntries(
  Object.entries(initialMessages).map(([key, value]) => [key, value.map((message) => ({ ...message }))]),
);
const chatService: ChatService = {
  async listChats() {
    return chats.map((chat) => ({ ...chat, person: { ...chat.person } }));
  },
  async listMessages(conversationId) {
    return (messages[conversationId] ?? []).map((message) => ({ ...message }));
  },
  async sendMessage(conversationId, senderId, body) {
    const message: ChatMessage = {
      id: `local-message-${Date.now()}`, conversationId, senderId, body: body.trim(), createdAtLabel: 'Now',
    };
    messages[conversationId] = [...(messages[conversationId] ?? []), message];
    let preview = chats.find((chat) => chat.id === conversationId);
    if (!preview) {
      const personId = conversationId.replace(/^chat-/, '');
      const person = people.find((candidate) => candidate.id === personId);
      if (person) {
        preview = { id: conversationId, person, latestMessage: '', updatedAtLabel: 'Now' };
        chats = [preview, ...chats];
      }
    }
    if (preview) {
      chats = [{ ...preview, latestMessage: message.body, updatedAtLabel: 'Now', unreadCount: 0 }, ...chats.filter((chat) => chat.id !== conversationId)];
    }
    return { ...message };
  },
};

const safety: SafetyService = {
  async submitReport(_reportedUserId, _reason) {
    // Report submission is simulated until the app API is connected.
  },
};

export const mockServices: AppServices = { profiles, rooms: roomService, voice, chats: chatService, friends: friendService, invites: inviteService, safety };
