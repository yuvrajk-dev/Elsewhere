import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ParticipantRow } from '@/components/social-rows';
import { AppText, Button, EmptyState, PageGutter, ScrollPage, ScreenShell, SectionHeading } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';

export default function VoiceRoomScreen() {
  const app = useApp();
  const router = useRouter();
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    if (app.activeRoom) app.completeRoomEntry();
  }, [app.activeRoom, app.completeRoomEntry]);

  function leaveRoom() {
    app.showSheet({ kind: 'leave-room' });
  }

  async function shuffle() {
    if (shuffling) return;
    setShuffling(true);
    try {
      const nextRoom = await app.shuffleRoom();
      if (!nextRoom) app.showToast('No other Pods are available right now');
      else app.showToast('Joined another Pod · mic off');
    } catch {
      app.showToast('Could not find another Pod. You stayed here.');
    } finally {
      setShuffling(false);
    }
  }

  return (
    <ScreenShell>
      {app.activeRoom ? (
        <ScrollPage>
          <PageGutter>
            <View style={styles.toolbar}>
              <View style={styles.connection}><View style={styles.dot} /><AppText variant="caption" color={colors.muted} style={styles.connectionText}>Voice preview</AppText></View>
              <View style={styles.toolbarActions}>
                <Button title="Invite" onPress={() => app.showSheet({ kind: 'invite' })} compact />
                <Button title="Leave Pod" accessibilityLabel="Open leave confirmation" onPress={leaveRoom} compact />
              </View>
            </View>
            <SectionHeading title={`People · ${app.activeRoom.participants.length}`} trailing={<Button title={shuffling ? 'Finding a Pod…' : 'Shuffle'} icon="shuffle" variant="outline" disabled={shuffling} onPress={() => void shuffle()} />} style={styles.peopleHeading} />
            {app.activeRoom.participants.map((participant) => (
              <ParticipantRow key={participant.id} participant={participant} locallyMuted={app.localMutedParticipantIds.includes(participant.id)} onPress={() => participant.isYou ? undefined : app.showSheet({ kind: 'participant', participant })} />
            ))}
            <AppText variant="caption" color={colors.muted} style={styles.micHint}>{app.isMicMuted ? 'Live audio is not connected; your mic stays off.' : 'Mic state is simulated here; no audio is being sent.'}</AppText>
          </PageGutter>
        </ScrollPage>
      ) : (
        <PageGutter style={styles.emptyRoom}>
          <EmptyState
            title="No Pod is open"
            description="Join a Pod to see its participants here."
            action={<Button title="Browse Pods" variant="primary" onPress={() => router.replace('/(tabs)/voice')} />}
          />
        </PageGutter>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  toolbar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.two, marginBottom: spacing.two },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.icon },
  connectionText: { fontWeight: '600' },
  toolbarActions: { flexDirection: 'row', gap: spacing.two },
  peopleHeading: { marginBottom: spacing.two },
  micHint: { textAlign: 'center', paddingVertical: spacing.five },
  emptyRoom: { flex: 1, justifyContent: 'center' },
});
