import { createRealtimeClient } from '@neon/realtime/client';
import type { AppServices, ChatService, FriendService, InviteService, ProfileService, RoomService, SafetyService } from '@/services/contracts';
import { mockServices } from '@/services/mock-services';
import { neonApiUrl, neonRealtimeUrl, neonRequest } from '@/services/neon-auth';
import type { ChatMessage, ChatSummary, Friend, FriendRequest, RoomInvite, RoomPreview, UserProfile, UserSummary } from '@/types/domain';

const profileService: ProfileService = {
  async loadLocalProfile() {
    if (!neonApiUrl) return mockServices.profiles.loadLocalProfile();
    return neonRequest<UserProfile | null>('/api/profile/me');
  },
  async saveLocalProfile(profile) {
    if (!neonApiUrl) return mockServices.profiles.saveLocalProfile(profile);
    const saved = await neonRequest<UserProfile>('/api/profile/me', { method: 'PUT', body: JSON.stringify(profile) });
    await mockServices.profiles.saveLocalProfile(saved);
    return saved;
  },
};

const chatService: ChatService = {
  async listChats() {
    if (!neonApiUrl) return mockServices.chats.listChats();
    return neonRequest<ChatSummary[]>('/api/chats');
  },
  async listMessages(conversationId) {
    if (!neonApiUrl) return mockServices.chats.listMessages(conversationId);
    return neonRequest<ChatMessage[]>(`/api/chats/${encodeURIComponent(conversationId)}/messages`);
  },
  async startConversation(userId) {
    if (!neonApiUrl) return `chat-${userId}`;
    const result = await neonRequest<{ id: string }>('/api/chats/start', { method: 'POST', body: JSON.stringify({ userId }) });
    return result.id;
  },
  async sendMessage(conversationId, _senderId, body) {
    if (!neonApiUrl) return mockServices.chats.sendMessage(conversationId, _senderId, body);
    return neonRequest<ChatMessage>(`/api/chats/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
  },
  async sendPhoto(conversationId, image) {
    if (!neonApiUrl) throw new Error('Photo sharing needs Neon Object Storage.');
    const upload = await fetch(image.uri);
    const blob = await upload.blob();
    const { key, uploadUrl } = await neonRequest<{ key: string; uploadUrl: string }>(`/api/chats/${encodeURIComponent(conversationId)}/media`, {
      method: 'POST', body: JSON.stringify({ contentType: image.contentType, size: image.size || blob.size }),
    });
    const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': image.contentType }, body: blob });
    if (!response.ok) throw new Error('The photo upload failed. Try again.');
    return neonRequest<ChatMessage>(`/api/chats/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST', body: JSON.stringify({ body: '', imageKey: key }),
    });
  },
  subscribeMessages(conversationId, onMessages, onError) {
    if (!neonApiUrl || !neonRealtimeUrl) return () => undefined;
    const realtimeUrl = neonRealtimeUrl;
    let subscription: ReturnType<ReturnType<typeof createRealtimeClient>['subscribe']> | undefined;
    let client: ReturnType<typeof createRealtimeClient> | undefined;
    let disposed = false;
    let renewal: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      const sealed = await neonRequest<{ expiresAt: number; capability: string; queryFingerprint: string }>(`/api/chats/${encodeURIComponent(conversationId)}/live`);
      if (disposed) return;
      if (!client) {
        client = createRealtimeClient({ url: realtimeUrl });
        subscription = client.subscribe<LiveMessageRow>(sealed);
        subscription.onUpdate((update) => {
          if (update.type === 'rows' || update.type === 'changes') void chatService.listMessages(conversationId).then(onMessages).catch(onError);
        });
        subscription.onStateChange((state) => { if (state.status === 'error') onError(new Error(state.error.message)); });
      } else if (subscription) {
        await subscription.renew(sealed);
      }
      clearTimeout(renewal);
      renewal = setTimeout(() => { void refresh().catch((error) => onError(asError(error))); }, Math.max(1000, sealed.expiresAt - Date.now() - 10_000));
    };
    void refresh().catch((error) => onError(asError(error)));
    return () => {
      disposed = true;
      clearTimeout(renewal);
      subscription?.unsubscribe();
      client?.close();
    };
  },
};

const roomService: RoomService = {
  async listRooms() { return neonApiUrl ? neonRequest<RoomPreview[]>('/api/pods') : mockServices.rooms.listRooms(); },
  async findRoomByCode(code) { return neonApiUrl ? neonRequest<RoomPreview | null>(`/api/pods/code/${encodeURIComponent(code)}`) : mockServices.rooms.findRoomByCode(code); },
  async startNewPod(profile) { return neonApiUrl ? neonRequest<RoomPreview>('/api/pods/new', { method: 'POST' }) : mockServices.rooms.startNewPod(profile); },
  async joinRoom(roomId, profile) { return neonApiUrl ? neonRequest<RoomPreview>(`/api/pods/${encodeURIComponent(roomId)}/join`, { method: 'POST' }) : mockServices.rooms.joinRoom(roomId, profile); },
  async leaveRoom(roomId, userId) { if (neonApiUrl) await neonRequest(`/api/pods/${encodeURIComponent(roomId)}/leave`, { method: 'POST' }); else await mockServices.rooms.leaveRoom(roomId, userId); },
  async shuffleToRoom(currentRoomId, profile) { return neonApiUrl ? neonRequest<RoomPreview | null>(`/api/pods/${encodeURIComponent(currentRoomId)}/shuffle`, { method: 'POST' }) : mockServices.rooms.shuffleToRoom(currentRoomId, profile); },
};

const friendService: FriendService = {
  async listFriends() { return neonApiUrl ? neonRequest<Friend[]>('/api/friends') : mockServices.friends.listFriends(); },
  async listRequests() { return neonApiUrl ? neonRequest<FriendRequest[]>('/api/friend-requests') : mockServices.friends.listRequests(); },
  async searchPeople(query, excludedUserIds) {
    if (!neonApiUrl) return mockServices.friends.searchPeople(query, excludedUserIds);
    const people = await neonRequest<UserSummary[]>(`/api/friends/search?q=${encodeURIComponent(query)}`);
    return people.filter((person) => !excludedUserIds.includes(person.id));
  },
  async sendFriendRequest(userId) { if (neonApiUrl) await neonRequest('/api/friend-requests', { method: 'POST', body: JSON.stringify({ userId }) }); else await mockServices.friends.sendFriendRequest(userId); },
  async acceptRequest(requestId) { if (neonApiUrl) await neonRequest(`/api/friend-requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST' }); else await mockServices.friends.acceptRequest(requestId); },
  async declineRequest(requestId) { if (neonApiUrl) await neonRequest(`/api/friend-requests/${encodeURIComponent(requestId)}/decline`, { method: 'POST' }); else await mockServices.friends.declineRequest(requestId); },
};

const inviteService: InviteService = {
  async listInvites() { return neonApiUrl ? neonRequest<RoomInvite[]>('/api/invites') : mockServices.invites.listInvites(); },
  async sendInvite(roomId, friendId) { if (neonApiUrl) await neonRequest('/api/invites', { method: 'POST', body: JSON.stringify({ roomId, friendId }) }); else await mockServices.invites.sendInvite(roomId, friendId); },
  async acceptInvite(inviteId, profile) { return neonApiUrl ? neonRequest<RoomPreview>(`/api/invites/${encodeURIComponent(inviteId)}/accept`, { method: 'POST' }) : mockServices.invites.acceptInvite(inviteId, profile); },
  async declineInvite(inviteId) { if (neonApiUrl) await neonRequest(`/api/invites/${encodeURIComponent(inviteId)}/decline`, { method: 'POST' }); else await mockServices.invites.declineInvite(inviteId); },
};

const safetyService: SafetyService = {
  async submitReport(reportedUserId, reason) { if (neonApiUrl) await neonRequest('/api/reports', { method: 'POST', body: JSON.stringify({ reportedUserId, reason }) }); else await mockServices.safety.submitReport(reportedUserId, reason); },
};

type LiveMessageRow = { id: string; conversation_id: string; sender_id: string; body: string; image_key: string | null; created_at: string | Date };
function asError(error: unknown) { return error instanceof Error ? error : new Error('Live updates stopped.'); }

export const neonServices: AppServices = {
  ...mockServices,
  profiles: profileService,
  rooms: roomService,
  chats: chatService,
  friends: friendService,
  invites: inviteService,
  safety: safetyService,
};
