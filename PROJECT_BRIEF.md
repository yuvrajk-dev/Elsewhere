# Elsewhere — Product and Project Brief

This is the working product and implementation brief for **Elsewhere**. It separates the current prototype from the planned production product so another project can reproduce the existing app without mistaking roadmap items for implemented features. The current UI contract is in `design-handoff/APP_DESIGN_SPEC.md`; visual rules are in `design-handoff/UI_CSS_RULES.md`.

## Current implementation status

- `mobile/` contains the React Native / Expo / TypeScript prototype. It can run in web preview and on native development builds.
- Implemented routes: first-launch onboarding; the Chats, Friends, Pods, Invites, and Profile destinations; an active-Pod screen inside the tab navigator; and a private chat thread route.
- Implemented preview flows: edit profile identity and customize an Elsefolk character's outer shape, color, and mouth independently; browse/search/join Pods and start a fresh system-named Pod from the plus button; review received friend requests in a sheet; see active friends only when they are in a Pod; accept/decline Pod invites; send a friend request/private message; invite/share a Pod; choose a report reason; mute a participant locally; Shuffle; and confirm leaving a Pod. Display name, username, bio, and Elsefolk choices persist in the local profile and render consistently throughout the app. Username availability is checked only against local mock users; production must reserve unique usernames server-side. Exact screen copy and states are specified in `design-handoff/APP_DESIGN_SPEC.md`.
- `mobile/src/services/neon-services.ts` provides Neon-backed profile, Pod, friend, invite, chat, and safety adapters. Without the Expo public service URLs, the app keeps using `mock-services.ts`. Neon Auth email sign-in, private chat photo uploads, and Neon Realtime chat subscriptions are wired in the client. The Function API, SQL schema, and migration live in the workspace root. The services are deployed to the requested production branch and the implemented flows have passed live end-to-end checks.
- The Neon Function API owns profile identity and username uniqueness, friend requests, Pod membership/capacity, invites, messages, and reports. Chat images use the private `assets` bucket and short-lived signed URLs. The voice preview remains local and does not connect to LiveKit.
- Pod membership enforces one active Pod per account in PostgreSQL. API joins serialize on the profile row, enforce the five-person capacity while locking the Pod, and Shuffle switches Pods in one transaction. Pods have no owner. Three named default Pods remain available when empty; automatically opened temporary Pods are deleted as soon as their last member leaves. The deployed API remains an initial implementation: block flows, production moderation operations, and LiveKit are not implemented.
- The room screen explicitly labels the connection as **Voice preview**. The mic control changes preview state only and does not request microphone permission or send audio. A real LiveKit integration requires native development builds.
- The center purple control keeps one shape and placement: from another tab it opens Pods discovery when no Pod is active; on Pods it starts a fresh Pod and enters it; during Pod entry and inside a Pod it shows the mic state; from another tab with an active Pod it returns to that Pod.
- The chosen working brand is **Elsewhere** (app), **Elsefolk** (avatar characters), and **Pods** (voice rooms). Expo display name is Elsewhere. Launcher art, final bundle identifiers, account/recovery model, Premium rules, and other items in **Open product decisions** remain undecided or are placeholders.

## Product

A social app called **Elsewhere** for discovering small voice Pods, talking with friends, and sending private messages. Each public profile has a flexible display name, a unique @username, an optional short bio, and an **Elsefolk** character: a distinctive, customizable, minimal avatar. Users do not need to provide a real name or use a camera. Be clear that pseudonymous profiles do not make a user untraceable.

## Planned production technical direction

- **Mobile client:** React Native with Expo and TypeScript; target iOS and Android.
- **Client location:** `mobile/` under this workspace, leaving the workspace root available for the API and shared documentation.
- **Backend:** A TypeScript modular monolith exposed through a Neon Function, with application rules and database access in the API. Keep feature areas in modules within one deployable service; do not start with microservices.
- **Database:** PostgreSQL hosted by Neon. Use Neon Free during development/prototyping, subject to its current quotas. Before production, choose an appropriate paid plan and establish backup and recovery procedures.
- **Voice:** LiveKit Cloud for the first implementation/pilot, using its free plan within current limits. Revisit self-hosting if operating LiveKit ourselves becomes worthwhile.
- **Ownership boundary:** The mobile app calls our API. The API owns application rules and connects to Neon. The app must not contain database credentials or LiveKit API secrets. Our API authorizes room access and issues LiveKit access tokens.

LiveKit carries real-time audio; it is not the source of truth for profiles, friends, room discovery, or chat history. Neon stores application data. Check provider pricing, quotas, regional availability, and backup terms before launch because these can change.

## Backend architecture (API deployed; audio integration pending)

```text
React Native app
    │ HTTPS / realtime app updates
    ▼
Our TypeScript API (modular monolith, Neon Function)
    ├── Accounts and profiles
    ├── Friends and requests
    ├── Room discovery, membership, and invites
    ├── Chats and messages
    └── Safety and moderation
        ├── Neon PostgreSQL
        └── LiveKit Cloud (audio transport)
```

The backend is authoritative for identity, permissions, room capacity, room codes, friendships, invites, moderation, and persisted messages. Use transactions for operations such as joining a room and enforcing capacity. Add a realtime update mechanism for presence and changing room/chat state where needed; persist chat messages in PostgreSQL.

The client depends on service interfaces. Neon-backed adapters are selected when the Expo public service URLs are configured; otherwise the local mock adapters remain available for preview. Keep room business rules in the backend. Keep LiveKit integration behind the existing voice-service boundary in the app.

## Product and navigation rules

- Five bottom destinations, in order: **Chats, Friends, Pods, Invites, Profile**. From other tabs, the center Pods control opens Pod discovery. On Pods, the center plus starts a new Pod regardless of how many Pods already exist; Pod-code search stays in the Pods header.
- Keep the bottom navigation mounted across the main tabs, Pods discovery, and the active-Pod screen. Moving among these destinations should switch the screen in place instead of presenting a separate sliding page.
- Keep the center slot as the same purple circular control in every state. With no active Pod, it opens Pods discovery from other tabs and starts a fresh Pod on Pods; during Pod entry and inside the Pod, show the mic state; in another tab during a Pod, it returns to that Pod.
- In the prototype, a user enters a Pod with the mic state muted; this is UI simulation only. In production, request OS microphone permission only when they choose to unmute and enforce publish permission through backend-issued voice tokens.
- In the prototype, switching tabs preserves local Pod state and the center control returns to the Pod. Production must keep the connection alive. Leaving clears the local mock room and returns to Pods; production must mute, disconnect, and release the seat.
- Room-only encounters do not create chat threads. A chat thread exists only after someone sends or receives a private message.
- Pods normally hold up to five people. Four-digit Pod codes are for discovery/sharing, not security credentials. Generate codes on the server and show them only in search/invite flows, not persistently on Pod cards or the Pod screen.
- Production must apply the same capacity, eligibility, blocking, and safety checks for browsing, code search, invites, and Shuffle. The prototype checks mock capacity, has report-reason choices, and has no block flow. Shuffle changes preview room and never unmutes the user.
- Include confirmation for leaving and useful loading, empty, no-result, disabled, room-full, Premium-required, and network-error states. The prototype implements the states detailed in `design-handoff/APP_DESIGN_SPEC.md`; production retry/network behavior is future work.

## Screen inventory

The screen list below describes the implemented prototype. For exact text, interaction details, overlays, and fixtures, follow `design-handoff/APP_DESIGN_SPEC.md`.

1. **First launch:** Show the Elsewhere wordmark and welcome copy, collect a public display name and unique @username, and let the user customize their Elsefolk character by choosing its outer shape, color, and mouth from 20 options each. The current screen has no interests step. Do not require real name, phone, camera, or contacts. Enter Pods discovery after setup.
2. **Pods discovery:** One-column Pod cards with title, short description, Elsefolk avatars/count, and Join. Three persistent generic Pods keep discovery available even when all are empty. Search by exact four-digit Pod code in a sheet. The center control always opens a fresh temporary Pod using one of 24 generic name and description pairs, even when default Pods or other Pods already exist. Pod names and descriptions are system-managed, and temporary Pods disappear when their last member leaves.
3. **Open Pod:** The **Voice preview** indicator, Invite and Leave at the top; People list with compact Elsefolk rows and Shuffle. No Pod title/code/capacity fraction/text chat in this screen. Participant actions include local mute, bio, and mock report.
4. **Chats:** Searchable one-to-one conversation list with latest message and time. Tapping opens a scrollable message history with a composer pinned above keyboard/safe area. Starting a chat from Friends does not create a thread until a message exists.
5. **Friends:** Search and friends list with Chat action. Show the horizontally scrolling Active now section only when friends are currently in a Pod; otherwise omit it. Open received friend requests from the header icon in a bottom sheet with Accept/Decline. Add friend by username; show a result/profile preview and Sent state after requesting.
6. **Invites:** Incoming Pod invites, separate from friend requests. Show sender, Pod details/code, Join Pod and Decline. The prototype checks local Pod capacity; production must enforce all eligibility rules on the server.
7. **Profile:** Display name, @username, optional short bio, recognizable Elsefolk character, privacy note, Edit profile, Premium, Privacy & safety, Settings, and Help. The profile editor is functional; the Premium, Privacy & safety, Settings, and Help rows currently show “coming soon” preview toasts. Avatar identity stays consistent across the app.

## Visual system

Use the light, welcoming direction from the design handoff: cool near-white canvas, white cards, ink text, Orbit Violet actions, soft lilac surfaces, and original colorful Elsefolk characters. Do not use the earlier black/orange/coral direction, gradients, room photos, decorative dots, or excessive badges.

Map the CSS values to React Native density-independent units (dp) and centralize them in a TypeScript theme. Key tokens:

| Token | Value |
| --- | --- |
| Brand / pressed | `#6258D9` / `#5148C2` |
| Canvas / screen / surface | `#F7F8FC` / `#FCFCFE` / `#FFFFFF` |
| Field / lilac | `#F4F3FB` / `#F0EEFF` |
| Text / muted text / muted icon | `#25243A` / `#73748A` / `#85869C` |
| Border / online / danger | `#E7E8F0` / `#268A78` / `#C84E5A` |
| Screen gutter | 20 dp (16 dp on narrow phones) |
| Common spacing | 4, 8, 12, 16, 20, 24, 32 dp |
| Control/card/sheet radius | 12 / 16 / 24 dp |
| Minimum interactive target | 44 × 44 dp |

Use platform system sans-serif fonts, readable text (body 14–16 dp; captions at least 12 dp), quiet borders, safe-area insets, visible focus/pressed/disabled states, and reduced-motion support. Keep layouts narrow-first, scrollable, and accessible. Build 20 original faceless Elsefolk outer shapes with distinct silhouettes and signature mouths; color alone must not distinguish users.

## Production implementation sequence

1. **Prototype complete:** Expo/React Native TypeScript foundation, navigation, theme tokens, safe areas, shared UI, screens, and local mock flows are implemented.
2. **Initial backend deployed and verified:** The Function API and adapters cover profiles, friends, Pods, invites, messages, chat image storage, safety reports, and live chat subscriptions. The API compiles; `api/schema.sql` is applied to `production`; live checks pass for the implemented flows. Block flows and production moderation operations are not implemented.
3. Integrate one complete voice vertical slice: backend authorization/token → join muted → request permission/unmute → mute → leave/disconnect. Then connect remaining backend flows.
4. Pilot on real iOS and Android devices. Check room lifecycle, connection recovery, denied permissions, capacity enforcement, navigation while connected, and safety actions before broad release.

## Neon setup state

- `.neon` links this workspace to project `broad-dust-11626722`, organization `org-young-leaf-36801860`, branch `production`.
- `neon.ts` declares Postgres, Managed Better Auth, the private `assets` bucket, the `api` Function, and Realtime.
- Neon OAuth authentication is complete. `neon deploy` provisioned Postgres, Managed Auth, the private `assets` bucket, the `api` Function, and Realtime on `production`; the Function URL confirms AWS Asia Pacific 1 (Singapore, `ap-southeast-1`); `api/schema.sql` is applied; root and mobile env files are generated locally and ignored by Git.
- Live checks pass for Auth signup/sign-in and JWTs, API authorization, pseudonymous profiles, friend requests, fresh Pod starts/invites/capacity/one-active-Pod rules, active-friend Pod status, temporary-Pod deletion and persistent defaults, private photo upload/download, safety reports, and Realtime chat updates. Block flows, production moderation operations, and LiveKit remain incomplete.

## Open product decisions

- How Premium users may enter a full Pod: sixth overflow seat, reserved seat, priority, or waitlist. Enforce one server-side rule.
- Which Elsefolk characters are free or Premium and the purchase/restore experience. Do not invent prices or a currency system.
- Whether onboarding interests are in the first release and how they affect discovery.
- Final app icon/launcher art, bundle identifiers, and future Elsefolk refinements/accessories. The working product names Elsewhere, Elsefolk, and Pods are confirmed.
- Account/sign-in and recovery approach while preserving pseudonym-first onboarding.
- Production hosting/region, uptime needs, backup/restore target, moderation operations, retention/deletion policy, and launch budget.

## Design references

- `DECISION_HISTORY.md` — dated record of confirmed decisions, proposals, and open questions.

- `design-handoff/final-ui.html` — interactive visual/flow mockup; use as a reference, not as implementation source of truth.
- `design-handoff/APP_DESIGN_SPEC.md` — detailed approved product UI/interaction specification.
- `design-handoff/UI_CSS_RULES.md` — detailed visual tokens and styling rules.

When the HTML mockup differs from the Markdown specifications, follow the specifications. Update this brief when a product decision changes.
