import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, PageGutter, TextField } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';
import { neonServicesConfigured } from '@/services/neon-auth';

export default function SignInScreen() {
  const router = useRouter();
  const app = useApp();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true); setError('');
    try {
      if (creating) await app.signUp(email.trim(), password);
      else await app.signIn(email.trim(), password);
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete sign-in. Try again.');
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <PageGutter style={styles.content}>
        <View style={styles.mark}><AppText variant="section" color={colors.brand}>E</AppText></View>
        <AppText variant="caption" color={colors.brand} style={styles.wordmark}>ELSEWHERE</AppText>
        <AppText variant="title">{creating ? 'Create your account' : 'Welcome back'}</AppText>
        <AppText variant="secondary" color={colors.muted} style={styles.intro}>Your email stays private. Your Elsewhere profile can use a name that feels like you.</AppText>
        <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoFocus />
        <TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
        {error ? <AppText variant="secondary" color={colors.danger} style={styles.error}>{error}</AppText> : null}
        {!neonServicesConfigured ? <AppText variant="secondary" color={colors.danger}>Neon project settings have not been pulled into this app yet.</AppText> : null}
        <Button title={busy ? 'Please wait…' : creating ? 'Create account' : 'Sign in'} variant="primary" disabled={busy || !neonServicesConfigured} onPress={() => void submit()} style={styles.submit} />
        {busy ? <ActivityIndicator color={colors.brand} style={styles.spinner} /> : null}
        <Button title={creating ? 'I already have an account' : 'Create a new account'} variant="quiet" disabled={busy} onPress={() => { setCreating(!creating); setError(''); }} style={styles.switch} />
      </PageGutter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', backgroundColor: colors.screen },
  content: { maxWidth: 440, alignSelf: 'center' },
  mark: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac, borderRadius: 17, marginBottom: spacing.four },
  wordmark: { fontWeight: '700', letterSpacing: 2, marginBottom: spacing.two },
  intro: { marginTop: spacing.two, marginBottom: spacing.four, maxWidth: 360 },
  error: { marginTop: spacing.three },
  submit: { marginTop: spacing.five },
  spinner: { marginTop: spacing.two },
  switch: { marginTop: spacing.three },
});
