import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { AvatarCustomizer } from '@/components/avatar-customizer';
import { AppText, Button, PageGutter, ScrollPage, TextField } from '@/components/ui';
import { avatarPalettes, createLocalProfile, isUsernameAvailable, usernameFromDisplayName } from '@/data/mock-data';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';
import { neonServicesConfigured } from '@/services/neon-auth';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isReady, isAuthenticated, profile, completeOnboarding, showToast } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const usernameEdited = useRef(false);
  const [avatarId, setAvatarId] = useState(4);
  const [avatarColor, setAvatarColor] = useState(avatarPalettes[3]);
  const [avatarMarkId, setAvatarMarkId] = useState(4);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isReady && neonServicesConfigured && !isAuthenticated) router.replace('/sign-in' as never);
    if (isReady && profile) router.replace('/(tabs)/voice');
  }, [isReady, isAuthenticated, profile, router]);

  async function continueToApp() {
    const name = displayName.trim();
    if (name.length < 2 || name.length > 24) {
      showToast('Choose a display name between 2 and 24 characters');
      return;
    }
    if (!/^[a-z0-9_]{3,18}$/.test(username) || !isUsernameAvailable(username)) {
      showToast('Choose an available username: 3–18 letters, numbers, or underscores');
      return;
    }
    setSaving(true);
    try {
      await completeOnboarding(createLocalProfile(name, username, avatarId, '', avatarColor, avatarMarkId));
      router.replace('/(tabs)/voice');
    } catch {
      showToast('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!isReady || profile || (neonServicesConfigured && !isAuthenticated)) {
    return <View style={styles.loading}><ActivityIndicator color={colors.brand} /></View>;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollPage contentStyle={styles.scrollContent}>
        <PageGutter style={styles.content}>
          <View style={styles.brandMark}><ElsefolkAvatar user={{ displayName: 'Avatar', avatarId, avatarShapeId: avatarId, avatarMarkId, avatarColor }} size={68} bordered={false} /></View>
          <AppText variant="caption" color={colors.brand} style={styles.wordmark}>ELSEWHERE</AppText>
          <AppText variant="title" style={styles.title}>A little Elsewhere to be yourself.</AppText>
          <AppText variant="body" color={colors.muted} style={styles.intro}>Meet Elsefolk in small voice Pods. Choose a display name and start with your mic off.</AppText>

          <View style={styles.form}>
            <TextField label="Display name" value={displayName} onChangeText={(value) => { setDisplayName(value); if (!usernameEdited.current) setUsername(usernameFromDisplayName(value)); }} placeholder="What should people call you?" maxLength={24} autoFocus />
            <TextField label="Username" value={username} onChangeText={(value) => { usernameEdited.current = true; setUsername(value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '').slice(0, 18)); }} placeholder="yourname" maxLength={18} />
            <AppText variant="caption" color={colors.muted}>Your unique @username helps friends find you. You can change it later.</AppText>
            <AppText variant="caption" style={styles.avatarLabel}>Customize your Elsefolk</AppText>
            <AvatarCustomizer shapeId={avatarId} color={avatarColor} markId={avatarMarkId} onShapeChange={setAvatarId} onColorChange={setAvatarColor} onMarkChange={setAvatarMarkId} />
            <AppText variant="caption" color={colors.muted} style={styles.privacy}>No real name, phone, camera, or contacts needed to continue.</AppText>
            <Button title={saving ? 'Setting up…' : 'Continue'} variant="primary" disabled={saving} onPress={() => void continueToApp()} style={styles.continueButton} />
          </View>
        </PageGutter>
      </ScrollPage>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.screen },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.screen },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.six },
  content: { maxWidth: 480, alignSelf: 'center' },
  brandMark: { width: 84, height: 84, marginBottom: spacing.four, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: colors.lilac },
  wordmark: { marginBottom: spacing.two, fontWeight: '700', letterSpacing: 2 },
  title: { maxWidth: 380 },
  intro: { marginTop: spacing.two, maxWidth: 370, fontSize: 16, lineHeight: 24 },
  form: { marginTop: spacing.six },
  avatarLabel: { marginTop: spacing.five, marginBottom: spacing.two, fontWeight: '600' },
  privacy: { marginTop: spacing.two },
  continueButton: { marginTop: spacing.four },
});
