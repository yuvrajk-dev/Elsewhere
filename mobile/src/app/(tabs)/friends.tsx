import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActiveFriendCard, FriendRow } from '@/components/social-rows';
import { AppText, Button, EmptyState, IconButton, PageGutter, ScrollPage, ScreenHeader, ScreenShell, SearchField, SectionHeading } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';

export default function FriendsScreen() {
  const app = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const filteredFriends = useMemo(() => app.friends.filter((person) => `${person.displayName} ${person.username}`.toLowerCase().includes(query.toLowerCase())), [app.friends, query]);
  const activeFriends = app.friends.filter((person) => person.activeRoomCode);
  const refreshFriends = app.refreshFriends;

  useFocusEffect(useCallback(() => {
    void refreshFriends().catch(() => app.showToast('Could not refresh friends. Try again.'));
  }, [app.showToast, refreshFriends]));

  async function openActiveRoom(code?: string) {
    if (!code) return;
    const room = await app.findRoom(code);
    if (!room) {
      app.showToast('That Pod is no longer available');
      return;
    }
    try {
      await app.joinRoom(room.id);
      router.navigate('/(tabs)/room' as never);
    } catch (error) {
      app.showToast(error instanceof Error ? error.message : 'Could not join the Pod. Try again.');
    }
  }

  return (
    <ScreenShell>
      <ScrollPage>
        <PageGutter>
          <ScreenHeader title="Friends" action={(
            <View style={styles.headerActions}>
              <View style={styles.requestsButton}>
                <IconButton
                  icon="friends"
                  label={app.friendRequests.length ? `Friend requests, ${app.friendRequests.length} received` : 'Friend requests'}
                  onPress={() => app.showSheet({ kind: 'friend-requests' })}
                />
                {app.friendRequests.length ? (
                  <View style={styles.requestBadge}>
                    <AppText variant="caption" color={colors.surface} style={styles.requestBadgeText}>{app.friendRequests.length > 9 ? '9+' : app.friendRequests.length}</AppText>
                  </View>
                ) : null}
              </View>
              <Button title="Add friend" icon="plus" variant="outline" compact onPress={() => app.showSheet({ kind: 'add-friend' })} />
            </View>
          )} />
          <SearchField value={query} onChangeText={setQuery} placeholder="Search your friends" compact accessibilityLabel="Search your friends" />

          {activeFriends.length ? <View style={styles.section}>
            <SectionHeading title="Active now" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeRail}>
              {activeFriends.map((friend) => <ActiveFriendCard key={friend.id} friend={friend} onPress={() => void openActiveRoom(friend.activeRoomCode)} />)}
            </ScrollView>
          </View> : null}

          <View style={styles.section}>
            <SectionHeading title="Your friends" />
            {filteredFriends.length ? filteredFriends.map((friend) => (
              <FriendRow key={friend.id} friend={friend} onChat={() => { void app.startConversation(friend.id).then((conversationId) => router.push({ pathname: '/chat/[id]', params: { id: conversationId, personId: friend.id } })).catch((error) => app.showToast(error instanceof Error ? error.message : 'Could not start this chat.')); }} />
            )) : <EmptyState title="No friends found" description="Try another name or username." />}
          </View>
        </PageGutter>
      </ScrollPage>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  requestsButton: { position: 'relative' },
  requestBadge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.screen },
  requestBadgeText: { color: colors.surface, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  section: { marginTop: spacing.four },
  activeRail: { gap: spacing.two, paddingRight: spacing.two, paddingBottom: spacing.two },
});
