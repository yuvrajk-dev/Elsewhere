# Elsewhere — Mobile UI Design Specification

## Document purpose

This is the UI source of truth for reproducing the current iOS, Android, and web preview. It records the implemented routes, screen copy, interactions, mock fixtures, and visual rules. Product ideas that are not implemented are marked as future direction.

The working brand is **Elsewhere** for the app, **Elsefolk** for its customizable character avatars, and **Pods** for voice rooms. The onboarding tagline is **A little Elsewhere to be yourself.** This spec describes the bright, welcoming design and supersedes the old black, orange, coral, and competitor-inspired mockups. Use familiar messaging conventions for clarity, but do not copy another app's exact screen composition, icons, or branding.

## Current prototype boundary

The UI still has local preview behavior when Neon service URLs are absent. When they are present, sign-in uses Neon Auth; profiles, chats, friends, Pods, invites, and reports use the Neon Function API; chat photos use private Object Storage; and chat messages subscribe through Neon Realtime. Neon services are deployed on the production branch and the implemented flows have passed live end-to-end checks. Paid Premium access and LiveKit audio are not implemented. Menu actions marked “coming soon” remain placeholders.

The first launch is the Welcome screen at `/` in local preview mode. With Neon configured, users first sign in or create an account at `/sign-in`, then create their pseudonymous public profile at `/`. A saved profile routes to Pods discovery. The five tab destinations are **Chats**, **Friends**, **Pods**, **Invites**, and **Profile**. The active-Pod route is nested in the tab navigator but hidden as a tab item; a private chat thread is pushed above the tab shell and has its own back control.

| Expo Router route | Screen | Navigation behavior |
| --- | --- | --- |
| `/sign-in` | Sign in / create account | Shown before onboarding when Neon is configured and the user has no session. Email credentials are private account data. |
| `/` | Welcome/onboarding | Saved profiles replace this route with `/(tabs)/voice`. |
| `/(tabs)/chats` | Chats list | One of five persistent tab destinations. |
| `/(tabs)/friends` | Friends | One of five persistent tab destinations. |
| `/(tabs)/voice` | Pods discovery | One of five persistent tab destinations. |
| `/(tabs)/room` | Active Pod | Inside the tab navigator, hidden from the visible tab items; tab bar remains mounted. |
| `/(tabs)/invites` | Invites | One of five persistent tab destinations. |
| `/(tabs)/profile` | Profile | One of five persistent tab destinations. |
| `/chat/[id]` | Private chat thread | Pushed above the tab navigator with a right-to-left transition; its own Back control returns to the previous route. |

Switching among visible tabs and the active-Pod route changes the screen in place. The visible tab order is Chats, Friends, Pods, Invites, Profile; the hidden active-Pod route's registration position does not change this order.

## Product in one sentence

An identity-light social app where people choose a public display name and unique @username, discover small voice Pods, talk with friends, send private messages, and create a recognizable Elsefolk character. Real names are not required.

## Product principles

- No real name or camera is required to get started.
- Neon sign-in uses an email and password for account access; neither is part of the public Elsewhere profile. The public onboarding remains pseudonym-first.
- A user chooses a public display name and unique @username, can add an optional bio, and customizes an Elsefolk character from 20 outer shapes, 20 colors, and 20 mouth marks; the same identity remains consistent across Chats, Friends, Pods, and Profile.
- A Pod normally supports up to five people. Pods have no owner. Three generic default Pods stay available when empty; temporary Pods are system-named and deleted when their last participant leaves. The API applies the five-person capacity check. Premium access to full Pods is not implemented; the precise seat policy remains a product decision (see **Open product decisions**).
- Pod discovery uses a unique four-digit code. Codes are searchable and shareable, but are not a security credential.
- The prototype enters Pods with the mic UI muted and does not request permission or send audio. In production, request OS microphone permission only when a user chooses to unmute.
- A Pod-only encounter does not create a chat thread. A thread appears only after someone sends or receives a message.
- Pods discovery is the fifth destination. Its center slot always uses the raised purple circular control: it opens Pods discovery from other tabs, immediately drops the user into a Pod while Pods is selected, and shows the Pod return or microphone action during Pod entry and while connected.

## Information architecture

The bottom bar has five destinations in this order: **Chats**, **Friends**, **Pods**, **Invites**, **Profile**. The center slot is always the same raised purple circular control. With no Pod active it opens Pods discovery from other tabs and starts a fresh Pod while Pods is selected. With an active Pod it returns to that Pod from other tabs or toggles the microphone during Pod entry and inside the Pod. Only its icon and action change.

| Destination | Main purpose |
| --- | --- |
| Chats | One-to-one text conversations with people the user has messaged or who have messaged them. |
| Friends | Friend search, friends list, active Pod friends, and starting a chat. Received friend requests open in a sheet from the header. |
| Pods | Browse always-available Pods, start a fresh Pod, and exact-code search. |
| Invites | Incoming Pod invitations from friends. Friend requests are separate and open from Friends. |
| Profile | User identity, Elsefolk editing, Premium, privacy, and settings. |
| Pods discovery | Search by four-digit code, browse Pod previews, and create a Pod. Open from the Pods tab. |
| Open Pod | Listen or speak in a Pod, view its participants, invite friends, or leave. |

### First launch

1. Show **A little Elsewhere to be yourself.** and the helper **Meet Elsefolk in small voice Pods. Choose a display name and start with your mic off.**
2. Collect **Display name** (2–24 characters after trimming) and **Username** (3–18 lowercase letters, numbers, or underscores; show it publicly with `@`). Suggest a username from the display name until the user edits it. The display name may be shared by other people; the username must be unique. The local prototype checks against known mock users only, so production must validate and reserve usernames through the API. The Elsefolk customizer starts with shape 4, its original palette color, and mouth 4. Users can select any of the 20 outer shapes, 20 palette colors, and 20 mouth marks independently. Show **No real name, phone, camera, or contacts needed to continue.**
3. **Continue** stores the local profile and opens Pods discovery. Reject a username already used by a known mock user and let the user change it.
4. A returning user with a saved profile opens Pods discovery, not the last-used tab. No microphone permission is requested in this prototype.

## Global layout and navigation

- Keep the bottom navigation mounted when switching among Chats, Friends, Invites, Profile, Pods discovery, and the active-Pod screen. These screens share the app shell; changing between them should not present a separate sliding page.

- Design for a narrow phone first, then let content grow on larger iPhones and Android devices. The body scrolls vertically; the bottom navigation remains fixed above the system safe area.
- Respect the top status-bar inset and bottom home/navigation inset on both platforms.
- On wide viewports, center the app surface at a maximum width of 520 dp; on phones, let it fill the available width. Use `#F7F8FC` outside the surface and `#FCFCFE` for the screen.
- Use a consistent screen header: title and optional one-line helper on the left; a small avatar or one clear utility action on the right.
- Use 20 dp horizontal page gutters on standard phones and reduce to 16 dp on very narrow phones. Do not let cards touch the screen edges.
- Keep 24–32 dp between major sections, 12–16 dp between related controls, and 16–20 dp of padding inside cards.
- Keep every tap target at least 44 × 44 dp. Leave visible separation between adjacent actions.
- Use platform-native sans-serif typography with a familiar, readable messaging-app hierarchy. This means clear and conversational type; it does not mean copying WhatsApp's visual branding or exact layout.
- Keep the screen light, vivid, and welcoming: cool near-white canvas, white cards, ink text, Orbit Violet actions, and original colorful Elsefolk characters. Avoid the old matte-black/coral mockup direction.

### Pods destination and persistent center control

The Pods destination occupies the center position and always uses the same raised purple circular button. It is 56 dp in diameter, raised 14 dp above the bar, and has a subtle purple shadow. Do not change its shape, size, color, or placement between states; change only its icon and action.

The other four destinations use a 22 dp line icon above a small label. Active icons/labels use Orbit Violet; inactive ones use muted gray-violet. When a profile exists, show its 23 dp avatar in the Profile slot instead of the generic profile glyph. The center control has no visible caption.

| Current state | Button appearance | Tap result |
| --- | --- | --- |
| Another tab, no Pod active | Raised purple circle with voice glyph | Opens Pods discovery. |
| Pods selected, no Pod active | Same purple circle with plus glyph | Starts a fresh system-named Pod and opens it. |
| Another tab while connected to a Pod | Same purple circle with doorway and inward arrow | Brings the user back to the active Pod without disconnecting. |
| Joining a Pod | Same purple circle with a slashed microphone | Show the muted mic state immediately and keep it through route navigation; do not flash the return icon. |
| Inside an active Pod, microphone muted | Same purple circle with a microphone and slash | In the prototype, change mic UI state only. In production, request permission here, then enable the microphone. |
| Inside an active Pod, microphone on | Same purple circle with a clear microphone | Turn the mic UI state off; production stops microphone publishing. |

When a new Pod starts or a join succeeds, the center control changes directly to the muted microphone and retains that icon while the active-Pod route opens. Do not flash the doorway/return icon during this transition.

Use the current action as the accessibility label: **Pods**, **Start a new Pod**, **Return to Pod**, **Turn microphone on**, or **Turn microphone off**.

Pod-code search stays in the Pods screen header. When Pods is selected, the center button starts a fresh system-named Pod without asking for a name or description, regardless of how many other Pods exist.

Do not print a caption below the center button. The icon and accessibility label communicate the current action. Browsing Pods discovery never transmits audio. Switching to another tab does not leave the Pod or stop playback.

## Screen specifications

### 1. Pods discovery

**Purpose:** Browse open Pods or locate a Pod by its four-digit code.

**Layout from top to bottom:**

1. Safe-area header: **Pods** and **Find a Pod that feels right.** Place a compact Pod-search icon and the user's avatar at the upper right. The search icon opens the **Find a Pod** sheet; the avatar opens Profile. There is no Create icon in this header.
2. Section heading: **Open Pods**. Keep the list one column, one full-width Pod card per row. Shuffle is available only after entering a Pod.
3. Optional short privacy/small-Pod helper below the list, not inside every card.
4. Persistent bottom navigation.

The helper copy is **Small Pods make it easier for everyone to be heard.** The three persistent default Pods remain in the list even at zero participants, so discovery does not show an empty state.

**Pod preview card:**

- Top: a short Pod title, then a plain-language description of the conversation.
- Bottom: up to three 42 dp Elsefolk characters in a horizontal, non-overlapping row, then `+N` for people not shown; next to them show the total participant count.
- If a default Pod has no participants, show **Be the first to join** in the count area instead of a zero count. Do not add fake participant avatars.
- Put a visible **Join Pod** button on the right. Join Pod is an actual button with a pressed state, never text styled as an action. A simple chevron may accompany the action if it improves the tap affordance.
- Do not show participant usernames under preview avatars. The avatars are the social signal; keep them large enough to recognize.
- Do not show the Pod code, a `5/5` ratio, Pod-type/category tags, “After Hours” labels, decorative dots, Pod images, or a `LIVE` label.
- Current mock Pods are not Premium-gated. If a fixture is marked full without `premiumRequired`, show a disabled **Full** button. A full fixture with `premiumRequired` shows **Premium can join** and routes to the existing **Premium details will be available soon** toast; do not imply that Premium purchase or access works.

**Search states:**

- Tap the header search icon to open the **Find a Pod** sheet with a numeric four-digit input, placeholder **4-digit Pod code**, and description **Enter the four-digit code to find a Pod.**
- Empty input: prompt for the code.
- One to three digits: show “Enter all four digits to find a Pod.” Do not show partial matches.
- Four digit match: show only the exact matching Pod and its Join action in the sheet.
- Four-digit miss: show **No Pod found** and a way to clear the code.
- While lookup is pending, show **Looking for that Pod…**. Do not show partial-code results.

**Starting a Pod:**

- There is no user-facing create form and Pods have no creator or owner. The center **plus** action always starts a fresh temporary Pod and opens it, even when other Pods already exist.
- Pick a system-managed title and description from a pool of 24 generic pairs. The three persistent defaults—**Easy Hellos**, **Little Things**, and **Music & Moments**—remain in discovery but are not used by the plus action.
- The three default Pods always remain in discovery, including when their participant count is zero. Temporary Pods are deleted as soon as their last member leaves. All Pods hold up to five people and use server-generated four-digit codes.

### 2. Open voice Pod

**Purpose:** Listen and speak in a compact Pod without clutter or oversized profile circles.

**Layout from top to bottom:**

1. Top row: muted connection dot and **Voice preview** at left; **Invite** and **Leave Pod** actions at the right. Leave is visible at the top.
2. Section heading **People · N** with the current participant count and a secondary **Shuffle** button on the trailing edge. Shuffle appears only inside an active Pod. Never show a capacity fraction such as `5/5`.
3. Compact participant list. Each row has a 42 dp Elsefolk character, pseudonym, optional **You** marker, speaking/listening/muted status, and a subtle chevron. Speaking is green; other statuses are muted gray. A local mute displays **Muted for you**.
4. When muted, show **Live audio is not connected; your mic stays off.** When unmuted, show **Mic state is simulated here; no audio is being sent.** These lines disclose preview behavior.
5. The persistent bottom navigation, with the center control now the user's mic toggle.

**Strict exclusions in the Pod:** no Pod name, no Pod code, no capacity fraction, no Pod-type/category tags, no text-chat button or text chat area, and no “Muted” caption under the center mic.

If the hidden active-Pod route is opened without an active Pod, show **No Pod is open** / **Join a Pod to see its participants here.** and a **Browse Pods** button that returns to Pods.

**Shuffle behavior:**

- Show a compact secondary **Shuffle** button beside the **People** heading inside an active Pod. Do not show Shuffle in Pods discovery.
- On tap, choose a random different Pod with a free seat from the local fixtures. Show **Finding a Pod…** in the button and disable it to prevent repeated taps.
- The prototype checks capacity and whether another local Pod exists. Premium, safety, block, and server authorization rules are future backend requirements.
- On failure or when no eligible Pods exist, stay in the current Pod and show a brief explanation.
- Enter the new Pod with the user's microphone muted. Shuffle never turns the mic on.
- In the current preview, success shows **Joined another Pod · mic off**; no result shows **No other Pods are available right now**; errors show **Could not find another Pod. You stayed here.**

**Participant actions:** Tapping someone else's row opens **About this person** with description **Pod participant**, Elsefolk character, display name, @username, and a two-line bio (or **No bio yet.**). Actions are **Read full bio**/**Show less**, **Mute this person**/**Unmute for you**, and **Report**. Local mute affects only the current listener. Report opens **Report this person?** with **Choose a reason so the report can be reviewed.** and options **Harassment**, **Inappropriate behavior**, and **Something else**; selecting a reason submits to a mock adapter and shows **Report submitted**. There is no separate confirmation button.

**Invite action:** Opens **Invite someone**, shows **POD CODE**, the four-digit code, **Share this Pod code with a friend.**, **Share code**, and the friend list with **Invite** actions. Native Share is invoked for sharing; invite delivery is a mock no-op and reports **Invite sent to [name]**. Do not put the code in the Pod header.

**Leave action:** **Leave Pod** opens the **Leave this Pod?** sheet with **If others remain, you can rejoin when a seat is available.**, supporting copy **Your microphone will turn off and you will return to Pods.**, and **Stay**/**Leave Pod** actions. Confirming turns off simulated mic state, releases the membership, and routes to Pods discovery. Delete a temporary Pod when its last member leaves; keep default Pods available while empty. Pods have no owner role. If the user switches to another tab, preserve the local Pod state and show the center return control.

### 3. Chats

**Purpose:** A clear, familiar one-to-one messenger list.

**List layout:** Header **Chats**, subtitle **Your private conversations.**, then the one-line **Search chats** field and the caption **Only conversations with a message appear here.** Filter by display name, username, or latest message as the user types. Each 76 dp row has a 50 dp avatar, name, latest message, time, and optional purple unread count.

- If search finds no rows, show **No conversations found** / **Try another name or message.** If there are no chats and the search is empty, show **Your chats will show up here** / **Start by sending a message to a friend.** Do not add a **Recent** section.
- Do not put an edit/compose icon in the header. Start a chat from the friend's **Chat** action in Friends.
- A room encounter alone does not create a chat row.
- Tapping a row opens a thread with **Back**, the person's avatar/name, a scrollable message list, and a composer pinned above the keyboard and bottom safe area. Outgoing bubbles align right on lilac; incoming bubbles align left on the field surface. Sending the first message to a friend creates a mock chat thread. Sent messages are labeled **Now**.
- The composer includes the existing purple **Send message** action and a plus control labeled **Share a photo**. Selecting a photo uploads it to the private `assets` bucket; photos are limited to 8 MB and render inline in the conversation. If Neon URLs are not configured, photo sending reports that it is unavailable in preview mode.
- With Neon configured, chat message changes update live through Realtime. Without it, the local mock adapter remains in use.
- Keep voice-room text chat out of the room screen. These private chats are a separate feature.

### 4. Friends

**Purpose:** See your friends, find people, check which friends are currently in a Pod, and start private chats. Review received friend requests in a separate sheet.

**Layout from top to bottom:**

1. Header **Friends** with a friend-requests icon button and a compact outlined **Add friend** button. The requests icon opens a bottom sheet and shows a count badge when requests are waiting.
2. Compact, single-line **Search your friends** input at the top of the screen.
3. Show **Active now** only when at least one friend is currently in a Pod. Each active friend occupies a separate 154 dp card with a 36 dp Elsefolk character, name, and Pod-code digits. Show `4821`, not `Pod: 4821`. Tapping a card looks up and joins that Pod when it still exists. If nobody is in a Pod, omit the entire section without placeholder copy.
4. **Your friends** section with one row per person: avatar, name/username, and a clear **Chat** button.

The friend-requests icon opens a bottom sheet matching the Edit profile sheet. It lists received request rows with Accept and Decline actions. When the list is empty, show **No received requests right now.** Friend Pod status is refreshed when the Friends tab comes into focus.

**Add friend flow:** **Add friend** opens **Add a friend** with **Search by display name or @username.** Search accepts display-name or username fragments and shows up to five results. Selecting a result opens its compact profile preview and **Send request**. After sending, switch to disabled **Sent** and show **Request sent to [name]**. Never start a chat until a message exists.

Accepting shows **[name] added to your friends**; declining shows **Request declined**.

If the friend search has no matches, show **No friends found** / **Try another name or username.** The Add friend sheet initially says **Enter a name or username to search.** and a no-match query says **No people found. Try another name.**

### 5. Invites

**Purpose:** Receive Pod invitations from friends. This tab is separate from friend requests.

The header is **Invites** with subtitle **Pod invitations from your friends.** Each card has sender Elsefolk character/name, Pod title, description, **POD CODE** and its digits, and **Join Pod**/**Decline** actions. Joining checks the mock Pod capacity; declining removes the invite from local state. The empty state is **No invites yet** with **When a friend invites you to a Pod, it will appear here.**

### 6. Profile and settings

**Profile screen:** Header **Profile** with a **Settings** action. Show the user's 58 dp Elsefolk character, display name, `@username`, optional two-line bio, and privacy note **Your display name, username, and Elsefolk character are what others see. You never need to share your real name.** Add **Edit profile**, then rows for **Premium**, **Privacy & safety**, **Settings**, and **Help & support**. These rows show **Premium details will be available soon**, **Privacy controls are coming soon**, **Settings are coming soon**, and **Help & support are coming soon** respectively. Only Edit profile is implemented. The footer reads **Elsewhere · Preview**.

**Edit profile:** The **Edit profile** sheet lets the user update **Display name** (2–24 trimmed characters), **Username** (3–18 lowercase letters, numbers, or underscores; unique among known mock users), **Short bio** (max 120), and customize their Elsefolk by choosing its outer shape, color, and mouth independently from 20 options each. Show one live preview above the three horizontal choice rails. **Save changes** updates the local profile and shows **Profile saved**. Display name and username are separate; changing one does not change the other. There are no Premium-locked Elsefolk options or paywalls in the prototype.

**Elsefolk character rules:** 20 original SVG outer shapes and 20 signature mouth marks form a faceless, cute, minimal character system with no eyes, nose, or realistic facial detail. Users customize shape, palette color, and mouth independently. Persist these as `avatarShapeId`, `avatarColor`, and `avatarMarkId` on the pseudonymous profile; legacy `avatarId` maps to the outer shape for existing preview fixtures and saved profiles. Render that exact combination across every screen. Color alone must not distinguish people. Future accessories can be added without changing the selected base shape.

**Settings:** A settings screen/list is not implemented. The Profile header and menu settings actions show **Settings are coming soon**.

## Shared sheets, dialogs, and feedback

- Sheets use the shared transparent modal with dim backdrop, rounded top corners, handle, title/description, close icon, scrollable content, and safe-area bottom padding. Tapping the backdrop or Close dismisses the sheet.
- Use short action labels: **Join Pod**, **Start a new Pod**, **Send request**, **Invite**, **Leave Pod**, **Report**.
- Leave requires confirmation. Report uses immediate reason selection; selecting a reason submits it.
- Current states include loading for chat/shuffle/form submissions, toasts for success and errors, disabled Full/Sent/busy buttons, and empty/no-result states. Production retry, network, safety, eligibility, and Premium handling are not implemented.

## Reproduction fixtures and artwork

Use these fixtures for the initial preview state. Preserve their names, copy, ordering, avatar IDs, Pod codes, and statuses when cloning the current app. A fresh install has no profile until onboarding. The data file also contains a reference profile `SunnySide` / `@sunnytalks`, avatar 4, bio **Here for easy conversation.**; it is not automatically applied to a fresh profile.

### Avatar renderer and palette

Render each avatar in a `48 × 48` viewBox. Select the silhouette from `avatarShapeId` (fallback to legacy `avatarId`) and the mark from `avatarMarkId` (fallback to `avatarId`), each wrapping after 20. Fill the silhouette with the assigned palette color, and draw the mark in white at stroke width `1.8`, round caps/joins, and opacity `0.78`. The SVG background is the same color at 14% opacity; its corner radius is 32% of the displayed size. Default size is 44 dp, with a 2 dp white border when bordered; onboarding and customizer tiles omit the border. The live preview and every app surface must use the same saved shape, color, and mark.

| Avatar ID | Fill color | Avatar ID | Fill color |
| ---: | --- | ---: | --- |
| 1 | `#9B8FEB` | 11 | `#8AAB5E` |
| 2 | `#4BB8AC` | 12 | `#C87568` |
| 3 | `#E98D7F` | 13 | `#6BAF9E` |
| 4 | `#D7A845` | 14 | `#B78A48` |
| 5 | `#7797DB` | 15 | `#8878C5` |
| 6 | `#D778A4` | 16 | `#6490A7` |
| 7 | `#72A96F` | 17 | `#CE7290` |
| 8 | `#D18C59` | 18 | `#9B9A59` |
| 9 | `#6E9BC4` | 19 | `#7085C7` |
| 10 | `#AE7CA9` | 20 | `#B17D5F` |

The following exact paths define the 20 silhouette and signature-mark pairs. Pair paths by row number.

```text
silhouettes:
1  M24 5c-8 0-14 7-14 17 0 8 5 15 14 15s14-7 14-15C38 12 32 5 24 5Z
2  M9 19c0-8 6-14 15-14s15 6 15 14c0 10-6 18-15 18S9 29 9 19Z
3  M24 5c-7 0-12 6-12 14v9c0 6 5 10 12 10s12-4 12-10v-9C36 11 31 5 24 5Z
4  M24 7c-9 0-13 7-13 16 0 8 5 14 13 14s13-6 13-14C37 14 33 7 24 7Z
5  M24 5 37 18v8c0 7-6 11-13 11s-13-4-13-11v-8L24 5Z
6  M11 13c4-7 22-7 26 0v13c0 7-6 11-13 11s-13-4-13-11V13Z
7  M24 5c-9 0-13 8-13 18 0 8 5 14 13 14s13-6 13-14C37 13 33 5 24 5Z
8  M12 18c0-8 5-13 12-13s12 5 12 13v10c0 6-5 10-12 10s-12-4-12-10V18Z
9  M24 5c-6 0-10 4-11 10l-5 4 5 3v7c0 7 5 12 11 12s11-5 11-12v-7l5-3-5-4C34 9 30 5 24 5Z
10 M24 5c-8 0-13 6-13 14v9c0 7 5 11 13 11s13-4 13-11v-9C37 11 32 5 24 5Z
11 M24 6c-7 0-12 5-12 13v11c0 6 5 10 12 10s12-4 12-10V19c0-8-5-13-12-13Z
12 M24 5c-9 0-14 7-14 16 0 9 5 16 14 16s14-7 14-16C38 12 33 5 24 5Z
13 M24 5c-8 0-13 7-13 15v10c0 6 5 10 13 10s13-4 13-10V20c0-8-5-15-13-15Z
14 M24 5c-6 0-10 6-10 14v12c0 6 4 9 10 9s10-3 10-9V19C34 11 30 5 24 5Z
15 M24 6c-10 0-14 7-14 16 0 8 5 14 14 14s14-6 14-14C38 13 34 6 24 6Z
16 M11 18 17 7l7 5 7-5 7 11v10c0 7-6 11-14 11s-13-4-13-11V18Z
17 M24 5c-7 0-12 5-12 13v12c0 6 5 9 12 9s12-3 12-9V18c0-8-5-13-12-13Z
18 M24 5c-8 0-13 6-13 15v10c0 7 5 11 13 11s13-4 13-11V20c0-9-5-15-13-15Z
19 M24 6c-9 0-13 7-13 15v9c0 6 5 10 13 10s13-4 13-10v-9C37 13 33 6 24 6Z
20 M24 5c-7 0-12 5-12 13v11c0 7 5 11 12 11s12-4 12-11V18c0-8-5-13-12-13Z

marks:
1  M24 26v7
2  M16 29h7m2 0h7
3  M24 26l3 3-3 3-3-3 3-3Z
4  M30 26l3 3-3 3-3-3 3-3Z
5  M14 30h5
6  M24 26c3 2 4 3 4 6
7  M18 26l3 3-3 3-3-3 3-3Z
8  M29 28l4 2-4 2-4-2 4-2Z
9  M24 26l4 3-4 3-4-3 4-3Z
10 M16 27l4 2-4 2-4-2 4-2Z
11 M25 26c3 1 5 2 6 4
12 M24 26l-4 5h8l-4-5Z
13 M29 26l-4 5h8l-4-5Z
14 M24 25v7m-3-4h6
15 M24 26l3 3-3 3-3-3 3-3Z
16 M18 27h5m-2-3v7
17 M31 26l-3 5h6l-3-5Z
18 M24 25l2 4-2 4-2-4 2-4Z
19 M17 27c2 1 3 2 3 4
20 M28 26l4 3-4 3-4-3 4-3Z
```

### People fixtures

Avatar colors are resolved through the palette table above. The Friends **Active now** rail uses `activeRoomCode`; generic online status alone does not mean a friend is in a Pod.

| ID | Display name | Username | Avatar | Bio | Online |
| --- | --- | --- | ---: | --- | --- |
| `mira` | Mira | `miramakes` | 2 | Collector of small joys. | Yes |
| `asha` | Asha | `ashareads` | 1 | Books, tea, and long walks. | Yes |
| `ravi` | Ravi | `ravionair` | 3 | Always up for a new playlist. | Yes |
| `sam` | Sam | `samstargazer` | 4 | Looking up, mostly. | No |
| `nia` | Nia | `niadoes` | 6 | Curious about everything. | Yes |
| `leo` | Leo | `leowanders` | 5 | A very casual explorer. | Yes |
| `tara` | Tara | `taratalks` | 12 | Small Pods, good company. | No |
| `milo` | Milo | `milomakes` | 14 | Currently learning to bake. | No |
| `noor` | Noor | `noorandmore` | 9 | Tell me what you are listening to. | Yes |
| `nora` | Nora | `norasees` | 8 | A friend of a friend. | No |
| `jules` | Jules | `julesoutside` | 10 | Usually outside. | No |

### Room, relationship, and chat fixtures

| Room ID | Code | Title | Description | Count / capacity | Participants in order (status) |
| --- | --- | --- | --- | --- | --- |
| `room-open-table` | `4821` | Easy Hellos | A relaxed place to meet someone new and see where the conversation goes. | 3 / 5 | Mira (listening), Asha (speaking), Sam (muted) |
| `room-company` | `1736` | Little Things | Share one good thing, small discovery, or moment from your day. | 4 / 5 | Nia (listening), Leo (speaking), Tara (listening), Ravi (listening) |
| `room-table` | `6042` | Music & Moments | Talk favorite songs, stories, and sounds you keep coming back to. | 4 / 5 | Milo (speaking), Noor (listening), Nora (muted), Jules (listening) |

- Friend requests: Nora (`request-nora`), then Jules (`request-jules`).
- Friends: Mira (active room `4821`), Asha, Ravi (active room `1736`), Sam.
- Invites: Mira invites the user to room `4821`; Ravi invites the user to room `1736`.
- Chats in order: Mira (`chat-mira`, **That sounds good, see you there.**, `2:41`); Asha (`chat-asha`, **I found a Pod we might like.**, `Yesterday`, unread 1); Ravi (`chat-ravi`, **Thanks for the recommendation!**, `Mon`).
- Initial messages: Mira says **Hey, glad we connected!**, then the user says **Me too. How are you?**; Asha says **I found a Pod we might like.**, then the user says **Send me the code and I’ll take a look.**; Ravi has only **Thanks for the recommendation!** from Ravi.
- Room participants/statuses, requests, friends, invites, chats, and messages reset to these fixtures when the app process reloads. New messages are shown as **Now**. The profile persists separately.

### Exact line-icon geometry

Draw icons in a `24 × 24` viewBox with no fill, default stroke width `1.8`, round caps, and round joins. Standard navigation icons render at 22 dp; the center icon renders at 24 dp with stroke width `1.9`. Use these glyphs rather than emoji or a different icon font.

| Name | SVG paths / shapes |
| --- | --- |
| `chats` | `M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-5.5A7.5 7.5 0 1 1 20 11.5Z` |
| `friends` | `Circle(9,8,r=3.2)`; `M3.5 19a5.5 5.5 0 0 1 11 0M16 5a3 3 0 0 1 0 6M17 14a4.5 4.5 0 0 1 3.5 4` |
| `voice` | `M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4` |
| `invites` | `Rect(3,5,18,14,rx=2.5)`; `m4 7 8 6 8-6` |
| `profile` | `Circle(12,8,r=3.5)`; `M4.5 20a7.5 7.5 0 0 1 15 0` |
| `plus` | `M12 5v14M5 12h14` (stroke width 2.1) |
| `search` | `Circle(10.8,10.8,r=6.8)`; `m16 16 4.5 4.5` |
| `back` | `m14.5 18-6-6 6-6M8.5 12h11` |
| `room-enter` | `M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7M12 12h9m-4-4 4 4-4 4` |
| `shuffle` | `m16 3 4 4-4 4M4 7h2c5 0 7 10 12 10h2M16 14l4 3-4 3M4 17h2c2 0 3-2 4-4` |
| `mic-off` | `Rect(9,3,6,12,rx=3)`; `M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6M3 3l18 18` |
| `mic-on` | `Rect(9,3,6,12,rx=3)`; `M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6` |
| `chevron` | `m9 18 6-6-6-6` |
| `close` | `m6 6 12 12M18 6 6 18` |
| `check` | `m5 12 4 4L19 6` |
| `shield` | `M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z`; `m9 12 2 2 4-4` |
| `settings` | `Circle(12,12,r=3)`; `m19.4 15 .1.1 1.3 1-1.3 2.3-1.6-.6a8 8 0 0 1-1.4.8l-.3 1.7h-2.6l-.3-1.7a8 8 0 0 1-1.4-.8l-1.6.6L7 16.1l1.3-1a7 7 0 0 1 0-1.7l-1.3-1 1.3-2.3 1.6.6a8 8 0 0 1 1.4-.8l.3-1.7h2.6l.3 1.7a8 8 0 0 1 1.4.8l1.6-.6 1.3 2.3-1.3 1.3a7 7 0 0 1-.1 1.6Z`, transformed by `translate(-1 -1) scale(1.08)` |
| `help` | `Circle(12,12,r=9)`; `M9.7 9a2.4 2.4 0 1 1 4.4 1.3c-.7 1-2.1 1.3-2.1 2.8M12 17h.01` |
| `send` | `m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13` |
| `edit` | `M12 20h9`; `m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z` |
| `spark` | `m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z`; `m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z` |
| `lock` | `Rect(4,10,16,11,rx=2)`; `M8 10V7a4 4 0 1 1 8 0v3` |
| `arrow-right` | `M4 12h15M13 6l6 6-6 6` |
| `more` | Filled circles at `(5,12)`, `(12,12)`, `(19,12)`, each radius 1 |

## Open product decisions

1. **Premium in a full room:** Normal rooms are limited to five people. Decide whether Premium gets a sixth overflow seat, a reserved fifth seat, or priority/waitlist access. Enforce one policy on the server. Never display `5/5` inside the room.
2. Decide which of the 20 avatars are free vs Premium, and define the purchase/restore experience.
3. Decide whether onboarding interests are part of the first release and how they affect room discovery.
4. Design the Elsewhere app icon and store artwork, and refine Elsefolk character details before store submission. The Expo display name is **Elsewhere**; launcher art remains placeholder art.
