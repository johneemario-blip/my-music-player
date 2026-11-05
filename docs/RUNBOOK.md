# RUNBOOK — My Music Player

**How to start the program:** `cd "/Users/mario/DANE/Praca/AI/TEMP/my-music-player" && npx expo run:android`
(builds and installs the app on a USB-connected Android phone or the running emulator), or
`cd "/Users/mario/DANE/Praca/AI/TEMP/my-music-player" && npx expo run:ios` (iOS Simulator; add
`--device` to pick a cable-connected iPhone). After the first install the app stays on the device
and is started from its icon.

The APKs left in `android/app/build/outputs/apk/release/` come from e2e builds (`EXPO_PUBLIC_E2E=1`,
bundled test tones instead of your music) — do not install them for normal use.

## Environment

- macOS with Xcode (iOS Simulator, CocoaPods: `brew install cocoapods`) and/or Android Studio
  (Android SDK, emulator), Node.js 22 + npm.
- Environment variables: none are required. `EXPO_PUBLIC_E2E=1` is set automatically by the
  `e2e:build:*` scripts (e2e builds only) — never set it for a normal build.
- No backend, database, accounts, ports or secrets — the app is fully local.
- Minimum OS on devices: Android 10 (API 29), iOS 16.4.

## Commands

| What | Command |
|------|---------|
| Install dependencies | `npm install` (add new ones with `npx expo install <pkg>`) |
| Dev server (after a native build is installed) | `npm start` |
| Build + run Android | `npm run android` |
| Build + run iOS | `npm run ios` |
| Regenerate `ios/` and `android/` (after `app.json` or a native dependency changes) | `npm run prebuild` |
| Unit/component tests | `npm test` (CI: `npm test -- --ci`) |
| Typecheck / lint / format | `npm run typecheck` · `npm run lint` · `npm run format` |
| E2E iOS (simulator `iPhone 16`) | `npm run e2e:build:ios && npm run e2e:test:ios` |
| E2E Android (AVD `MyMusicPlayer_E2E`) | `npm run e2e:build:android && npm run e2e:test:android -- --headless` |

## Music on the device

- **Android:** tap **Choose folder** and pick any folder in the system picker (access is remembered).
- **iOS:** put files in **Files › On My iPhone › My Music Player** (Files app, Finder, AirDrop) or
  use **Import files** in the app, then **Choose folder**.

## Known operational notes

- Android e2e builds disable R8 minification; normal release builds keep it.
- `ios/` and `android/` are generated and not committed.
- Manual lock-screen test (task 5.3) was done on a physical Android phone only; iOS lock screen
  was verified on the simulator through e2e — check it on a physical iPhone before a store release.
