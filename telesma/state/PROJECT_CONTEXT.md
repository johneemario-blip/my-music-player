# PROJECT_CONTEXT.md

This file keeps the project context that survives `/compact`.

## Tech stack

- Language: TypeScript (strict)
- Framework: React Native + Expo (managed workflow, New Architecture), expo-router
- Audio: expo-audio (dekoder systemowy, bez własnych kodeków); sterowanie z ekranu blokady — expo-audio albo react-native-track-player za adapterem (decyzja w zadaniu 5.1)
- Pliki: expo-file-system (Storage Access Framework na Androidzie, Documents na iOS), expo-document-picker (import na iOS)
- Storage: AsyncStorage (tylko zapamiętany katalog)
- Database: brak
- Tests: Jest + jest-expo + React Native Testing Library (unit/komponenty), Detox (e2e, dev build na symulatorze iOS i emulatorze Android)
- Lint/format: ESLint + Prettier, `npx tsc --noEmit`

## Architecture

Jedna aplikacja cross-platform, w pełni lokalna (bez backendu i sieci), jeden ekran główny.
Planowana mapa modułów (doprecyzowana w zadaniu 1.1):

- `app/` — expo-router; `app/index.tsx` = ekran główny (`LibraryScreen` + `PlayerBar`)
- `src/features/library/` — stan biblioteki (`useLibrary`), `LibraryScreen`, `TrackRow`
- `src/features/player/` — reducer kolejki + `usePlayer`, `PlayerBar`
- `src/services/files/` — interfejs `LibrarySource` + implementacje Android (SAF) i iOS (Documents + import)
- `src/services/audio/` — interfejs `PlayerAdapter` + implementacja expo-audio
- `src/services/storage/` — `settingsStorage` (zapamiętany katalog)
- `src/lib/` — czysta logika (typ `Track`, filtr rozszerzeń, sortowanie, `formatDuration`), `strings.ts` (teksty UI, EN)
- `src/components/` — współdzielone komponenty prezentacyjne
- `e2e/` — testy Detox + pliki testowe audio

Warstwy: UI (komponenty) → hooki stanu (`useLibrary`, `usePlayer`) → serwisy za interfejsami (`LibrarySource`, `PlayerAdapter`). Interfejsy pozwalają testować logikę z atrapami i podmieniać źródło plików w buildzie e2e.

## Key decisions

<!-- The table grows with every session, and the file goes into the startup prompt in full, so    -->
<!-- telesma.sh keeps its 40 latest rows in it — older ones go to telesma/state/CONTEXT_ARCHIVE.md     -->
<!-- (write-only). A decision that is still BINDING — one whose violation would break the project — -->
<!-- mark with 📌 in the Decision column: a row with 📌 is never rotated.                           -->
<!-- An overturned decision is EDITED in place (`~~old~~ → new`, today's date, `superseded: …`),     -->
<!-- never added as a second row: two rows claiming opposite things are two truths in every prompt. -->

| Date | Decision | Reason |
|------|----------|--------|
| 2026-11-05 | 📌 Stack: React Native + Expo (managed, New Architecture) + TypeScript strict; expo-audio, expo-file-system, expo-document-picker; Jest + RNTL | Brak narzuconego stacku, jedna baza kodu na obie platformy, natywne odtwarzanie przez biblioteki Expo → QUESTIONS.md Q1 |
| 2026-11-05 | 📌 Jedna baza kodu cross-platform dla Android i iOS, bez aplikacji natywnych | Prosty odtwarzacz z jednym ekranem nie uzasadnia dwóch kodów → QUESTIONS.md A1 |
| 2026-11-05 | 📌 Brak backendu, sieci, kont i analityki — aplikacja w pełni lokalna, uprawnienia tylko do odczytu plików | Spec nie wspomina o serwerze ani synchronizacji → QUESTIONS.md A2 |
| 2026-11-05 | Odtwarzanie przez dekoder systemowy; obsługiwane rozszerzenia: mp3, wav, m4a, aac, flac, ogg (ogg tylko Android); nieobsługiwane nie trafiają na listę, nieczytelne → komunikat i pominięcie | Bez własnych kodeków, "MP3, WAV oraz inne" → QUESTIONS.md A3 |
| 2026-11-05 | 📌 Dostęp do katalogu: Android — Storage Access Framework z trwałym uprawnieniem; iOS — katalog Documents aplikacji widoczny w Pliki (UIFileSharingEnabled + LSSupportsOpeningDocumentsInPlace) + import wielu plików pickerem | iOS nie daje dostępu do dowolnych katalogów; natywny moduł z bookmarkami odrzucony jako kruchy → QUESTIONS.md Q3 |
| 2026-11-05 | Odtwarzanie w tle w pierwszej wersji (faza 4); sterowanie z ekranu blokady/powiadomienia jako osobna faza 5 | Bez tła muzyka urywa się po zgaszeniu ekranu → QUESTIONS.md Q2 |
| 2026-11-05 | E2E: Detox na dev buildzie (symulator iOS + emulator Android); systemowe pickery omijane przez podmianę `LibrarySource` na pliki testowe w buildzie e2e | Detox ma wytyczne w telesma/guidelines/, Maestro nie → QUESTIONS.md Q4, A17 |
| 2026-11-05 | Kolejka sekwencyjna z poprzedni/następny, auto-następny po końcu utworu, stop po ostatnim; bez repeat/shuffle, ale strategia kolejki wymienna | "Prosty odtwarzacz", rozszerzenia później → QUESTIONS.md A8, Q5 |
| 2026-11-05 | Semantyka: play/pauza jeden przełączany przycisk (pauza zachowuje pozycję), stop osobny (pozycja 0); suwak interaktywny z seek, czasy m:ss | Standardowa semantyka odtwarzaczy → QUESTIONS.md A7, A9 |
| 2026-11-05 | Lista: nazwa pliku bez rozszerzenia + czas trwania, skan rekurencyjny z pominięciem plików ukrytych, sortowanie alfabetyczne; tagi ID3 i okładki poza zakresem | Spec nie wspomina o metadanych, tagi kosztowne przy dużych katalogach → QUESTIONS.md A4, A5 |
| 2026-11-05 | Zapamiętywany jest tylko wybrany katalog (AsyncStorage); pozycja w utworze nie przetrwa zamknięcia aplikacji | Prostota → QUESTIONS.md A6 |
| 2026-11-05 | Zakres v1: wybór katalogu, lista, play/pauza/stop, poprzedni/następny, suwak, tło, ekran blokady; bez playlist, ulubionych, wyszukiwania, equalizera, głośności w aplikacji; jeden katalog naraz | "Prosty odtwarzacz" → QUESTIONS.md A10 |
| 2026-11-05 | UI: jeden ekran (lista + dolny pasek odtwarzacza + „Choose folder” w nagłówku), domyślne komponenty platformy, motyw podąża za systemem; brak makiet | telesma/spec/ux_ui/ pusty → QUESTIONS.md A11, A13, Q6 |
| 2026-11-05 | 📌 Język interfejsu: angielski domyślnie; wszystkie teksty w `src/lib/strings.ts`, bez pełnego mechanizmu i18n | Użytkownik odrzucił polski jako domyślny ("ustaw domyślnie angielski") → QUESTIONS.md A12 |
| 2026-11-05 | ~~Minimalne wersje: Android 10 (API 29), iOS 15~~ → Android 10 (API 29), iOS 16.4; telefon, orientacja portrait, tablet bez osobnego układu | superseded: Expo SDK 58 (przypięty stack) wymaga `ios.deploymentTarget` ≥ 16.4 — zadanie 1.1; API 29 wymusza SAF → QUESTIONS.md A14 |
| 2026-11-05 | 📌 Konwencje 1.1: aliasy `@/*` → `src/*`; teksty UI tylko z `src/lib/strings.ts`; testID `'<feature>.<element>'` w `src/lib/testIds.ts`; błędy oczekiwane jako `Result<T, E>` z `src/lib/result.ts`; testy Jest w `__tests__/` lub `*.test.ts(x)` obok źródła, NIGDY w `app/` (expo-router traktuje każdy plik w `app/` jako trasę) | Jeden wzorzec dla RNTL i Detox; zadanie 1.1 |
| 2026-11-05 | 📌 iOS: `SavedDirectory` typu `documents` przechowuje ścieżkę WZGLĘDNĄ do `Paths.document` (`` = cały folder aplikacji), nigdy absolutny URI; „Choose folder” na iOS = lista folderów z `listFolders()`, import przez `importFiles()` (kolizje nazw → „name (2).ext”) | Ścieżka kontenera aplikacji iOS zmienia się po reinstalacji/aktualizacji — zadanie 2.2 |
| 2026-11-05 | Bez `"type": "module"` w package.json mimo typescript.md — Metro/Babel/Jest w Expo zakładają CommonJS dla plików konfiguracyjnych; kod źródłowy i tak w składni ESM, `verbatimModuleSyntax` włączone | Konflikt wytycznej z narzędziami Expo; zadanie 1.1 |
| 2026-11-05 | 📌 E2E: Detox na buildach release (bez Metro); Android e2e budowany z `-Pandroid.enableMinifyInReleaseBuilds=false` i tylko arm64-v8a, na dedykowanym AVD `MyMusicPlayer_E2E`; build produkcyjny z R8 bez reguł keep Detoxa; integracja Detox na Androidzie przez lokalny `plugins/withDetox.js` (oficjalny plugin tylko Expo 53) | R8 wycina klasy Kotlina potrzebne Detoxowi → DECISIONS.md 2026-11-05 13:01 |
| 2026-11-05 | Zależności instalowane przez `npx expo install`; przy konflikcie peer (react-dom/react-test-renderer) przypiąć do wersji `react` z SDK (19.3.0) zamiast `--legacy-peer-deps` | Zadanie 1.1 |
| 2026-11-05 | Stany brzegowe z komunikatem w aplikacji: pusty katalog, cofnięte uprawnienie (prośba o ponowny wybór), plik usunięty/nieczytelny (komunikat + następny) | Obsługa błędów nieopisana w spec → QUESTIONS.md A15 |
| 2026-11-05 | Uruchamianie i testy lokalnie na tym Macu; publikacja w sklepach, konta deweloperskie i podpisywanie poza zakresem | Spec nie wspomina o dystrybucji → QUESTIONS.md A16 |
| 2026-11-05 | Testy: logika za interfejsami (`PlayerAdapter`, `LibrarySource`) testowana z atrapami; audio nie jest testowane jednostkowo | Odtwarzanie wymaga urządzenia → QUESTIONS.md A17 |

## Known problems and solutions

<!-- Known pitfalls: distilled from the Problem log at the end-of-phase checkpoint (section 7  -->
<!-- of the instructions). Only RECURRING patterns — a one-off error stays in the Problem log  -->
<!-- in REPORT.md. One row = one pitfall, on ONE line and concise.                             -->

| Problem | Solution |
|---------|----------|
| Peer-dep ERESOLVE przy instalacji (react-dom, react-test-renderer, @config-plugins/detox) — biblioteki wyprzedzają/zostają za SDK 58 | Przypiąć do wersji z SDK (`react@19.3.0`) albo zastąpić lokalnym kodem; nigdy `--legacy-peer-deps` → guard: none, bo problem zależy od rejestru npm |
| R8 w release usuwa klasy ładowane przez APK testowy Detoxa | Build e2e Androida bez minifikacji (`.detoxrc.js`), nie łatać regułami keep → DECISIONS.md 2026-11-05 13:01 |

## Component dependencies

- `LibraryScreen` → `useLibrary` → `LibrarySource` (Android: SAF, iOS: Documents + import) + `settingsStorage`
- `PlayerBar` → `usePlayer` (reducer kolejki) → `PlayerAdapter` (expo-audio); `usePlayer` bierze listę utworów z `useLibrary`
- Dotknięcie `TrackRow` wywołuje `usePlayer.playTrack(index)`; `usePlayer` zgłasza aktualny indeks do wyróżnienia wiersza
- Faza 4 i 5 rozszerzają `PlayerAdapter` (tryb tła, metadane Now Playing, zdalne komendy) bez zmian w UI
- Build e2e: `LibrarySource` podmieniony na katalog z plikami testowymi dołączonymi do aplikacji

## Current state

- Last completed task: 2.4 `LibraryScreen` (`src/features/library/`: LibraryScreen, TrackRow, FolderPickerModal; `src/components/AppButton.tsx`; motyw `src/lib/theme.ts`; `app/index.tsx` łączy useLibrary + ekran)
- Next task: 2.5 E2E biblioteki
- Blockers: brak
- Uwaga: RNTL 14 — `render` jest asynchroniczny (`await render(...)`)
