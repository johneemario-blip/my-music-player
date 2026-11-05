# telesma/state/REPORT_ARCHIVE.md — archive of REPORT.md

Older entries moved here automatically by telesma.sh at startup.
Write-only — this file is not loaded into any prompt.

## Rotation 2026-11-05

### Test status

**Regression after Phase 6 (2026-11-05) — GREEN:** unit `npm test -- --ci` 149/0, e2e Detox iOS 12/0 i Android 12/0 z finalną konfiguracją (ikona, splash); `tsc`, ESLint, Prettier czyste, expo-doctor 20/20. Faza 5 bez tagu — czeka na test ręczny 5.3. Tag `telesma/phase-6`.

**Regression after Phase 4 (2026-11-05) — GREEN:** unit `npm test -- --ci` 135/0, e2e Detox iOS 11/0 i Android 11/0 (nowy: granie w tle); `tsc`, ESLint, Prettier czyste. Względem fazy 3: +7 unit, +1 e2e na platformę. Tag `telesma/phase-4`.

### Task history

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

### Problem log

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
