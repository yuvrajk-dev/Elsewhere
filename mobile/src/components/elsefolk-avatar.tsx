import Svg, { Path } from 'react-native-svg';
import { colors } from '@/constants/theme';
import type { UserSummary } from '@/types/domain';

export const avatarSilhouettes = [
  'M24 5c-8 0-14 7-14 17 0 8 5 15 14 15s14-7 14-15C38 12 32 5 24 5Z',
  'M9 19c0-8 6-14 15-14s15 6 15 14c0 10-6 18-15 18S9 29 9 19Z',
  'M24 5c-7 0-12 6-12 14v9c0 6 5 10 12 10s12-4 12-10v-9C36 11 31 5 24 5Z',
  'M24 7c-9 0-13 7-13 16 0 8 5 14 13 14s13-6 13-14C37 14 33 7 24 7Z',
  'M24 5 37 18v8c0 7-6 11-13 11s-13-4-13-11v-8L24 5Z',
  'M11 13c4-7 22-7 26 0v13c0 7-6 11-13 11s-13-4-13-11V13Z',
  'M24 5c-9 0-13 8-13 18 0 8 5 14 13 14s13-6 13-14C37 13 33 5 24 5Z',
  'M12 18c0-8 5-13 12-13s12 5 12 13v10c0 6-5 10-12 10s-12-4-12-10V18Z',
  'M24 5c-6 0-10 4-11 10l-5 4 5 3v7c0 7 5 12 11 12s11-5 11-12v-7l5-3-5-4C34 9 30 5 24 5Z',
  'M24 5c-8 0-13 6-13 14v9c0 7 5 11 13 11s13-4 13-11v-9C37 11 32 5 24 5Z',
  'M24 6c-7 0-12 5-12 13v11c0 6 5 10 12 10s12-4 12-10V19c0-8-5-13-12-13Z',
  'M24 5c-9 0-14 7-14 16 0 9 5 16 14 16s14-7 14-16C38 12 33 5 24 5Z',
  'M24 5c-8 0-13 7-13 15v10c0 6 5 10 13 10s13-4 13-10V20c0-8-5-15-13-15Z',
  'M24 5c-6 0-10 6-10 14v12c0 6 4 9 10 9s10-3 10-9V19C34 11 30 5 24 5Z',
  'M24 6c-10 0-14 7-14 16 0 8 5 14 14 14s14-6 14-14C38 13 34 6 24 6Z',
  'M11 18 17 7l7 5 7-5 7 11v10c0 7-6 11-14 11s-13-4-13-11V18Z',
  'M24 5c-7 0-12 5-12 13v12c0 6 5 9 12 9s12-3 12-9V18c0-8-5-13-12-13Z',
  'M24 5c-8 0-13 6-13 15v10c0 7 5 11 13 11s13-4 13-11V20c0-9-5-15-13-15Z',
  'M24 6c-9 0-13 7-13 15v9c0 6 5 10 13 10s13-4 13-10v-9C37 13 33 6 24 6Z',
  'M24 5c-7 0-12 5-12 13v11c0 7 5 11 12 11s12-4 12-11V18c0-8-5-13-12-13Z',
];

export const avatarMouths = [
  'M24 26v7', 'M16 29h7m2 0h7', 'M24 26l3 3-3 3-3-3 3-3Z', 'M30 26l3 3-3 3-3-3 3-3Z',
  'M14 30h5', 'M24 26c3 2 4 3 4 6', 'M18 26l3 3-3 3-3-3 3-3Z', 'M29 28l4 2-4 2-4-2 4-2Z',
  'M24 26l4 3-4 3-4-3 4-3Z', 'M16 27l4 2-4 2-4-2 4-2Z', 'M25 26c3 1 5 2 6 4', 'M24 26l-4 5h8l-4-5Z',
  'M29 26l-4 5h8l-4-5Z', 'M24 25v7m-3-4h6', 'M24 26l3 3-3 3-3-3 3-3Z', 'M18 27h5m-2-3v7',
  'M31 26l-3 5h6l-3-5Z', 'M24 25l2 4-2 4-2-4 2-4Z', 'M17 27c2 1 3 2 3 4', 'M28 26l4 3-4 3-4-3 4-3Z',
];

type Props = { user: Pick<UserSummary, 'displayName' | 'avatarId' | 'avatarColor' | 'avatarShapeId' | 'avatarMarkId'>; size?: number; bordered?: boolean };

export function ElsefolkAvatar({ user, size = 44, bordered = true }: Props) {
  const shapeIndex = (Math.max(1, user.avatarShapeId ?? user.avatarId) - 1) % avatarSilhouettes.length;
  const markIndex = (Math.max(1, user.avatarMarkId ?? user.avatarId) - 1) % avatarMouths.length;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${user.displayName}'s Elsefolk character`}
      style={{
        flexShrink: 0,
        borderRadius: size * 0.32,
        backgroundColor: `${user.avatarColor}24`,
        borderWidth: bordered ? 2 : 0,
        borderColor: colors.surface,
      }}>
      <Path d={avatarSilhouettes[shapeIndex]} fill={user.avatarColor} />
      <Path d={avatarMouths[markIndex]} fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.78} />
    </Svg>
  );
}
