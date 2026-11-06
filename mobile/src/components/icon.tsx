import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';

export type IconName = 'chats' | 'friends' | 'voice' | 'invites' | 'profile' | 'plus' | 'search' | 'back' | 'room-enter' | 'shuffle' | 'mic-off' | 'mic-on' | 'chevron' | 'close' | 'check' | 'shield' | 'settings' | 'help' | 'send' | 'edit' | 'spark' | 'lock' | 'arrow-right' | 'more';

type IconProps = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color = colors.icon, strokeWidth = 1.8 }: IconProps) {
  const common = { fill: 'none' as const, stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {name === 'chats' && <Path {...common} d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" />}
      {name === 'friends' && <><Circle {...common} cx="9" cy="8" r="3.2" /><Path {...common} d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5a3 3 0 0 1 0 6M17 14a4.5 4.5 0 0 1 3.5 4" /></>}
      {name === 'voice' && <Path {...common} strokeLinecap="round" d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />}
      {name === 'invites' && <><Rect {...common} x="3" y="5" width="18" height="14" rx="2.5" /><Path {...common} d="m4 7 8 6 8-6" /></>}
      {name === 'profile' && <><Circle {...common} cx="12" cy="8" r="3.5" /><Path {...common} d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>}
      {name === 'plus' && <Path {...common} strokeWidth={2.1} d="M12 5v14M5 12h14" />}
      {name === 'search' && <><Circle {...common} cx="10.8" cy="10.8" r="6.8" /><Path {...common} d="m16 16 4.5 4.5" /></>}
      {name === 'back' && <Path {...common} d="m14.5 18-6-6 6-6M8.5 12h11" />}
      {name === 'room-enter' && <Path {...common} d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7M12 12h9m-4-4 4 4-4 4" />}
      {name === 'shuffle' && <Path {...common} d="m16 3 4 4-4 4M4 7h2c5 0 7 10 12 10h2M16 14l4 3-4 3M4 17h2c2 0 3-2 4-4" />}
      {name === 'mic-off' && <><Rect {...common} x="9" y="3" width="6" height="12" rx="3" /><Path {...common} d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6M3 3l18 18" /></>}
      {name === 'mic-on' && <><Rect {...common} x="9" y="3" width="6" height="12" rx="3" /><Path {...common} d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" /></>}
      {name === 'chevron' && <Path {...common} d="m9 18 6-6-6-6" />}
      {name === 'close' && <Path {...common} d="m6 6 12 12M18 6 6 18" />}
      {name === 'check' && <Path {...common} d="m5 12 4 4L19 6" />}
      {name === 'shield' && <><Path {...common} d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" /><Path {...common} d="m9 12 2 2 4-4" /></>}
      {name === 'settings' && <><Circle {...common} cx="12" cy="12" r="3" /><Path {...common} d="m19.4 15 .1.1 1.3 1-1.3 2.3-1.6-.6a8 8 0 0 1-1.4.8l-.3 1.7h-2.6l-.3-1.7a8 8 0 0 1-1.4-.8l-1.6.6L7 16.1l1.3-1a7 7 0 0 1 0-1.7l-1.3-1 1.3-2.3 1.6.6a8 8 0 0 1 1.4-.8l.3-1.7h2.6l.3 1.7a8 8 0 0 1 1.4.8l1.6-.6 1.3 2.3-1.3 1a7 7 0 0 1-.1 1.6Z" transform="translate(-1 -1) scale(1.08)" /></>}
      {name === 'help' && <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M9.7 9a2.4 2.4 0 1 1 4.4 1.3c-.7 1-2.1 1.3-2.1 2.8M12 17h.01" /></>}
      {name === 'send' && <Path {...common} d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />}
      {name === 'edit' && <><Path {...common} d="M12 20h9" /><Path {...common} d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" /></>}
      {name === 'spark' && <><Path {...common} d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /><Path {...common} d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>}
      {name === 'lock' && <><Rect {...common} x="4" y="10" width="16" height="11" rx="2" /><Path {...common} d="M8 10V7a4 4 0 1 1 8 0v3" /></>}
      {name === 'arrow-right' && <Path {...common} d="M4 12h15M13 6l6 6-6 6" />}
      {name === 'more' && <><Circle fill={color} cx="5" cy="12" r="1" /><Circle fill={color} cx="12" cy="12" r="1" /><Circle fill={color} cx="19" cy="12" r="1" /></>}
    </Svg>
  );
}
