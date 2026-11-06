# Product Decision History

This file records product and technical decisions made during planning. Confirmed decisions are separated from proposals and open questions so recommendations are not mistaken for approval. Update this file when a decision changes.

## 2026-11-05 — Elsewhere brand names

### Confirmed direction

- Name the app **Elsewhere**.
- Call the customizable character avatars **Elsefolk**.
- Call voice rooms **Pods**.
- Use plain product language in the interface, including **Find a Pod**, **Drop into a Pod**, and **Join Pod**. Keep “voice” for the audio feature and the existing preview status.
- Use the onboarding tagline **A little Elsewhere to be yourself.**
- The visible fifth tab is now labeled **Pods**; existing Expo routes and service identifiers can continue using their internal `voice` and `room` names.

## 2026-11-06 — Neon backend services

### Confirmed direction

- Link workspace project `broad-dust-11626722` in organization `org-young-leaf-36801860` to branch `production`.
- Set up Neon Postgres, Managed Better Auth, a private Object Storage bucket for chat photos, Neon Functions for the TypeScript application API, and Neon Realtime for live chat updates.
- The deployed Function URL confirms AWS Asia Pacific 1 (Singapore), region `ap-southeast-1`.
- Keep Neon database and object-storage credentials on the server. The mobile app receives only public Auth, Function, and Realtime URLs.

### Implementation state and open questions

- Workspace `neon.ts` and client adapters have been deployed to the linked `production` branch. Neon CLI authentication was completed after an earlier timeout; environment variables were generated locally and the live service flows have been verified. The Function URL confirms the project's region is `ap-southeast-1` (AWS Asia Pacific 1, Singapore).
- Email/password is the first wired Neon Auth flow. The broader account and recovery approach remains open; do not treat email/password as a final product restriction.
- Chat uploads use the private `assets` bucket and signed read URLs. LiveKit audio is not part of this Neon setup and remains unimplemented.

## 2026-11-05 — Customizable avatar construction

### Confirmed direction

- Keep the established minimal character style and allow users to customize three independent parts: one of 20 outer shapes, one of 20 colors, and one of 20 mouths.
- Show a live preview while customizing in onboarding and Edit profile. Persist the selected shape, color, and mark with the pseudonymous profile, and render the same combination everywhere.
- For existing local profiles and mock fixtures, treat legacy `avatarId` as the fallback for both shape and mark until explicit customization values are present.

## 2026-11-05 — Public profile identity

### Confirmed direction

- A public Elsewhere profile has four distinct parts: a flexible **Display name**, a unique **@username**, an optional **Short bio**, and a customizable **Elsefolk** character.
- The display name is what people see most prominently and does not need to be unique. The username is the findable handle and must be unique; it can be changed with availability validation.
- Keep real names and account credentials separate from this public profile. Ordinary onboarding remains pseudonym-first.
- The local prototype checks username availability against its known mock users. Global uniqueness and reservation belong to the production API; do not imply the local check guarantees global uniqueness.

## 2026-11-04 — Authentication and account safety

### Confirmed direction

- The app should support a login or sign-up system so users can return to their account across sessions and devices. The specific authentication method is not yet selected.
- Keep the public profile pseudonymous. Login credentials and identity-provider details must not appear to other users.
- Do not use a phone's IMEI as the account-ban mechanism. IMEI access is not a reliable cross-platform app capability and could block a future owner of a resold device.
- Account bans and moderation decisions should be enforced by the server, with report/block tools as part of the safety approach.

### Proposals discussed, not finalized

- Start with email and password, with Google sign-in as an optional convenience.
- Defer phone-number sign-in initially because SMS verification can add cost and operational setup.
- Consider rate limits and platform-supported app/device attestation as additional abuse signals if ban evasion becomes a concern. These are not guarantees of identity and are not selected for implementation yet.

### Open questions

- Which sign-in methods will the first release support: email/password, Google, phone, or a combination?
- What account recovery flow should be supported?
- Should phone verification or app attestation be introduced later, and under what abuse threshold?
- What moderation review and appeal process should accompany account bans?

## 2026-11-04 — Return-to-room control

- Keep the center control's microphone states unchanged inside a room.
- On other tabs while connected, replace the generic back arrow with a doorway and inward arrow so the action reads as returning to the room rather than general navigation.

## 2026-11-04 — Persistent navigation across voice screens

- Keep the bottom navigation mounted across Chats, Friends, Invites, Profile, Voice discovery, and the active-room screen.
- Place the active-room route inside the tab navigator and switch to it in place, avoiding a separate bottom-up page transition and duplicate navigation bar.

## 2026-11-05 — Voice is the fifth tab

- The bottom navigation has five regular destinations in this order: Chats, Friends, Voice, Invites, Profile.
- Initial behavior with no active room was to open Voice discovery; Create room was launched from the Voice screen. This was superseded on 2026-11-05 by the later center-action decision: the center opens Create room when Voice is selected.
- With an active room, the center slot is contextual: it returns to the room from another tab and toggles the microphone inside the room.
- This supersedes the earlier design direction that treated Voice as a center action rather than a tab.

## 2026-11-05 — Keep the center control visually consistent

- Use the same raised purple circular button in the center slot with or without an active room.
- From other tabs with no room active, the Voice glyph opens Voice discovery. With a room active, the icon and action change to return to the room or toggle the microphone, while the button's shape, size, color, and placement stay the same.
- Do not show a label below the center button; its accessibility label describes the current action.

## 2026-11-05 — Voice center action and room-entry state

- When Voice is selected and no room is active, the purple center button opens the Create room sheet. From other tabs, it opens Voice discovery. Keep room-code search in the Voice header.
- When a join or create operation succeeds, show the muted microphone state immediately and keep it through navigation into the room. Do not flash the return-to-room icon between the Voice glyph and microphone.
- Keep the center button's circular purple design unchanged in every state.

## 2026-11-06 — Backend room membership invariant

- The current client tracks a single active Pod. Enforce at most one active Pod membership per account in PostgreSQL; joining a different Pod while active returns a conflict.
- Make Shuffle release the current seat and reserve the next seat in the same transaction. Pod row locks enforce capacity and a per-user profile lock serializes concurrent joins.
- The former owner-handoff rule is superseded by the ownerless Pod decision below. Keep the one-active-Pod invariant, capacity enforcement, and transactional Shuffle.
- This is an implemented backend invariant. It does not complete the planned block flow, moderation operations, or LiveKit integration; those remain future work.

## 2026-11-06 — Ownerless, one-tap Pods

### Confirmed direction

- There is no Pod creator or owner role and no user-entered title or description step.
- Tapping the purple plus while on Pods always starts a fresh temporary Pod and enters it, even when other Pods already exist. If the account has a stale active membership, move it into the new Pod and apply the usual empty-Pod cleanup to the old one.
- Keep three defaults available in discovery even when empty: **Easy Hellos**, **Little Things**, and **Music & Moments**. Use a pool of 24 generic name/description pairs for automatically started temporary Pods.
- Delete temporary Pods as soon as their last participant leaves. Keep default Pods when they are empty. Every Pod remains limited to five people and users can be active in only one Pod at a time.
- Pod-code search and explicit **Join Pod** cards remain available in discovery; the central plus asks for no title or description.
- This supersedes the 2026-11-05 center-action decision to open a Create Pod sheet while Pods is selected.

## 2026-11-06 — Friends requests and active Pods

### Confirmed direction

- Show received friend requests in a bottom sheet opened by a header icon. Keep requests out of the default Friends list; keep Accept and Decline in the sheet.
- Show the **Active now** section only for friends currently in a Pod. Hide the whole section when no friends have an active Pod. Refresh friend Pod status when the Friends tab comes into focus.

## Existing confirmed project direction

These decisions are also captured in `PROJECT_BRIEF.md` and are repeated here for a useful history entry point:

- Build the client with React Native, Expo, and TypeScript.
- Build the backend as a TypeScript modular monolith; use PostgreSQL hosted by Neon for application data.
- Use LiveKit Cloud as the initial real-time audio transport. The API authorizes room access and issues LiveKit tokens; secrets stay server-side.
- Keep the app pseudonym-first, without requiring a real name, phone number, camera, or contacts for ordinary onboarding.
- Use service interfaces and local mocks while building the frontend, then replace adapters with API-backed services.
