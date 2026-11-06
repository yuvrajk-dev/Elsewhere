# UI CSS and Styling Rules

These rules are the single styling baseline for the Elsewhere prototype on iOS, Android, and web preview. The character system is named Elsefolk and voice rooms are Pods. They describe the visual system; the mobile implementation maps these values to React Native `StyleSheet` tokens. Elsefolk illustration colors are managed separately from interface colors. `APP_DESIGN_SPEC.md` is authoritative for which screens and interactions exist; this file is authoritative for their appearance.

## 1. Visual direction

- Bright, welcoming, readable, and familiar for a messaging app.
- Cool near-white canvas, clean white cards, strong ink text, Orbit Violet primary actions, and soft lilac support surfaces.
- Keep the UI calm and let the distinct colorful Elsefolk characters provide character.
- Do not return to the old matte-black/coral/orange UI direction.
- Do not use gradients, Pod photographs, decorative card dots, excessive badges, or ornamental fonts.
- Use standard iOS and Android platform sans-serif fonts. Use familiar messaging-app readability without copying another app's exact styling or branding.

## 2. Interface color tokens

```css
:root {
  color-scheme: light;

  --ui-brand: #6258D9;          /* Orbit Violet: primary buttons and contextual voice control */
  --ui-brand-pressed: #5148C2;  /* pressed/active state */
  --ui-canvas: #F7F8FC;         /* page background */
  --ui-screen: #FCFCFE;         /* fixed navigation and sheet surface */
  --ui-surface: #FFFFFF;        /* cards and rows */
  --ui-field: #F4F3FB;          /* search fields and form controls */
  --ui-lilac: #F0EEFF;          /* quiet selected/action surfaces */

  --ui-text: #25243A;           /* primary text */
  --ui-text-muted: #73748A;     /* secondary text */
  --ui-icon-muted: #85869C;     /* inactive navigation and utility icons */
  --ui-border: #E7E8F0;         /* dividers, outlines, control borders */
  --ui-on-brand: #FFFFFF;       /* text/icons on Orbit Violet */

  --ui-online: #268A78;         /* connection/presence only; do not use as a brand fill */
  --ui-danger: #C84E5A;         /* report/destructive action text */
}
```

Sea Glass, Citrus, Open Sky, and Apricot belong to the Elsefolk illustration system. Do not use those illustration colors as recurring interface tokens, CTA fills, navigation backgrounds, or Pod-card decoration. Use the semantic online/danger colors only for the statuses/actions named above.

## 3. Typography

```css
:root {
  --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --text-screen-title: 28px;
  --text-room-title: 16px;
  --text-section: 16px;
  --text-body: 14px;
  --text-secondary: 13px;
  --text-caption: 12px;
}

body {
  font-family: var(--font-ui);
  color: var(--ui-text);
  font-size: var(--text-body);
  line-height: 1.45;
}
```

- Prefer regular weight for helper text and medium/semibold for names, section titles, counts, and CTA labels. Use bold only for screen titles and high-priority labels.
- iOS uses the system sans (SF). Android uses its system sans (Roboto). Do not bundle a decorative display face.
- Keep normal body copy at 14–16 px and captions at 12 px or larger. Do not shrink important labels to force a one-line layout; wrap or let the row grow.
- Honor system text scaling where practical.

## 4. Spacing, dimensions, and shape

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --screen-gutter: 20px;
  --screen-gutter-compact: 16px;
  --radius-control: 12px;
  --radius-card: 16px;
  --radius-sheet: 24px;
  --radius-pill: 999px;
}
```

- Use a 4 px base spacing scale. Use 20 px screen gutters on standard phones and 16 px on very narrow phones.
- Room, friend, and message cards use 16–20 px interior padding. Keep primary list rows full width within the page gutter.
- Use 12–16 px between related controls and 24–32 px between major sections.
- Use 1 px quiet borders instead of heavy shadows. Cards should read as separate surfaces without looking stacked or raised excessively.
- Allow text columns to shrink (`min-width: 0`) and wrap. Scroll vertically rather than clipping content.

## 5. Headers, forms, and buttons

### Headers

- Screen headers align title/subtitle on the leading edge and one useful action/avatar on the trailing edge.
- Use 28 px screen-title text with tight line-height. Subtitle sits 3–6 px below the title.
- Keep headers compact; do not add compose/edit actions to Chats.

### Search and input fields

```css
.search-field,
.input {
  min-height: 48px;
  padding-inline: 14px;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-control);
  background: var(--ui-field);
  color: var(--ui-text);
  font: 400 var(--text-body) / 1.4 var(--font-ui);
}

.search-field:focus-within,
.input:focus-visible {
  outline: 3px solid rgb(98 88 217 / 28%);
  outline-offset: 2px;
}

.search-field--compact {
  min-height: 40px;
  padding-inline: 10px;
  margin-bottom: 14px;
}
```

- Pod-code search uses a numeric keyboard and accepts exactly four digits.
- The search container owns the field border and fill. Keep the nested text input transparent and borderless so it does not render a second box over the container.
- The Pod-code sheet uses one standalone 44 px/dp numeric input that owns its border and fill. Do not nest it inside another search-field wrapper or put a second magnifier inside the field.
- On Pods discovery, keep Pod-code search as a compact 44 × 44 px/dp magnifier action beside the profile character. Open the input in a bottom sheet; use the 40 px/dp compact field and do not keep a full-width search field above the Pod list.
- On Chats and Friends, keep their search inputs on one line near the top of the screen, 40 px/dp high. Tapping the magnifier focuses the field. Do not put those text searches behind a header icon or bottom sheet.
- Keep placeholder text readable and distinct from entered text.
- Multiline bio/description inputs grow vertically and do not clip typed text.

### Buttons

```css
.button-primary {
  min-width: 44px;
  min-height: 44px;
  padding-inline: 16px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--ui-brand);
  color: var(--ui-on-brand);
  font: 600 var(--text-body) / 1.2 var(--font-ui);
}

.button-primary:active {
  background: var(--ui-brand-pressed);
}

.button-secondary {
  min-height: 44px;
  padding-inline: 14px;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-control);
  background: var(--ui-surface);
  color: var(--ui-text);
}

.section-heading {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.button-shuffle {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding-inline: 12px;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-control);
  background: var(--ui-surface);
  color: var(--ui-brand);
  font: 600 var(--text-secondary) / 1.2 var(--font-ui);
}

.button-primary:focus-visible,
.button-secondary:focus-visible,
.button-shuffle:focus-visible {
  outline: 3px solid rgb(98 88 217 / 28%);
  outline-offset: 2px;
}

.button-shuffle:active {
  background: var(--ui-lilac);
}

.button-shuffle:disabled {
  color: var(--ui-icon-muted);
  opacity: 0.65;
}
```

- Every interactive target is at least 44 × 44 px/dp. Icon buttons still need a 44 px hit area even if the icon drawing is smaller.
- Primary actions use Orbit Violet. Secondary actions use white with a soft border or a quiet lilac surface.
- Use concise verbs: **Join Pod**, **Start a new Pod**, **Add friend**, **Send request**, **Invite**, **Leave Pod**, **Report**.
- The in-Pod **Shuffle** control is a compact secondary button with a shuffle icon and visible label. Place it opposite the **People** heading, only inside an active Pod. Keep its hit area at least 44 × 44 px/dp.
- Disabled controls must remain legible. Show disabled/sent state with text and state styling, not color alone.

## 6. Cards and list rows

```css
.card {
  padding: 16px;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-card);
  background: var(--ui-surface);
}

.list-row {
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--ui-border);
}
```

- One Pod card per row; it fills the available content width.
- Pod card hierarchy: title and short description on top; Elsefolk character stack and participant count at bottom leading; real Join Pod button trailing.
- Pod previews use up to three 42 dp Elsefolk characters in a horizontal, non-overlapping row. Add `+N` when more participants are not shown. Never print usernames under these preview characters.
- Do not put Pod codes, capacity ratios, Pod-type tags, category tabs, decorative dots, thumbnails, or LIVE labels on Pod cards.
- Friend list rows keep character/name left and a Chat action right. Put a received-requests icon beside **Add friend** in the Friends header; show a small count badge only when requests are waiting and open the shared bottom sheet on tap. Keep request rows out of the Friends list. Show the **Active now** strip only when at least one friend is currently in a Pod; omit the whole section when there are none. Use compact one-line cards with Elsefolk character, name, and Pod-code digits, scrolling horizontally with card-start snapping.
- Chat rows use a 48–56 px avatar, name/message/time hierarchy, optional unread count, and quiet divider.
- In an open chat, let the message list take the flexible height and keep the composer anchored along the bottom edge above the safe area and keyboard.

## 7. Avatar artwork rules

- Avatars are a separate illustration layer, not UI iconography or color tokens.
- Use original, faceless, minimal Elsefolk characters: no eyes, noses, or realistic facial detail. Their small signature marks are customizable mouths.
- Keep 20 initial SVG outer shapes and 20 mouth marks. Each Elsefolk should have a recognizable silhouette, mouth, and personal color. Do not rely on color alone to tell people apart.
- Keep each Elsefolk's outer shape and mouth stable across all screens. Accessories/palette variants must not erase recognition.
- Pod-preview Elsefolk should be larger than characters in dense friend/chat rows.
- Add a simple visible Free/Premium distinction in the picker only. No coin system or price tags until those are decided.

## 8. Bottom navigation and contextual Pod control

```css
.bottom-nav {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  min-height: 64px;
  display: grid;
  grid-template-columns: repeat(5, minmax(44px, 1fr));
  align-items: center;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--ui-border);
  background: var(--ui-screen);
}

.bottom-nav__active-room-control {
  width: 56px;
  height: 56px;
  justify-self: center;
  border: 0;
  border-radius: 50%;
  background: var(--ui-brand);
  color: var(--ui-on-brand);
}
```

- Lay out Chats, Friends, Pods, Invites, and Profile in five balanced slots. Keep the center Pods slot as a raised 54–58 px Orbit Violet circle with no caption in every state.
- Put Pod-code search in the Pods screen header. When Pods is selected, the purple center plus starts a fresh system-named Pod every time, without a title or description form.
- Keep icons simple line icons with consistent stroke weight. Active destination uses Orbit Violet; inactive icons use muted gray-violet.
- With no active Pod, show the voice glyph on other tabs and open Pods discovery on tap. While Pods is selected, show a plus glyph and immediately start a fresh Pod, even when other Pods exist. When the new Pod starts, switch directly to the muted mic glyph and keep it during route navigation; do not flash the doorway icon. When a Pod is active and the user visits another tab, show a doorway with inward arrow and return to the Pod; inside the Pod, show the mic toggle. Keep the circle's shape, size, color, and placement unchanged; only the icon and action change.
- Include iOS bottom safe-area and Android navigation insets; never place navigation behind the home indicator or system bar.

## 9. Pod-only visual rules

- Pod screen has **People** as its main section, compact participant rows, and Leave Pod at the top right.
- A small Invite action may sit beside Leave. The Pod code is shown only inside the invite/share sheet, not persistently in the Pod.
- Do not show Pod title, code, `5/5`, Pod-type tags, text chat, or a muted caption under the mic.
- Keep speaking/listening/muted labels legible but visually quiet. Participant action sheet is compact and scroll-safe.

## 10. Responsive behavior, accessibility, and motion

- Design narrow-first; cards fill the body width between gutters and text can wrap.
- Use iOS/Android safe areas. In CSS previews, use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`; in React Native, use a safe-area provider/insets.
- Maintain strong contrast on text, icon, and button states. Preserve a clear visual focus indicator for keyboard/accessibility navigation.
- Provide accessibility labels for icon-only actions, especially the active-Pod return and microphone controls. Their labels change with the contextual action.
- Respect reduced-motion preferences. Do not require animation to understand connection, mute, join, or selected-tab state.

```css
@media (max-width: 360px) {
  .screen { padding-inline: var(--screen-gutter-compact); }
  .room-card__description,
  .chat-row__message { min-width: 0; overflow-wrap: anywhere; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 11. React Native mapping

The app ships as iOS and Android native screens and an Expo web preview, so CSS measurements map to React Native density-independent units (dp). Keep the same tokens in a TypeScript theme object. Use `StyleSheet.create` for layout and theme styles, `SafeAreaProvider`/insets for system edges, and `Pressable` with `accessibilityRole`, `accessibilityLabel`, and pressed/disabled states for controls. CSS snippets in this document are the design contract; the React Native component implementation is the platform rendering of those rules.

### Current prototype measurements

- Center the app surface in the viewport and cap its width at 520 dp. Use the canvas color outside the screen surface; screen content and the tab bar use the screen color.
- Standard page gutters are 20 dp. Shared page content also has a 520 dp maximum width.
- The tab bar has a 66 dp minimum height, 8 dp horizontal padding, 4 dp top padding, and bottom padding of `max(safe-area inset, 8 dp)`. It hides while the keyboard is open.
- Standard tab items are 50 dp high with a 22 dp icon, 12 dp caption, and 3 dp icon/label gap.
- Keep the center action slot 58 dp high and shifted upward 14 dp. Its raised purple control is 56 × 56 dp with a 28 dp radius and subtle shadow. Never add a caption below it.
- The center action's icon/action states are specified in `APP_DESIGN_SPEC.md`; do not replace the circle with a standard Pods icon/label layout.
- Shared card radii are 16 dp; the app frame uses `maxWidth: 520`; minimum button/touch height is 44 dp. Use the exact tokens in the color and spacing tables above and in `mobile/src/constants/theme.ts`.

CSS snippets are the complete cross-project visual contract. The optional HTML reference is not needed to reproduce current screens. In this design-handoff folder, the theme file is at `../mobile/src/constants/theme.ts`.
