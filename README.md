# My Music Player

A simple music player for Android and iOS. Pick a folder with your music, see the tracks in a
list and play them: play/pause, stop, previous/next and a progress slider. Playback continues in
the background and can be paused from the lock screen.

Built with React Native + Expo (SDK 58, New Architecture) and TypeScript. Fully local: no
account, no network, no analytics.

## Requirements

- macOS with Xcode (iOS Simulator) and/or Android Studio (Android SDK + an emulator)
- Node.js 22 and npm
- CocoaPods (`brew install cocoapods`) for iOS builds
- Minimum OS on devices: iOS 16.4, Android 10 (API 29)

## Run the app

```bash
npm install
npx expo run:ios       # builds and opens the iOS Simulator
npx expo run:android   # builds and installs on the running emulator or a USB-connected phone
```

The first native build takes several minutes. The `ios/` and `android/` folders are generated
(`npx expo prebuild`) and are not committed; regenerate them with `npm run prebuild` after
changing `app.json` or adding a native dependency.

## Add music

### Android

1. Copy music to the phone (USB, a download, Google Drive offline files — any folder works).
2. In the app tap **Choose folder** and pick the folder in the system picker, then allow access.

The app lists supported files from that folder and all its subfolders and remembers the folder;
it keeps working after a restart without asking again.

### iOS

iOS does not let apps open arbitrary folders, so the library lives in the app's own folder,
visible in the **Files** app under **On My iPhone › My Music Player**. Put music there in any of
these ways:

- **Files app** — move or copy files (also from iCloud Drive) into the My Music Player folder.
- **Finder** (Mac, iPhone connected by cable) — select the iPhone, open **Files**, drag files onto
  My Music Player.
- **AirDrop** — receive the files, choose **Save to Files** and pick the My Music Player folder.
- **Import files** button in the app — pick files in the system picker; they are copied into the
  current folder (an existing name gets a `(2)` suffix instead of being overwritten).

Then tap **Choose folder** and select **All music (app folder)** or one of its subfolders.

On the Simulator, drag audio files onto the Simulator window and save them to the My Music
Player folder in Files.

## Supported files

MP3, WAV, M4A, AAC and FLAC on both platforms; OGG on Android only. Decoding uses the system
player, so a file the system cannot read is skipped with a message and the next track plays.
Hidden files and folders (starting with `.`) are ignored. Track names are file names without
the extension; tags (ID3) and cover art are not read.

## Tests

```bash
npm test                 # unit and component tests (Jest + React Native Testing Library)
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
```

End-to-end tests use Detox on release builds. Detox cannot drive the system folder pickers, so
e2e builds (`EXPO_PUBLIC_E2E=1`, set by the build commands) replace the music library with short
bundled test tones exposed as in-app folders `Fixtures`, `Long` and `Empty`.

```bash
npm run e2e:build:ios && npm run e2e:test:ios
npm run e2e:build:android && npm run e2e:test:android -- --headless
```

- iOS uses the `iPhone 16` simulator.
- Android uses an emulator named `MyMusicPlayer_E2E` (see `.detoxrc.js`); create one from the
  Android 36 system image with at least 8 GB of internal storage. Android e2e builds disable code
  shrinking (R8) because it strips classes Detox needs; normal release builds keep it.

## Known limitations

- The lock screen and the media notification show the track title with play/pause only;
  previous/next work inside the app.
- One folder at a time; no playlists, favourites, search, repeat or shuffle.
- The playback position is not remembered after the app is closed.
- English interface only.
- No store builds or signing setup; the app is run locally from source.

## Project layout

```
app/                    expo-router entry (main screen)
src/features/library/   folder choice, track list, useLibrary
src/features/player/    queue reducer, usePlayer, PlayerBar
src/services/files/     LibrarySource: Android SAF, iOS Documents, e2e fixtures
src/services/audio/     PlayerAdapter on expo-audio, duration probe
src/services/storage/   remembered folder (AsyncStorage)
src/lib/                pure helpers, UI strings, theme, testIDs
e2e/                    Detox tests and audio fixtures
plugins/withDetox.js    config plugin wiring Detox into the Android project
```
