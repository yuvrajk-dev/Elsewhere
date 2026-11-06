import { useRouter } from 'expo-router';
import { InviteCard } from '@/components/social-rows';
import { EmptyState, PageGutter, ScrollPage, ScreenHeader, ScreenShell } from '@/components/ui';
import { useApp } from '@/state/app-provider';

export default function InvitesScreen() {
  const app = useApp();
  const router = useRouter();

  async function joinInvite(inviteId: string) {
    try {
      await app.joinInvitedRoom(inviteId);
      router.navigate('/(tabs)/room' as never);
    } catch (error) {
      app.showToast(error instanceof Error ? error.message : 'Could not join the Pod. Try again.');
    }
  }

  return (
    <ScreenShell>
      <ScrollPage>
        <PageGutter>
          <ScreenHeader title="Invites" subtitle="Pod invitations from your friends." />
          {app.invites.length ? app.invites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} onJoin={() => void joinInvite(invite.id)} onDecline={() => void app.dismissInvite(invite.id)} />
          )) : <EmptyState title="No invites yet" description="When a friend invites you to a Pod, it will appear here." />}
        </PageGutter>
      </ScrollPage>
    </ScreenShell>
  );
}
