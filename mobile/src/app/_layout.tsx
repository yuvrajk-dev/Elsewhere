import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppFrame } from '@/components/ui';
import { GlobalOverlays } from '@/components/global-overlays';
import { colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/state/app-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootContent() {
  const { isReady } = useApp();
  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  return (
    <AppFrame>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.screen } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <GlobalOverlays />
    </AppFrame>
  );
}
