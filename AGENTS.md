# Agent Instructions

## Project references

- Read `PROJECT_BRIEF.md` for product goals, architecture, current status, and the implementation plan.
- Read `DECISION_HISTORY.md` before making product or technical choices. Keep confirmed decisions distinct from proposals and open questions.
- For UI work, use `design-handoff/APP_DESIGN_SPEC.md` as the interaction source of truth and `design-handoff/UI_CSS_RULES.md` for visual rules. Treat `design-handoff/final-ui.html` as a reference, not implementation source of truth.
- When a product or architecture decision is made, update `DECISION_HISTORY.md` and keep `PROJECT_BRIEF.md` current where relevant.
- Use `mobile/README.md` as the setup and source-map entry point. `PROJECT_BRIEF.md` separates implemented prototype behavior from planned production work. `design-handoff/APP_DESIGN_SPEC.md` defines the current screens, copy, mock data, icons, and interactions; `design-handoff/UI_CSS_RULES.md` defines the exact visual tokens and layout. `DECISION_HISTORY.md` preserves decisions and marks superseded behavior.
- When changing app behavior or appearance, update every affected Markdown source in the same change. Keep all documents consistent with the running implementation; label future plans and mock-only behavior explicitly. Do not require the optional `design-handoff/final-ui.html` to recreate the app.

## Product and architecture constraints

- The app is pseudonym-first. Do not require a real name, phone number, camera, or contacts for ordinary onboarding.
- Keep account credentials and private identity-provider details separate from public pseudonymous profiles.
- The mobile client is React Native with Expo and TypeScript in `mobile/`.
- The planned backend is a TypeScript modular monolith with PostgreSQL on Neon. The API owns application rules and database access.
- LiveKit is the planned audio transport. Keep LiveKit API secrets on the server; the API authorizes room access and issues short-lived tokens.
- In the prototype, room joins start with mic UI muted and no real permission prompt/audio. In production, join muted and request microphone permission only when the user chooses to unmute.
- Keep screens dependent on service interfaces in `mobile/src/services/contracts.ts`; mock adapters are for local preview until API-backed adapters are implemented.
- Do not describe mock behavior as production functionality. Keep the brief and README accurate as implementation changes.

## Implementation practices

- Keep shared app styling in `mobile/src/constants/theme.ts` and reusable UI in `mobile/src/components/`.
- Follow the five bottom destinations (Chats, Friends, Voice, Invites, Profile). Keep the center slot as the same purple circular control in every state: from other tabs it opens Voice discovery when no room is active; on Voice it opens Create room; during room entry and inside the room it shows the mic state; from another tab with an active room it returns to that room. Keep the mic icon stable through room-entry navigation.
- Preserve safety and room rules from the brief, including server-side authorization, capacity enforcement, and report/block flows.
- Make focused changes that fit the existing Expo Router and TypeScript structure.
- Do not add or run tests unless the user asks for testing or verification.
