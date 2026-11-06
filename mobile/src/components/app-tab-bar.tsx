import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ElsefolkAvatar } from '@/components/elsefolk-avatar';
import { Icon, type IconName } from '@/components/icon';
import { AppText } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';
import type { AppTab } from '@/types/domain';

const tabs: Array<{ key: Exclude<AppTab, 'room'>; label: string; icon: IconName }> = [
  { key: 'chats', label: 'Chats', icon: 'chats' },
  { key: 'friends', label: 'Friends', icon: 'friends' },
  { key: 'voice', label: 'Pods', icon: 'voice' },
  { key: 'invites', label: 'Invites', icon: 'invites' },
  { key: 'profile', label: 'Profile', icon: 'profile' },
];

type AppTabBarProps = {
  current: string;
  navigateTo: (route: string) => void;
};

export function AppTabBar({ current, navigateTo }: AppTabBarProps) {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [startingPod, setStartingPod] = useState(false);
  const insideRoom = current === 'room';
  const centerStartsNewPod = !app.activeRoom && current === 'voice';
  const enteringRoom = app.isEnteringRoom;
  const centerLabel = !app.activeRoom
    ? centerStartsNewPod ? 'Start a new Pod' : 'Pods'
    : insideRoom || enteringRoom
      ? (app.isMicMuted ? 'Turn microphone on' : 'Turn microphone off')
      : 'Return to Pod';
  const centerIcon: IconName = !app.activeRoom
    ? centerStartsNewPod ? 'plus' : 'voice'
    : insideRoom || enteringRoom
      ? (app.isMicMuted ? 'mic-off' : 'mic-on')
      : 'room-enter';

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible) return null;

  function navigate(tab: Exclude<AppTab, 'room'>) {
    navigateTo(tab);
  }

  async function centerAction() {
    if (!app.activeRoom) {
      if (centerStartsNewPod) {
        if (startingPod) return;
        setStartingPod(true);
        try {
          await app.startNewPod();
          navigateTo('room');
        } catch (error) {
          app.showToast(error instanceof Error ? error.message : 'Could not start a new Pod. Try again.');
        } finally {
          setStartingPod(false);
        }
      }
      else navigateTo('voice');
    } else if (insideRoom || enteringRoom) {
      await app.toggleMic();
    } else {
      navigateTo('room');
    }
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {tabs.slice(0, 2).map((tab) => <NavItem key={tab.key} tab={tab} active={current === tab.key} onPress={() => navigate(tab.key)} />)}
        <View style={[styles.centerSlot, styles.centerActionSlot]}>
          <Pressable
            accessibilityRole={app.activeRoom || centerStartsNewPod ? 'button' : 'tab'}
            accessibilityLabel={centerLabel}
            accessibilityState={!app.activeRoom ? { selected: current === 'voice' } : undefined}
            disabled={startingPod}
            onPress={() => void centerAction()}
            style={({ pressed }) => [styles.center, pressed && styles.centerPressed]}>
            <Icon name={centerIcon} size={24} color={colors.surface} strokeWidth={1.9} />
          </Pressable>
        </View>
        {tabs.slice(3).map((tab) => <NavItem key={tab.key} tab={tab} active={current === tab.key} onPress={() => navigate(tab.key)} />)}
      </View>
    </View>
  );
}

function NavItem({ tab, active, onPress }: { tab: (typeof tabs)[number]; active: boolean; onPress: () => void }) {
  const app = useApp();
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.navItem, pressed && styles.navPressed]}>
      {tab.key === 'profile' && app.profile ? <ElsefolkAvatar user={app.profile} size={23} bordered={false} /> : <Icon name={tab.icon} size={22} color={active ? colors.brand : colors.icon} />}
      <AppText variant="caption" color={active ? colors.brand : colors.icon} style={active ? styles.activeLabel : undefined}>{tab.label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.screen },
  bar: { minHeight: layout.tabBarHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.two, paddingTop: spacing.one, paddingBottom: 8 },
  navItem: { flex: 1, minWidth: 44, height: 50, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: radius.control },
  navPressed: { backgroundColor: colors.field },
  activeLabel: { fontWeight: '700' },
  centerSlot: { flex: 1, minWidth: 58, alignItems: 'center', justifyContent: 'center' },
  centerActionSlot: { height: 58, marginTop: -14 },
  center: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: colors.brand, shadowColor: colors.brand, shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  centerPressed: { backgroundColor: colors.brandPressed, transform: [{ scale: 0.96 }] },
});
