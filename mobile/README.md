# Elsewhere mobile app

This is the React Native, Expo, and TypeScript app for **Elsewhere**, a pseudonym-first social app. Its customizable characters are **Elsefolk**, and its voice rooms are **Pods**. A public profile has a display name, unique @username, optional bio, and Elsefolk character. The app has local mock adapters for preview and Neon-backed adapters for profiles, friends, Pods, invites, chats, safety reports, chat photos, and live chat updates. The voice screen remains a local preview and does not send audio.

## Run the app

From this directory:

```powershell
npm ci
npm run web
```

`npm run web` starts the Expo web preview. Open the local URL printed by Expo. On first launch, choose a display name and @username, then customize your Elsefolk's shape, color, and mouth. To see onboarding again in a browser, clear site storage; on a device, clear the app's storage.

For native development:

```powershell
npm run android
```

Android requires Android Studio and an Android SDK/emulator or connected device. On macOS with Xcode, run `npm run ios`. `npm run dev` starts Expo for an already-installed development client. EAS profiles are in `eas.json` and require an Expo account and project setup.

Run the TypeScript check with:

```powershell
npm run typecheck
```

Build the web app with `npm run build` from the workspace root. This builds the Neon Function TypeScript and exports the Expo web app.

## Neon backend

Neon infrastructure is declared in `../neon.ts`; the API Function is in `../api/index.ts`, and its schema is `../api/schema.sql`. After authenticating the Neon CLI and deploying the linked `production` branch:

```powershell
# From the workspace root
npm run sync:mobile-env
npm run db:migrate

# From this mobile directory
npm run web
```

The sync script writes only public Auth, Realtime, and Function URLs to `mobile/.env.local`. It never copies database or Object Storage credentials to the app. Restart Expo after syncing environment changes. If the service URLs are absent, the app uses local mock adapters.

After migrating, run `npm run verify:neon` from the workspace root for live end-to-end checks of Auth, Function authorization, Postgres profiles/friends/Pods/chats/reports, fresh-Pod starts, persistent defaults, temporary-Pod deletion, private photo uploads, and Realtime chat updates. It creates uniquely named temporary test accounts and removes their application records and auth rows afterward.

The sign-in screen uses Neon Managed Auth email/password. Public Elsewhere profiles remain separate and pseudonymous. Chat photos are uploaded to the private `assets` bucket, limited to 8 MB, and displayed using short-lived signed URLs. Neon Realtime subscribes to authorized conversation messages. Pods have no owner; three default Pods remain when empty, and temporary Pods are deleted after the last member leaves. The configured services have passed live end-to-end checks against `production`; block flows, production moderation operations, and LiveKit remain future work.

## Runtime snapshot

The current lockfile targets Expo `~58.0.23`, Expo Router `~58.0.30`, React `19.3.0`, React Native `0.88.1`, React Native Web `~0.21.4`, React Native SVG `15.16.0`, TypeScript `~6.0.3`, AsyncStorage `2.2.0`, safe-area-context `~5.11.1`, gesture-handler `~3.3.0`, and screens `~4.30.1`. Use `package-lock.json` when reproducing the exact dependency graph.

Expo config: display name **Elsewhere**, existing project slug `anonymous-voice`, version `1.0.0`, portrait orientation, light appearance, existing scheme `anonymousvoice`, web server output, Expo Router, and a `#FCFCFE` splash surface with a 76 px placeholder image. Typed routes and the React Compiler are enabled. Native launcher artwork is still placeholder art.

## What is implemented

- Display name and @username onboarding with an Elsefolk customizer for 20 vector outer shapes, 20 colors, and 20 mouth marks; the selected identity persists with the local profile and stays consistent across the app. Username availability checks only the known mock users; production needs server-side uniqueness reservation.
- Chats, Friends, Pods, Invites, and Profile destinations, plus an active-Pod route and private chat thread route.
- Pod discovery with three persistent defaults, four-digit Pod-code search, one-tap starts for fresh system-named Pods, invitations, a muted Pod-preview screen, participant actions, Shuffle, and leave confirmation. Empty default cards invite people to be the first to join without showing fake participants.
- Friend search/requests, profile editing, private chat, reporting choices, and local listening-mute controls.
- A shared purple center control whose action depends on location: Pods discovery from other tabs, a fresh Pod start on Pods, microphone during Pod entry/in a Pod, and return to an active Pod from other tabs.
- Received friend requests open in a bottom sheet from the Friends header. The **Active now** section appears only when a friend is currently in a Pod.

Without the Expo public service URLs, the app uses local mock data and saves only the public profile with AsyncStorage under `voice-app/profile/v1`. With Neon configured, account, profile, Pod, chat, invite, report, photo, and live chat flows use the deployed services. The microphone control remains a preview: it changes UI state only, does not request OS permission, and does not send audio.

## Source map

- `src/app/` — Expo Router routes. `(tabs)` contains the five destinations and hidden-from-bar room route; `chat/[id].tsx` is the private thread.
- `src/components/` — app shell, tab bar, Elsefolk character renderer, icons, reusable rows, sheets, and controls.
- `src/constants/theme.ts` — color, spacing, radius, and layout tokens.
- `src/data/mock-data.ts` — exact preview fixtures for people, rooms, requests, invites, chats, and messages.
- `src/services/contracts.ts` — profile, room, voice, chat, friend, invite, and safety interfaces.
- `src/services/mock-services.ts` — in-memory adapters and local profile storage.
- `src/state/app-provider.tsx` — shared preview state and actions.

## Markdown source of truth

The documents in the workspace root and `design-handoff/` are intended to be sufficient to reproduce the current prototype without relying on the optional HTML reference:

1. `../PROJECT_BRIEF.md` — implemented scope, planned backend, and project roadmap.
2. `../design-handoff/APP_DESIGN_SPEC.md` — route behavior, screen copy, mock fixtures, and current flows.
3. `../design-handoff/UI_CSS_RULES.md` — exact color, typography, spacing, layout, and component rules.
4. `../DECISION_HISTORY.md` — dated product and technical decisions, including superseded directions.
5. `../AGENTS.md` — instructions for keeping implementation and docs in sync.

`../design-handoff/final-ui.html` is an optional visual reference. If it differs from the Markdown, follow the Markdown. Keep statements about current prototype behavior separate from planned production behavior.

## Production boundaries

The backend is a TypeScript API modular monolith on Neon Functions with PostgreSQL on Neon. The API owns identity-to-profile mapping, authorization, room capacity, room codes, moderation reports, and persisted messages. The mobile app must never contain database or Object Storage credentials, the Realtime signing secret, or LiveKit API secrets. LiveKit has not been integrated; adding its native SDK will require a new development build.
