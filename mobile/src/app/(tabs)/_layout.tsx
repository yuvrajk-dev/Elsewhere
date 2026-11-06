import { Tabs } from 'expo-router';
import { AppTabBar } from '@/components/app-tab-bar';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.screen }, tabBarHideOnKeyboard: true }}
      tabBar={({ state, navigateToTab }) => (
        <AppTabBar
          current={state.routes[state.index]?.name ?? 'voice'}
          navigateTo={(name) => {
            const route = state.routes.find((item) => item.name === name);
            if (route) navigateToTab(route.key);
          }}
        />
      )}>
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="voice" />
      <Tabs.Screen name="room" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="invites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
