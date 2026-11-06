import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { RoomCard } from '@/components/social-rows';
import { AppText, IconButton, PageGutter, ScrollPage, ScreenHeader, ScreenShell, SectionHeading } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';

export default function VoiceDiscoveryScreen() {
  const app = useApp();
  const router = useRouter();

  async function join(roomId: string) {
    try {
      await app.joinRoom(roomId);
      router.navigate('/(tabs)/room' as never);
    } catch (error) {
      app.showToast(error instanceof Error ? error.message : 'Could not join the Pod. Try again.');
    }
  }

  return (
    <ScreenShell>
      <ScrollPage>
        <PageGutter>
          <ScreenHeader
            title="Pods"
            subtitle="Find a Pod that feels right."
            action={(
              <View style={styles.headerActions}>
                <IconButton icon="search" label="Search Pods by code" onPress={() => app.showSheet({ kind: 'find-room' })} />
                <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.navigate('/(tabs)/profile')} style={styles.profileButton}>
                  {app.profile ? <ElsefolkAvatar user={app.profile} size={40} bordered={false} /> : <IconButton icon="profile" label="Open profile" onPress={() => router.navigate('/(tabs)/profile')} />}
                </Pressable>
              </View>
            )}
          />
          <SectionHeading title="Open Pods" style={styles.roomHeading} />
          {app.rooms.map((room) => <RoomCard
            key={room.id}
            room={room}
            onJoin={() => void join(room.id)}
            onPremiumRequired={() => app.showToast('Premium Pod access is not configured yet')}
          />)}
          <AppText variant="caption" color={colors.muted} style={styles.helper}>Small Pods make it easier for everyone to be heard.</AppText>
        </PageGutter>
      </ScrollPage>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  profileButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.lilac },
  roomHeading: { marginTop: spacing.two },
  helper: { paddingVertical: spacing.four, textAlign: 'center' },
});
