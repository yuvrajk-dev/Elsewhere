import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { MenuRow, PrivacyNote } from '@/components/social-rows';
import { AppText, Button, PageGutter, ScrollPage, ScreenHeader, ScreenShell } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';
import { neonServicesConfigured } from '@/services/neon-auth';

export default function ProfileScreen() {
  const app = useApp();
  const router = useRouter();
  const profile = app.profile;
  return (
    <ScreenShell>
      <ScrollPage>
        <PageGutter>
          <ScreenHeader title="Profile" action={<Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => app.showToast('Settings are coming soon')} style={styles.settingsButton}><AppText variant="caption" color={colors.brand}>Settings</AppText></Pressable>} />
          {profile ? (
            <View style={styles.profileCard}>
              <ElsefolkAvatar user={profile} size={58} />
              <View style={styles.profileCopy}>
                <AppText variant="section">{profile.displayName}</AppText>
                <AppText variant="secondary" color={colors.muted}>@{profile.username}</AppText>
                {profile.bio ? <AppText variant="caption" color={colors.muted} numberOfLines={2} style={styles.bio}>{profile.bio}</AppText> : null}
              </View>
            </View>
          ) : null}
          <PrivacyNote />
          <Button title="Edit profile" variant="outline" onPress={() => app.showSheet({ kind: 'edit-profile' })} style={styles.editButton} />
          <View style={styles.menu}>
            <MenuRow icon="spark" title="Premium" onPress={() => app.showToast('Premium details will be available soon')} />
            <MenuRow icon="shield" title="Privacy & safety" onPress={() => app.showToast('Privacy controls are coming soon')} />
            <MenuRow icon="settings" title="Settings" onPress={() => app.showToast('Settings are coming soon')} />
            <MenuRow icon="help" title="Help & support" onPress={() => app.showToast('Help & support are coming soon')} />
          </View>
          {neonServicesConfigured ? <Button title="Sign out" variant="quiet" onPress={() => { void app.signOut().then(() => router.replace('/sign-in' as never)).catch(() => app.showToast('Could not sign out. Try again.')); }} style={styles.signOut} /> : null}
          <AppText variant="caption" color={colors.muted} style={styles.version}>Elsewhere · Preview</AppText>
        </PageGutter>
      </ScrollPage>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  profileCard: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.three, padding: spacing.four, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, backgroundColor: colors.surface },
  profileCopy: { flex: 1, minWidth: 0, gap: 2 },
  bio: { marginTop: 4 },
  settingsButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.two },
  editButton: { alignSelf: 'flex-start' },
  menu: { marginTop: spacing.five, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  version: { textAlign: 'center', paddingVertical: spacing.six },
  signOut: { alignSelf: 'center', marginTop: spacing.two },
});
