import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, radius, spacing } from '@/constants/theme';
import type { IconName } from '@/components/icon';
import { Icon } from '@/components/icon';

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.frame}>
      <View style={styles.appSurface}>{children}</View>
    </View>
  );
}

export function ScreenShell({ children, safeBottom = false }: { children: ReactNode; safeBottom?: boolean }) {
  return (
    <SafeAreaView edges={safeBottom ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.screen}>{children}</View>
    </SafeAreaView>
  );
}

export function ScrollPage({ children, contentStyle }: { children: ReactNode; contentStyle?: object }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

type TextVariant = 'title' | 'section' | 'body' | 'secondary' | 'caption' | 'button' | 'name';

export function AppText({ children, variant = 'body', color, style, numberOfLines }: {
  children: ReactNode; variant?: TextVariant; color?: string; style?: object; numberOfLines?: number;
}) {
  return <Text numberOfLines={numberOfLines} style={[textStyles[variant], color ? { color } : null, style]}>{children}</Text>;
}

export function PageGutter({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.gutter, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle, action, style }: { title: string; subtitle?: string; action?: ReactNode; style?: object }) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerCopy}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="secondary" color={colors.muted} style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      {action ? <View style={styles.headerAction}>{action}</View> : null}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'quiet';
export function Button({ title, onPress, variant = 'secondary', icon, disabled, compact, accessibilityLabel, style }: {
  title: string; onPress: () => void; variant?: ButtonVariant; icon?: IconName; disabled?: boolean;
  compact?: boolean; accessibilityLabel?: string; style?: object;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        buttonVariants[variant],
        disabled && styles.buttonDisabled,
        pressed && !disabled && (variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed),
        style,
      ]}>
      {icon ? <Icon name={icon} size={18} color={variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : colors.brand} /> : null}
      <AppText variant="button" color={variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : variant === 'outline' ? colors.brand : colors.text}>
        {title}
      </AppText>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, tone = 'soft', size = 44 }: {
  icon: IconName; onPress: () => void; label: string; tone?: 'soft' | 'plain'; size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { width: size, height: size }, tone === 'soft' ? styles.iconSoft : styles.iconPlain, pressed && styles.secondaryPressed]}>
      <Icon name={icon} color={colors.brand} />
    </Pressable>
  );
}

export function SearchField({ value, onChangeText, placeholder, compact = false, autoFocus = false, keyboardType = 'default', maxLength, accessibilityLabel }: {
  value: string; onChangeText: (text: string) => void; placeholder: string; compact?: boolean; autoFocus?: boolean;
  keyboardType?: 'default' | 'numeric'; maxLength?: number; accessibilityLabel?: string;
}) {
  return (
    <View style={[styles.searchField, compact && styles.searchCompact]}>
      <Icon name="search" size={compact ? 17 : 20} color={colors.icon} />
      <TextInput
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
    </View>
  );
}

export function TextField({ label, value, onChangeText, placeholder, multiline = false, maxLength, keyboardType = 'default', autoFocus = false, secureTextEntry = false }: {
  label: string; value: string; onChangeText: (text: string) => void; placeholder: string;
  multiline?: boolean; maxLength?: number; keyboardType?: 'default' | 'numeric' | 'email-address'; autoFocus?: boolean; secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <AppText variant="caption" style={styles.fieldLabel}>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === 'default' ? 'sentences' : 'none'}
        autoCorrect={false}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.textField, multiline && styles.multilineField]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

export function SectionHeading({ title, trailing, style }: { title: string; trailing?: ReactNode; style?: object }) {
  return <View style={[styles.sectionHeading, style]}><AppText variant="section">{title}</AppText>{trailing}</View>;
}

export function Divider({ style }: { style?: object }) {
  return <View style={[styles.divider, style]} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Icon name="spark" size={24} color={colors.brand} /></View>
      <AppText variant="name" style={styles.emptyTitle}>{title}</AppText>
      <AppText variant="secondary" color={colors.muted} style={styles.emptyDescription}>{description}</AppText>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

const textStyles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -1.05 },
  section: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  secondary: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '400' },
  caption: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  button: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  name: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});

const buttonVariants = StyleSheet.create({
  primary: { backgroundColor: colors.brand, borderColor: colors.brand, color: colors.surface },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  outline: { backgroundColor: colors.surface, borderColor: '#DEDBFA' },
  danger: { backgroundColor: colors.surface, borderColor: colors.border },
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
});

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center' },
  appSurface: { flex: 1, width: '100%', maxWidth: 520, backgroundColor: colors.screen, overflow: 'hidden' },
  safeArea: { flex: 1, backgroundColor: colors.screen },
  screen: { flex: 1, backgroundColor: colors.screen },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.six },
  gutter: { paddingHorizontal: layout.gutter, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.three, marginBottom: spacing.five },
  headerCopy: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 4 },
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  button: { minHeight: 44, minWidth: 44, paddingHorizontal: 14, borderWidth: 1, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  buttonCompact: { minHeight: layout.minTapTarget, paddingHorizontal: 10 },
  buttonDisabled: { opacity: 0.55 },
  primaryPressed: { backgroundColor: colors.brandPressed, borderColor: colors.brandPressed, opacity: 0.95 },
  secondaryPressed: { backgroundColor: colors.lilac },
  iconButton: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.control },
  iconSoft: { backgroundColor: colors.field },
  iconPlain: { backgroundColor: 'transparent' },
  searchField: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, backgroundColor: colors.field },
  searchCompact: { minHeight: 40, paddingHorizontal: 10, gap: 7 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, color: colors.text, fontSize: 14, lineHeight: 20 },
  fieldGroup: { gap: 7, marginTop: spacing.three },
  fieldLabel: { color: colors.text, fontWeight: '600' },
  textField: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, backgroundColor: colors.field, color: colors.text, fontSize: 14, lineHeight: 20 },
  multilineField: { minHeight: 90, paddingTop: 12, paddingBottom: 12 },
  sectionHeading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.three, marginBottom: spacing.two },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.six, paddingVertical: spacing.eight, minHeight: 220 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac, marginBottom: spacing.four },
  emptyTitle: { textAlign: 'center', marginBottom: spacing.two },
  emptyDescription: { textAlign: 'center', maxWidth: 280 },
  emptyAction: { marginTop: spacing.four },
});
