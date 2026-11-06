import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ElsefolkAvatar, avatarMouths, avatarSilhouettes } from '@/components/elsefolk-avatar';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { avatarPalettes } from '@/data/mock-data';

type Props = {
  shapeId: number;
  color: string;
  markId: number;
  onShapeChange: (id: number) => void;
  onColorChange: (color: string) => void;
  onMarkChange: (id: number) => void;
};

export function AvatarCustomizer({ shapeId, color, markId, onShapeChange, onColorChange, onMarkChange }: Props) {
  const preview = { displayName: 'Avatar preview', avatarId: shapeId, avatarShapeId: shapeId, avatarMarkId: markId, avatarColor: color };
  return (
    <View style={styles.container}>
      <View style={styles.previewRow}>
        <ElsefolkAvatar user={preview} size={76} bordered={false} />
        <View style={styles.previewCopy}><AppText variant="name">Your Elsefolk</AppText><AppText variant="caption" color={colors.muted}>Mix a shape, color, and mouth.</AppText></View>
      </View>
      <AppText variant="caption" style={styles.label}>Outer shape</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {avatarSilhouettes.map((_, i) => {
          const id = i + 1;
          const selected = id === shapeId;
          return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Outer shape ${id}`} accessibilityState={{ selected }} onPress={() => onShapeChange(id)} style={[styles.tile, selected && styles.selected]}><ElsefolkAvatar user={{ ...preview, avatarId: id, avatarShapeId: id }} size={36} bordered={false} /></Pressable>;
        })}
      </ScrollView>
      <AppText variant="caption" style={styles.label}>Color</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {avatarPalettes.map((swatch) => <Pressable key={swatch} accessibilityRole="button" accessibilityLabel={`Choose color ${swatch}`} accessibilityState={{ selected: swatch === color }} onPress={() => onColorChange(swatch)} style={[styles.colorTile, swatch === color && styles.selected]}><View style={[styles.swatch, { backgroundColor: swatch }]} /></Pressable>)}
      </ScrollView>
      <AppText variant="caption" style={styles.label}>Mouth</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {avatarMouths.map((_, i) => {
          const id = i + 1;
          const selected = id === markId;
          return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Mouth style ${id}`} accessibilityState={{ selected }} onPress={() => onMarkChange(id)} style={[styles.tile, selected && styles.selected]}><ElsefolkAvatar user={{ ...preview, avatarId: shapeId, avatarShapeId: shapeId, avatarMarkId: id }} size={36} bordered={false} /></Pressable>;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.one },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.three, paddingVertical: spacing.two },
  previewCopy: { flex: 1, gap: spacing.one },
  label: { marginTop: spacing.two, marginBottom: spacing.one, fontWeight: '600' },
  choices: { gap: spacing.two, paddingVertical: spacing.one, paddingRight: spacing.four },
  tile: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.field },
  colorTile: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.field },
  selected: { borderColor: colors.brand, backgroundColor: colors.lilac },
  swatch: { width: 28, height: 28, borderRadius: 14 },
});
