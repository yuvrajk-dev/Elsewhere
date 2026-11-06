import type { ChatMessage, ChatSummary, Friend, FriendRequest, Participant, RoomInvite, RoomPreview, UserSummary } from '@/types/domain';

export const avatarPalettes = [
  '#9B8FEB', '#4BB8AC', '#E98D7F', '#D7A845', '#7797DB', '#D778A4', '#72A96F', '#D18C59', '#6E9BC4', '#AE7CA9',
  '#8AAB5E', '#C87568', '#6BAF9E', '#B78A48', '#8878C5', '#6490A7', '#CE7290', '#9B9A59', '#7085C7', '#B17D5F',
];

export const you: UserSummary = {
  id: 'you', username: 'sunnytalks', displayName: 'SunnySide', avatarId: 4, avatarColor: avatarPalettes[3], bio: 'Here for easy conversation.',
};

export const people: UserSummary[] = [
  { id: 'mira', username: 'miramakes', displayName: 'Mira', avatarId: 2, avatarColor: avatarPalettes[1], bio: 'Collector of small joys.', isOnline: true },
  { id: 'asha', username: 'ashareads', displayName: 'Asha', avatarId: 1, avatarColor: avatarPalettes[0], bio: 'Books, tea, and long walks.', isOnline: true },
  { id: 'ravi', username: 'ravionair', displayName: 'Ravi', avatarId: 3, avatarColor: avatarPalettes[2], bio: 'Always up for a new playlist.', isOnline: true },
  { id: 'sam', username: 'samstargazer', displayName: 'Sam', avatarId: 4, avatarColor: avatarPalettes[3], bio: 'Looking up, mostly.', isOnline: false },
  { id: 'nia', username: 'niadoes', displayName: 'Nia', avatarId: 6, avatarColor: avatarPalettes[5], bio: 'Curious about everything.', isOnline: true },
  { id: 'leo', username: 'leowanders', displayName: 'Leo', avatarId: 5, avatarColor: avatarPalettes[4], bio: 'A very casual explorer.', isOnline: true },
  { id: 'tara', username: 'taratalks', displayName: 'Tara', avatarId: 12, avatarColor: avatarPalettes[11], bio: 'Small Pods, good company.', isOnline: false },
  { id: 'milo', username: 'milomakes', displayName: 'Milo', avatarId: 14, avatarColor: avatarPalettes[13], bio: 'Currently learning to bake.', isOnline: false },
  { id: 'noor', username: 'noorandmore', displayName: 'Noor', avatarId: 9, avatarColor: avatarPalettes[8], bio: 'Tell me what you are listening to.', isOnline: true },
  { id: 'nora', username: 'norasees', displayName: 'Nora', avatarId: 8, avatarColor: avatarPalettes[7], bio: 'A friend of a friend.', isOnline: false },
  { id: 'jules', username: 'julesoutside', displayName: 'Jules', avatarId: 10, avatarColor: avatarPalettes[9], bio: 'Usually outside.', isOnline: false },
];

const participant = (person: UserSummary, status: Participant['status'], isYou = false): Participant => ({ ...person, status, isYou });

export const mockRooms: RoomPreview[] = [
  {
    id: 'room-open-table', code: '4821', title: 'Easy Hellos', description: 'A relaxed place to meet someone new and see where the conversation goes.',
    participantCount: 3, capacity: 5,
    participants: [participant(people[0], 'listening'), participant(people[1], 'speaking'), participant(people[3], 'muted')],
  },
  {
    id: 'room-company', code: '1736', title: 'Little Things', description: 'Share one good thing, small discovery, or moment from your day.',
    participantCount: 4, capacity: 5,
    participants: [participant(people[4], 'listening'), participant(people[5], 'speaking'), participant(people[6], 'listening'), participant(people[2], 'listening')],
  },
  {
    id: 'room-table', code: '6042', title: 'Music & Moments', description: 'Talk favorite songs, stories, and sounds you keep coming back to.',
    participantCount: 4, capacity: 5,
    participants: [participant(people[7], 'speaking'), participant(people[8], 'listening'), participant(people[9], 'muted'), participant(people[10], 'listening')],
  },
];

export const mockRequests: FriendRequest[] = [
  { id: 'request-nora', user: people[9] }, { id: 'request-jules', user: people[10] },
];
export const mockFriends: Friend[] = [
  { ...people[0], activeRoomCode: '4821' }, { ...people[1] }, { ...people[2], activeRoomCode: '1736' }, { ...people[3] },
];
export const mockInvites: RoomInvite[] = [
  { id: 'invite-mira', from: people[0], room: { id: mockRooms[0].id, code: mockRooms[0].code, title: mockRooms[0].title, description: mockRooms[0].description } },
  { id: 'invite-ravi', from: people[2], room: { id: mockRooms[1].id, code: mockRooms[1].code, title: mockRooms[1].title, description: mockRooms[1].description } },
];
export const mockChats: ChatSummary[] = [
  { id: 'chat-mira', person: people[0], latestMessage: 'That sounds good, see you there.', updatedAtLabel: '2:41' },
  { id: 'chat-asha', person: people[1], latestMessage: 'I found a Pod we might like.', updatedAtLabel: 'Yesterday', unreadCount: 1 },
  { id: 'chat-ravi', person: people[2], latestMessage: 'Thanks for the recommendation!', updatedAtLabel: 'Mon' },
];
export const initialMessages: Record<string, ChatMessage[]> = {
  'chat-mira': [
    { id: 'mira-1', conversationId: 'chat-mira', senderId: 'mira', body: 'Hey, glad we connected!', createdAtLabel: '2:38' },
    { id: 'mira-2', conversationId: 'chat-mira', senderId: 'you', body: 'Me too. How are you?', createdAtLabel: '2:39' },
  ],
  'chat-asha': [
    { id: 'asha-1', conversationId: 'chat-asha', senderId: 'asha', body: 'I found a Pod we might like.', createdAtLabel: 'Yesterday' },
    { id: 'asha-2', conversationId: 'chat-asha', senderId: 'you', body: 'Send me the code and I’ll take a look.', createdAtLabel: 'Yesterday' },
  ],
  'chat-ravi': [{ id: 'ravi-1', conversationId: 'chat-ravi', senderId: 'ravi', body: 'Thanks for the recommendation!', createdAtLabel: 'Mon' }],
};

export function usernameFromDisplayName(displayName: string) {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'newfriend';
}

export function isUsernameAvailable(username: string, currentUserId?: string) {
  const normalized = username.trim().replace(/^@/, '').toLowerCase();
  return ![you, ...people].some((person) => person.id !== currentUserId && person.username.toLowerCase() === normalized);
}

export function createLocalProfile(displayName: string, username: string, avatarId: number, bio = '', avatarColor = avatarPalettes[Math.min(20, Math.max(1, avatarId)) - 1], avatarMarkId = avatarId) {
  const safeAvatarId = Math.min(20, Math.max(1, avatarId));
  return {
    id: 'local-profile', username: username.trim().replace(/^@/, '').toLowerCase(), displayName, avatarId: safeAvatarId, avatarShapeId: safeAvatarId, avatarMarkId,
    avatarColor, bio, createdAt: new Date().toISOString(),
  };
}
