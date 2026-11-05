# telesma/state/REPORT.md - Project execution report

<!-- This file goes IN FULL into the startup prompt of every session. Two kinds of sections:  -->
<!--   • current state (Summary) — OVERWRITE it, it is meant to be one up-to-date description; -->
<!--   • chronicle (Test status, Task history, Change history, Problem log,                    -->
<!--     Visual artifacts) — APPEND one entry; older ones rotate to telesma/state/REPORT_ARCHIVE.md   -->
<!--     at startup (Test status: the 3 latest runs).                                          -->
<!-- Do not create your own `## ` sections for session summaries — EVERY `## ` section outside -->
<!-- this template is ad-hoc and only the 3 newest of them are kept.                           -->
<!-- Rotation moves WHOLE entries, multi-line ones too. An entry must have a recognisable      -->
<!-- start (a table row, `### …`, `- [date] …`, `- **Name …**`), and a paragraph glued        -->
<!-- under an entry counts as its continuation and goes to the archive together with it.      -->

## Summary

- **Start**: 2026-11-05
- **Status**: In progress (faza 4)
- **Progress**: 14/23 tasks completed (fazy 1–3 ✅, faza 4: 4.1)

## Test status

<!--
The table is the current state — REPLACE the numbers, do not add a second table.
Above the table, one paragraph per full-suite run, opened with bold text carrying the date:

**Regression after Phase 12 (2026-08-20) — GREEN:** backend `pytest -q` 340/0, frontend 210/0.
Compared with 328/205 after Phase 11: +12 backend tests. Tag `telesma/phase-12`.

The date in the first line is MANDATORY — rotation uses it to tell which runs to keep
(the 3 latest) and which to move to telesma/state/REPORT_ARCHIVE.md. A paragraph without a date
is treated as a continuation of the run above it. A block without a date stays in the file
forever and grows in the prompt of every session.
-->

**Regression after Phase 3 (2026-11-05) — GREEN:** unit `npm test -- --ci` 128/0 (11 plików), e2e Detox iOS 10/0 (3 kolejne przebiegi) i Android 10/0; `tsc`, ESLint, Prettier czyste. Względem fazy 2: +48 unit, +5 e2e na platformę. Tag `telesma/phase-3`.

**Regression after Phase 2 (2026-11-05) — GREEN:** unit `npm test -- --ci` 80/0 (7 plików), e2e Detox iOS 5/0 i Android 5/0 (smoke + biblioteka); `tsc`, ESLint, Prettier czyste. Względem fazy 1: +43 unit, +4 e2e na platformę. Tag `telesma/phase-2`.

**Regression after Phase 1 (2026-11-05) — GREEN:** unit `npm test -- --ci` 37/0, e2e Detox iOS (`ios.sim.release`) 1/0, Android (`android.emu.release`) 1/0; `tsc`, ESLint, Prettier czyste. Tag `telesma/phase-1`.

| Metric | Value |
|--------|-------|
| Total tests | 155 (135 unit + 10 e2e × 2 platformy) |
| Pass | 155 |
| Fail | 0 |
| Skip | 0 |
| Last run | 2026-11-05 (task 4.1, `npm test`) |

## Task history

| Task | Status | Tests | Tries | Commit | Time |
|------|--------|-------|-------|--------|------|
| 1.1 Architecture skeleton and conventions | ✅ | 1/1, tsc 0, eslint 0, prettier ok, expo-doctor 20/20 | 1 | 9c72d62 | 2026-11-05 |
| 1.2 Model domeny i czysta logika (`src/lib/track.ts`) | ✅ | 26/26 (25 nowych), mutacja reguły ogg → czerwony | 1 | 7ebe33c | 2026-11-05 |
| 1.3 Pamięć ustawień (`settingsStorage`) | ✅ | 37/37 (11 nowych), mutacja walidacji `kind` → czerwony | 1 | 4856d83 | 2026-11-05 |
| 1.4 Konfiguracja Detox + e2e dymny | ✅ | e2e iOS 1/1 (iPhone 16), Android 1/1 (AVD MyMusicPlayer_E2E); unit 37/37 | 3 + BLOCKED (dysk, R8) | 7649a5a | 2026-11-05 |
| 2.1 `LibrarySource` + Android SAF (`src/services/files/`) | ✅ | 47/47 unit (10 nowych), mutacja pomijania ukrytych → czerwony | 1 | a48c69b | 2026-11-05 |
| 2.2 `LibrarySource` iOS (Documents + import) | ✅ | 56/56 unit (9 nowych), mutacja filtra importu → czerwony | 1 | 7009f79 | 2026-11-05 |
| 2.3 `useLibrary` + źródło e2e + sonda czasu trwania | ✅ | 67/67 unit (11 nowych), mutacja strażnika generacji → czerwony | 1 | 979f53a | 2026-11-05 |
| 2.4 `LibraryScreen` (lista, stany, wybór folderu, import) | ✅ | 80/80 unit (13 nowych), mutacja widoczności „Import files” → czerwony | 2 | 8d24740 | 2026-11-05 |
| 2.5 E2E biblioteki (wybór, pusty folder, restart) | ✅ | e2e iOS 5/5, Android 5/5 | 2 | 14964b2 | 2026-11-05 |
| 3.1 `PlayerAdapter` + expo-audio | ✅ | 89/89 unit (9 nowych), mutacja „błąd zamiast wyjątku” → czerwony | 1 | 8810b71 | 2026-11-05 |
| 3.2 Kolejka, reducer, `usePlayer`, wiersz → odtwarzanie | ✅ | 121/121 unit (32 nowe), mutacja końca kolejki → 4 czerwone, odpięcie wiersza → test wejścia czerwony | 1 | 5cff361 | 2026-11-05 |
| 3.3 `PlayerBar` (suwak, czasy, przyciski, wyróżnienie) | ✅ | 128/128 unit (7 nowych), mutacja „nieaktywne bez utworu” → czerwony | 1 | af15e1c | 2026-11-05 |
| 3.4 E2E odtwarzacza (play, pauza, stop, suwak, następny/poprzedni, auto-następny, koniec listy) | ✅ | e2e iOS 10/10 ×3 przebiegi, Android 10/10 | 3 | 75f43fa | 2026-11-05 |
| 4.1 Odtwarzanie w tle (tryb audio, sesja Now Playing, synchronizacja zewnętrznej pauzy, AppState) | ✅ | 135/135 unit (7 nowych), mutacje `shouldPlayInBackground` i `awaitingNative` → czerwone | 1 | (ten commit) | 2026-11-05 |

## Change history

<!--
Entries added by Telesma after processing a file from telesma/changes/.
Entry format (one ### per change):

### YYYY-MM-DD <file-name>.md
- **Kind**: bug | correction | feature
- **Bug source**: [bugs only: task X.Y that built it | unknown]
- **Detected by**: [bugs only: test | scenario | review | telesma | owner | production]
- **Priority**: critical | normal
- **Affects**: [the affects field from the frontmatter, or "general"]
- **Summary**: [1-2 sentences on what changes and why]
- **Modified pending tasks**: [list of numbers, e.g. 4.2, 5.1] or "none"
- **New rework phase**: [e.g. Phase 6.Z1 with 3 tasks] or "none"
- **New tasks**: [list of numbers, e.g. 7.4, 7.5] or "none"

The change's source file lives in telesma/changes/processed/<file-name>.md (audit trail in git).
-->

## Visual artifacts

<!--
Section filled in ONLY when the `## Visual artifacts` section in telesma/config.md has
`Screenshots: yes` or `Recordings: yes`. Full procedure: section 0.5 of the instructions.

Row format:
| Phase | Type | ID | Artifact file | Spec source |
|-------|------|----|--------------:|-------------|
| 1     | screen | B1_ProjectOverview | telesma/artifacts/screens/B1_ProjectOverview.png | telesma/spec/ux_ui/screens-b1-b2.jsx:52-200 |
| 1     | flow   | step-1             | telesma/artifacts/flows/step-1-sign-up.webm      | telesma/spec/APP_FLOW.md:11-30 |

Info warnings (no APP_FLOW.md despite Recordings: yes, no flow_files, etc.) go
below the table with the prefix `> ⚠ Info:` so the user can see what happened "silently".
-->

| Phase | Type | ID | Artifact file | Spec source |
|-------|------|----|---------------|-------------|
| | | | | |

## Problem log

<!-- Format: [date] Task X.X: problem description - fix/status -->
<!-- We do NOT keep a list of changed files — git knows it better: git log --stat -->

- [2026-11-05] Task 1.1: Expo SDK 58 odrzuca `ios.deploymentTarget` 15.1 („needs to be at least version 16.4”) — minimum iOS podniesione do 16.4, decyzja A14 zaktualizowana w Key decisions (do potwierdzenia przez właściciela).
- [2026-11-05] Task 1.1: konflikt peer `react@19.3.0` vs `react-test-renderer`/`react-dom` 19.3.1 — przypięte do 19.3.0.
- [2026-11-05] Task 1.1: test w `app/__tests__/` byłby trasą expo-router — testy poza `app/` (`__tests__/`).
- [2026-11-05] Task 1.4: `@config-plugins/detox@11` deklaruje peer `expo@^53` (ERESOLVE na SDK 58) — własny plugin `plugins/withDetox.js` na jego wzór.
- [2026-11-05] Task 1.4: e2e jest padał na `Cannot find module 'babel-preset-expo'` — dodany jawnie do devDependencies; iOS e2e 1/1 zielony.
- [2026-11-05] Task 1.4: pierwszy build Androida 21 min (4 ABI) — komendy Detox zawężone do `-PreactNativeArchitectures=arm64-v8a`.
- [2026-11-05] Task 1.4: BLOCKED — emulator Androida nie startuje, na dysku ~301 MB wolnego; szczegóły w `telesma/state/BLOCKED.md`. Zmiany 1.4 niezatwierdzone (czekają na zielony Android).
- [2026-11-05] Task 1.4: miejsce zwolnione przez właściciela; emulator Medium_Phone miał pełną pamięć (cudze aplikacje) — utworzony osobny AVD `MyMusicPlayer_E2E` (8 GB danych), `.detoxrc.js` wskazuje na niego.
- [2026-11-05] Task 1.4: R8 w buildzie release wycina klasy, których używa Detox (`androidx.tracing.Trace`, `kotlin.coroutines.intrinsics.IntrinsicsKt`, `kotlin.ResultKt`) — 3 próby reguł keep, BLOCKED: wybór strategii (BLOCKED.md).
- [2026-11-05] Task 2.3: `expo install expo-audio` dodał plugin z uprawnieniem do mikrofonu (NSMicrophoneUsageDescription, RECORD_AUDIO) — wyłączone `microphonePermission: false`, `recordAudioAndroid: false` (decyzja A2: tylko odczyt plików).
- [2026-11-05] Task 2.3: test „stare czasy trwania” był pierwotnie bezużyteczny (różne id utworów w obu folderach → mutacja strażnika nie czerwieniła) — przepisany na nakładające się foldery (Rock → Rock/Favourites).
- [2026-11-05] Task 2.4: test wejścia (`app/index.tsx`) wykrył, że `settingsStorage` (1.3) odrzucał pusty `uri`, a od 2.2 `documents` + `''` = cały folder aplikacji iOS — wybór „All music” nie przetrwałby restartu. Walidacja: pusty `uri` dozwolony tylko dla `documents`; przypadek testu „empty uri” zmieniony na „empty SAF uri” (źródło: Key decisions 2026-11-05, ścieżka względna iOS).
- [2026-11-05] Task 2.5: iOS pokazywał `gamma-tone.m4a` jako 0:02 — AVPlayer podaje AAC odrobinę poniżej 3 s (priming), `formatDuration` obcina w dół. Pliki testowe mp3/m4a wydłużone do 3,5 s; test bez zmian.
- [2026-11-05] Task 3.2: pauza wywołana z zewnątrz (połączenie, inna aplikacja) zmienia stan natywny, ale reducer nie przełącza się sam z `playing` na `paused` — status zaraz po `load` też ma `isPlaying=false`, więc naiwna synchronizacja przełączałaby przy każdym starcie. Do rozwiązania w 4.1 (resynchronizacja przez AppState) i 5.1 (zdalne komendy).
- [2026-11-05] Task 3.3: atrapa `expo-asset` jako zwykły obiekt psuła `expo-font` (`instanceof Asset`) po dodaniu ikon — atrapa usunięta; dodana atrapa `react-native-safe-area-context/jest/mock` w `jest-setup.ts`.
- [2026-11-05] Task 3.4: iOS — lista utworów przerenderowywała się co 250 ms (pozycja odtwarzania w `HomeScreen`, `useLibrary` zwracał nowy obiekt), `FlatList` ustawiał timery 50 ms, Detox czekał na bezczynność, a w tym czasie wszystkie utwory się odgrywały. `useLibrary` zwraca obiekt z `useMemo`, `LibraryScreen` w `memo`.
- [2026-11-05] Task 3.4: Android — `adjustSliderToPosition` nie wywołuje slidingStart/Complete; dotknięcie z `getAttributes().frame` chybiało (frame w px, tap w dp). Na Androidzie gest `swipe` ze znormalizowanym punktem startu, na iOS `tap` w punktach.
- [2026-11-05] Task 3.4: jednorazowa porażka „stop po ostatnim utworze” na iOS w pełnym przebiegu (przed poprawką `memo`), nie powtórzyła się w 4 kolejnych przebiegach — obserwować.
