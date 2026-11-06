import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockChats, mockFriends, mockInvites, mockRequests, mockRooms } from '@/data/mock-data';
import { mockServices as previewServices } from '@/services/mock-services';
import { neonServices } from '@/services/neon-services';
import { neonAuth, neonServicesConfigured } from '@/services/neon-auth';
import type { ChatMessage, ChatSummary, Friend, FriendRequest, RoomInvite, RoomPreview, SheetState, UserProfile, UserSummary } from '@/types/domain';

type AppContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  refreshAuthState: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  profile: UserProfile | null;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'username' | 'bio' | 'avatarId' | 'avatarColor' | 'avatarShapeId' | 'avatarMarkId'>>) => Promise<void>;
  rooms: RoomPreview[];
  activeRoom: RoomPreview | null;
  isMicMuted: boolean;
  isEnteringRoom: boolean;
  completeRoomEntry: () => void;
  joinRoom: (roomId: string) => Promise<RoomPreview>;
  joinInvitedRoom: (inviteId: string) => Promise<RoomPreview>;
  startNewPod: () => Promise<RoomPreview>;
  findRoom: (code: string) => Promise<RoomPreview | null>;
  shuffleRoom: () => Promise<RoomPreview | null>;
  leaveRoom: () => Promise<void>;
  toggleMic: () => Promise<void>;
  localMutedParticipantIds: string[];
  toggleLocalMute: (participantId: string) => Promise<void>;
  chats: ChatSummary[];
  loadMessages: (conversationId: string) => Promise<ChatMessage[]>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  sendPhoto: (conversationId: string, image: { uri: string; contentType: string; size: number }) => Promise<void>;
  startConversation: (personId: string) => Promise<string>;
  subscribeMessages: (conversationId: string, onMessages: (messages: ChatMessage[]) => void, onError: (error: Error) => void) => () => void;
  friendRequests: FriendRequest[];
  friends: Friend[];
  refreshFriends: () => Promise<void>;
  sentFriendRequestIds: string[];
  searchPeople: (query: string) => Promise<UserSummary[]>;
  sendFriendRequest: (userId: string) => Promise<void>;
  sendInvite: (friendId: string) => Promise<void>;
  submitReport: (reportedUserId: string, reason: string) => Promise<void>;
  invites: RoomInvite[];
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  dismissInvite: (inviteId: string) => Promise<void>;
  showSheet: (sheet: Exclude<SheetState, null>) => void;
  sheet: SheetState;
  closeSheet: () => void;
  toast: string | null;
  showToast: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const mockServices = neonServicesConfigured ? neonServices : previewServices;

function withCurrentUser(room: RoomPreview, profile: UserProfile): RoomPreview {
  const alreadyIncluded = room.participants.some((person) => person.id === profile.id || person.id === 'you');
  const participant = { ...profile, status: 'muted' as const, isYou: true };
  const others = room.participants.filter((person) => person.id !== profile.id && person.id !== 'you');
  return {
    ...room,
    participants: [...others, participant],
    participantCount: Math.min(room.capacity, room.participantCount + (alreadyIncluded ? 0 : 1)),
  };
}

export function AppProvider({ children }: React.PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!neonServicesConfigured);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<RoomPreview[]>(mockRooms);
  const [activeRoom, setActiveRoom] = useState<RoomPreview | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isEnteringRoom, setIsEnteringRoom] = useState(false);
  const [localMutedParticipantIds, setLocalMutedParticipantIds] = useState<string[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>(mockChats);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockRequests);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [sentFriendRequestIds, setSentFriendRequestIds] = useState<string[]>([]);
  const [invites, setInvites] = useState<RoomInvite[]>(mockInvites);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const initialize = async () => {
      if (neonServicesConfigured) {
        try {
          const { data, error } = await neonAuth!.getSession();
          if (error) throw error;
          if (!alive) return;
          setIsAuthenticated(Boolean(data?.user));
          if (!data?.user) {
            setIsReady(true);
            return;
          }
        } catch {
          if (!alive) return;
          setIsAuthenticated(false);
          setIsReady(true);
          return;
        }
      }
    Promise.all([
      mockServices.profiles.loadLocalProfile(),
      mockServices.rooms.listRooms(),
      mockServices.chats.listChats(),
      mockServices.friends.listFriends(),
      mockServices.friends.listRequests(),
      mockServices.invites.listInvites(),
    ])
      .then(([savedProfile, savedRooms, savedChats, savedFriends, savedRequests, savedInvites]) => {
        if (!alive) return;
        setProfile(savedProfile);
        setRooms(savedRooms);
        setChats(savedChats);
        setFriends(savedFriends);
        setFriendRequests(savedRequests);
        setInvites(savedInvites);
      })
      .catch(() => {
        if (alive) setToast('Could not load local preview data. Please restart the app.');
      })
      .finally(() => {
        if (alive) setIsReady(true);
      });
    };
    void initialize();
    return () => { alive = false; };
  }, []);

  const refreshAuthState = useCallback(async () => {
    if (!neonServicesConfigured || !neonAuth) return;
    const { data, error } = await neonAuth.getSession();
    if (error) throw error;
    const signedIn = Boolean(data?.user);
    setIsAuthenticated(signedIn);
    if (signedIn) {
      const [savedProfile, savedChats, savedRooms, savedFriends, savedRequests, savedInvites] = await Promise.all([
        mockServices.profiles.loadLocalProfile(), mockServices.chats.listChats(), mockServices.rooms.listRooms(), mockServices.friends.listFriends(), mockServices.friends.listRequests(), mockServices.invites.listInvites(),
      ]);
      setProfile(savedProfile); setChats(savedChats); setRooms(savedRooms); setFriends(savedFriends); setFriendRequests(savedRequests); setInvites(savedInvites);
    } else {
      setProfile(null);
      setChats([]);
    }
    setIsReady(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!neonAuth) throw new Error('Neon Auth is not configured.');
    const { error } = await neonAuth.signIn.email({ email, password });
    if (error) throw new Error(error.message || 'Could not sign in.');
    await refreshAuthState();
  }, [refreshAuthState]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!neonAuth) throw new Error('Neon Auth is not configured.');
    const { error } = await neonAuth.signUp.email({ email, password, name: 'Elsewhere member' });
    if (error) throw new Error(error.message || 'Could not create your account.');
    await refreshAuthState();
  }, [refreshAuthState]);

  const signOut = useCallback(async () => {
    if (!neonAuth) return;
    const { error } = await neonAuth.signOut();
    if (error) throw new Error(error.message || 'Could not sign out.');
    await refreshAuthState();
  }, [refreshAuthState]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const completeOnboarding = useCallback(async (nextProfile: UserProfile) => {
    const saved = await mockServices.profiles.saveLocalProfile(nextProfile);
    setProfile(saved);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'displayName' | 'username' | 'bio' | 'avatarId' | 'avatarColor' | 'avatarShapeId' | 'avatarMarkId'>>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    const saved = await mockServices.profiles.saveLocalProfile(updated);
    setProfile(saved);
    setActiveRoom((room) => room ? {
      ...room,
      participants: room.participants.map((participant) => participant.id === profile.id ? { ...participant, ...updated } : participant),
    } : room);
    setRooms((current) => current.map((room) => ({
      ...room,
      participants: room.participants.map((participant) => participant.id === profile.id ? { ...participant, ...updated } : participant),
    })));
  }, [profile]);

  const completeRoomEntry = useCallback(() => setIsEnteringRoom(false), []);

  const joinRoom = useCallback(async (roomId: string) => {
    if (activeRoom?.id === roomId) {
      setIsEnteringRoom(true);
      return activeRoom;
    }
    if (!profile) throw new Error('Finish setting up your profile first.');
    const baseRoom = await mockServices.rooms.joinRoom(roomId, profile);
    const room = withCurrentUser(baseRoom, profile);
    try {
      if (activeRoom) await mockServices.voice.switchRoom(room);
      else await mockServices.voice.joinRoom(room);
    } catch (error) {
      await mockServices.rooms.leaveRoom(roomId, profile.id).catch(() => undefined);
      throw error;
    }
    if (activeRoom) {
      await mockServices.rooms.leaveRoom(activeRoom.id, profile.id).catch(() => setToast('You switched Pods. The previous Pod is still closing.'));
      setRooms(await mockServices.rooms.listRooms());
    }
    setIsEnteringRoom(true);
    setActiveRoom(room);
    setIsMicMuted(true);
    return room;
  }, [activeRoom, profile]);

  const joinInvitedRoom = useCallback(async (inviteId: string) => {
    if (!profile) throw new Error('Finish setting up your profile first.');
    const baseRoom = await mockServices.invites.acceptInvite(inviteId, profile);
    const room = withCurrentUser(baseRoom, profile);
    try {
      if (activeRoom) await mockServices.voice.switchRoom(room);
      else await mockServices.voice.joinRoom(room);
    } catch (error) {
      await mockServices.rooms.leaveRoom(room.id, profile.id).catch(() => undefined);
      throw error;
    }
    if (activeRoom) {
      await mockServices.rooms.leaveRoom(activeRoom.id, profile.id).catch(() => setToast('You switched Pods. The previous Pod is still closing.'));
      setRooms(await mockServices.rooms.listRooms());
    }
    setInvites(await mockServices.invites.listInvites());
    setIsEnteringRoom(true);
    setActiveRoom(room);
    setIsMicMuted(true);
    return room;
  }, [activeRoom, profile]);

  const startNewPod = useCallback(async () => {
    if (!profile) throw new Error('Finish setting up your profile first.');
    const baseRoom = await mockServices.rooms.startNewPod(profile);
    const room = withCurrentUser(baseRoom, profile);
    try {
      if (activeRoom) await mockServices.voice.switchRoom(room);
      else await mockServices.voice.joinRoom(room);
    } catch (error) {
      await mockServices.rooms.leaveRoom(room.id, profile.id).catch(() => undefined);
      throw error;
    }
    if (activeRoom && activeRoom.id !== room.id) {
      await mockServices.rooms.leaveRoom(activeRoom.id, profile.id).catch(() => setToast('You switched Pods. The previous Pod is still closing.'));
    }
    setRooms(await mockServices.rooms.listRooms());
    setIsEnteringRoom(true);
    setActiveRoom(room);
    setIsMicMuted(true);
    return room;
  }, [activeRoom, profile]);

  const findRoom = useCallback((code: string) => mockServices.rooms.findRoomByCode(code), []);

  const shuffleRoom = useCallback(async () => {
    if (!activeRoom) return null;
    const nextRoomBase = await mockServices.rooms.shuffleToRoom(activeRoom.id, profile ?? undefined);
    if (!nextRoomBase) return null;
    if (!profile) throw new Error('Finish setting up your profile first.');
    const nextRoom = withCurrentUser(nextRoomBase, profile);
    try {
      await mockServices.voice.switchRoom(nextRoom);
    } catch (error) {
      await mockServices.rooms.leaveRoom(nextRoom.id, profile.id).catch(() => undefined);
      throw error;
    }
    try {
      await mockServices.rooms.leaveRoom(activeRoom.id, profile.id);
    } catch {
      setToast('You switched Pods. The previous Pod is still closing.');
    }
    setRooms(await mockServices.rooms.listRooms());
    setActiveRoom(nextRoom);
    setIsMicMuted(true);
    return nextRoom;
  }, [activeRoom, profile]);

  const leaveRoom = useCallback(async () => {
    const room = activeRoom;
    if (!room) return;
    await mockServices.voice.setMicrophoneMuted(true).catch(() => undefined);
    await mockServices.voice.leaveRoom(room.id).catch(() => undefined);
    await mockServices.rooms.leaveRoom(room.id, profile?.id).catch(() => setToast('The Pod is closed locally; server cleanup is still pending.'));
    setRooms(await mockServices.rooms.listRooms());
    setIsEnteringRoom(false);
    setActiveRoom(null);
    setIsMicMuted(true);
  }, [activeRoom, profile]);

  const toggleMic = useCallback(async () => {
    const nextMuted = !isMicMuted;
    try {
      await mockServices.voice.setMicrophoneMuted(nextMuted);
      setIsMicMuted(nextMuted);
      setToast(nextMuted ? 'Microphone off' : 'Microphone on');
    } catch {
      setToast(nextMuted ? 'Could not mute the microphone. Try again.' : 'Allow microphone access to speak.');
    }
  }, [isMicMuted]);

  const toggleLocalMute = useCallback(async (participantId: string) => {
    const muted = localMutedParticipantIds.includes(participantId);
    await mockServices.voice.setParticipantMutedLocally(participantId, !muted);
    setLocalMutedParticipantIds((previous) => previous.includes(participantId)
      ? previous.filter((id) => id !== participantId)
      : [...previous, participantId]);
  }, [localMutedParticipantIds]);

  const loadMessages = useCallback((conversationId: string) => mockServices.chats.listMessages(conversationId), []);

  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    if (!body.trim()) return;
    await mockServices.chats.sendMessage(conversationId, profile?.id ?? 'you', body.trim());
    setChats(await mockServices.chats.listChats());
  }, [profile]);

  const sendPhoto = useCallback(async (conversationId: string, image: { uri: string; contentType: string; size: number }) => {
    if (!mockServices.chats.sendPhoto) throw new Error('Photo sharing is not available in this preview.');
    await mockServices.chats.sendPhoto(conversationId, image);
    setChats(await mockServices.chats.listChats());
  }, []);

  const startConversation = useCallback(async (personId: string) => {
    const id = mockServices.chats.startConversation ? await mockServices.chats.startConversation(personId) : `chat-${personId}`;
    setChats(await mockServices.chats.listChats());
    return id;
  }, []);

  const subscribeMessages = useCallback((conversationId: string, onMessages: (messages: ChatMessage[]) => void, onError: (error: Error) => void) =>
    mockServices.chats.subscribeMessages?.(conversationId, onMessages, onError) ?? (() => undefined), []);

  const acceptRequest = useCallback(async (requestId: string) => {
    const request = friendRequests.find((item) => item.id === requestId);
    try {
      await mockServices.friends.acceptRequest(requestId);
      const [nextFriends, nextRequests] = await Promise.all([mockServices.friends.listFriends(), mockServices.friends.listRequests()]);
      setFriends(nextFriends);
      setFriendRequests(nextRequests);
      if (request) setToast(`${request.user.displayName} added to your friends`);
    } catch {
      setToast('Could not accept the request. Try again.');
    }
  }, [friendRequests]);

  const declineRequest = useCallback(async (requestId: string) => {
    try {
      await mockServices.friends.declineRequest(requestId);
      setFriendRequests(await mockServices.friends.listRequests());
      setToast('Request declined');
    } catch {
      setToast('Could not decline the request. Try again.');
    }
  }, []);

  const refreshFriends = useCallback(async () => {
    setFriends(await mockServices.friends.listFriends());
  }, []);

  const dismissInvite = useCallback(async (inviteId: string) => {
    try {
      await mockServices.invites.declineInvite(inviteId);
      setInvites(await mockServices.invites.listInvites());
      setToast('Invite declined');
    } catch {
      setToast('Could not decline the invite. Try again.');
    }
  }, []);

  const searchPeople = useCallback((query: string) => mockServices.friends.searchPeople(query, [...friends.map((friend) => friend.id), ...sentFriendRequestIds]), [friends, sentFriendRequestIds]);
  const sendFriendRequest = useCallback(async (userId: string) => {
    await mockServices.friends.sendFriendRequest(userId);
    setSentFriendRequestIds((previous) => previous.includes(userId) ? previous : [...previous, userId]);
  }, []);

  const sendInvite = useCallback(async (friendId: string) => {
    if (!activeRoom) throw new Error('Join a Pod before inviting a friend.');
    await mockServices.invites.sendInvite(activeRoom.id, friendId);
  }, [activeRoom]);

  const submitReport = useCallback((reportedUserId: string, reason: string) => mockServices.safety.submitReport(reportedUserId, reason), []);

  const value = useMemo<AppContextValue>(() => ({
    isReady, isAuthenticated, refreshAuthState, signIn, signUp, signOut, profile, completeOnboarding, updateProfile, rooms, activeRoom, isMicMuted, isEnteringRoom, completeRoomEntry, joinRoom, joinInvitedRoom, startNewPod,
    findRoom, shuffleRoom, leaveRoom, toggleMic, localMutedParticipantIds, toggleLocalMute, chats, loadMessages, sendMessage, sendPhoto, startConversation, subscribeMessages, friendRequests, friends,
    invites, acceptRequest, declineRequest, dismissInvite, sentFriendRequestIds, searchPeople, sendFriendRequest, sendInvite, submitReport, refreshFriends,
    showSheet: setSheet, sheet, closeSheet: () => setSheet(null),
    toast, showToast: setToast,
  }), [
    isReady, isAuthenticated, refreshAuthState, signIn, signUp, signOut, profile, completeOnboarding, updateProfile, rooms, activeRoom, isMicMuted, isEnteringRoom, completeRoomEntry, joinRoom, joinInvitedRoom, startNewPod,
    findRoom, shuffleRoom, leaveRoom, toggleMic, localMutedParticipantIds, toggleLocalMute, chats, loadMessages, sendMessage, sendPhoto, startConversation, subscribeMessages, friendRequests, friends,
    invites, acceptRequest, declineRequest, dismissInvite, sentFriendRequestIds, searchPeople, sendFriendRequest, sendInvite, submitReport, refreshFriends, sheet, toast,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
}
