import { createInternalNeonAuth } from '@neon/auth';

export const neonAuthUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;
export const neonApiUrl = process.env.EXPO_PUBLIC_ELSEWHERE_API_URL;
export const neonRealtimeUrl = process.env.EXPO_PUBLIC_NEON_REALTIME_URL;
export const neonServicesConfigured = Boolean(neonAuthUrl && neonApiUrl);

const auth = neonAuthUrl ? createInternalNeonAuth(neonAuthUrl) : null;
export const neonAuth = auth?.adapter ?? null;

export async function getNeonAccessToken() {
  if (!auth) throw new Error('Neon Auth is not configured. Pull the project environment and restart Expo.');
  const token = await auth.getJWTToken();
  if (!token) throw new Error('Sign in to continue.');
  return token;
}

export async function neonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!neonApiUrl) throw new Error('The Elsewhere API is not configured.');
  const token = await getNeonAccessToken();
  const response = await fetch(`${neonApiUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status}).`);
  return data as T;
}
