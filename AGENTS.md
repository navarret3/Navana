This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `app/` (project root; everything else lives in `src/`) — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Navana

- `PLAN.md` is the source of truth for scope, architecture, data model and phases. Read it before starting work.
- User-facing text is Spanish and lives in `src/i18n/locales/es.json` — never hard-code copy in components.
- Domain logic goes in `src/domain/` with no React or Firebase imports, and is covered by Jest tests. Anything a Jest test imports must stay free of `@/data/*` and `@/state/*` (they load native Firebase and fail under Jest); that is why `src/modules/registry.ts` holds only data and the Today cards live in `src/modules/todayCards.ts`.
- Task writes never `await` the server (see `src/features/tasks/useTaskActions.ts`): Firestore applies them locally and syncs later, so the app keeps working offline. Dates are calendar days as `YYYY-MM-DD` strings (`src/domain/dates.ts`).
- Import Firebase only through `@/data/fb` (native SDK on device, JS SDK against local emulators on web). Sign-in follows the same pattern in `@/data/signIn` (real Google account on device, emulator test users on web). Each pair of `.native.ts` / `.web.ts` files must export the same names; the `.web.ts` file has a compile-time check for it.
- The month view and the date picker are our own (`src/ui/MonthGrid.tsx`, `src/ui/DateField.tsx`) instead of `react-native-calendars` or a native date picker: no extra native module (so no new build) and nothing to break on a new React Native version.
- The theme follows the system and is picked once at startup in `src/ui/theme.ts` (styles are created with those values, so a system theme change shows after reopening the app). Never hard-code colours: use the tokens, and `onPeach` / `onDanger` / `white` for text over colours that do not change with the theme.
- Do not use Reanimated `entering` / `exiting` / `layout` animations on list rows: on web they left the rows with `visibility: hidden`, and it cannot be checked on a device from here. Press feedback and `useAnimatedStyle` (as in the tab bar) are fine.
- Every user-facing string exists in `es.json` and `en.json`; a test fails if the keys or the `{{placeholders}}` differ. The product dictionary for the shopping list is Spanish only.
- `menu` and `notes` are optional modules, off by default (Settings → Modules).
- On Android, React Native Firebase sends `increment(n)` as a double, so a counter written with it is stored as `1.0`. In `firestore.rules` check such fields with `is number`, never `is int`. The web view and the emulator tests use the JS SDK and will not catch this: anything touching counters must be tried on a device.
- Notifications cannot be checked on web. Three things made them fail silently on Android and must stay as they are: push messages are sent with `priority: 'high'` (the Android default, `normal`, is delayed while the phone sleeps); the channel has `AndroidImportance.HIGH` (lower ones do not pop up); and the handler returns `shouldPlaySound: true` (without it nothing is shown while the app is open). Android does not let a channel's importance change once created, so changing it means a new channel id in `src/notifications/expoPush.ts`, and a phone only shows a push for a channel it has already created (it must have opened that version once). Settings → Notifications has two test buttons that report where delivery fails.
- `firestore.rules` changes need a matching test in `tests/rules/` (`npm run test:rules`) and are only live on devices after `npm run deploy:rules`.
- Every phase ends with `npm run check` (tsc, lint, unit tests, rules tests) green. It needs ports 8080 free, so stop `npm run emulators` first.
- `@react-native-firebase/*` is pinned to 26.4.2 on purpose: 27.x ships `firebase-auth` built with Kotlin 2.4, which the Kotlin 2.2 toolchain of Expo SDK 58 cannot read (the EAS build fails in `:react-native-firebase_auth:compileDebugKotlin`). Only bump it together with an Expo SDK whose Kotlin is 2.3 or newer.
- On this Windows machine PowerShell blocks `npx.ps1`; in the terminal use `npx.cmd`.
- After editing `app.config.ts`, restart `expo start` and reopen the app on the device: a running dev server keeps serving the old config (this is how Google Sign-In once ran without its web client ID).
