# telesma/state/PLAN.md - Project task list

## Project information

- **Name**: My Music Player — prosty mobilny odtwarzacz audio (Android + iOS)
- **Stack**: React Native + Expo (managed workflow, New Architecture) + TypeScript strict; expo-audio, expo-file-system (SAF), expo-document-picker, AsyncStorage; Jest + jest-expo + React Native Testing Library; Detox (e2e, dev build)

## Tasks

<!-- A task line is ≤ 400 characters (the telesma.sh validator warns above that). The plan says  -->
<!-- WHAT is to be done; rationale, findings from the work and the "why this way" go to             -->
<!-- telesma/state/REPORT.md (Problem log) or telesma/state/PROJECT_CONTEXT.md (Key decisions).                      -->
<!-- Every `- [ ]` item MUST start with the word `Task` or `Test`. `⛔` = waiting for a human.     -->

### Phase 1: Szkielet projektu i fundamenty

- [x] Task 1.1: Architecture skeleton and conventions — projekt Expo (TS strict, expo-router, `app/index.tsx` z testID), mapa modułów z PROJECT_CONTEXT.md, teksty UI w `src/lib/strings.ts` (EN), typ `Result`, konwencja testID, Jest + RNTL, ESLint + Prettier, min. API 29 / iOS 15, portrait; wynik do PROJECT_CONTEXT.md (tech: react-native, typescript)
- [x] Test: 1.1 — test dymny renderuje ekran główny; `npm test`, `npx tsc --noEmit` i lint przechodzą <!-- iOS min. 16.4 (wymóg SDK 58) -->
- [x] Task 1.2: Model domeny i czysta logika w `src/lib/`: typ `Track` (id, uri, name, durationMs), `isSupportedAudioFile(name, platform)` (mp3, wav, m4a, aac, flac; ogg tylko Android; pliki `.` pomijane), `sortTracks` alfabetycznie, `formatDuration(ms)` → `m:ss` (requires: 1.1) (spec: app.md) (tech: typescript)
  - AC: pliki o rozszerzeniach MP3 i WAV są rozpoznawane jako obsługiwane, pliki o innych rozszerzeniach (txt, jpg) nie
  - AC: nazwa na liście to nazwa pliku bez rozszerzenia
  - AC: `formatDuration` daje `0:00` dla 0 i braku wartości, `3:05` dla 185000 ms
- [x] Test: 1.2 — testy jednostkowe rozpoznawania rozszerzeń per platforma, sortowania i formatowania czasu
- [x] Task 1.3: Pamięć ustawień `src/services/storage/settingsStorage.ts` — zapis/odczyt wybranego katalogu (`{ kind: 'saf' | 'documents', uri }`) w AsyncStorage, brak wpisu → `null`, uszkodzony wpis → `null` (requires: 1.1) (tech: react-native, typescript)
  - AC: zapisany katalog jest odczytywany po ponownym uruchomieniu aplikacji
- [x] Test: 1.3 — testy z atrapą AsyncStorage: zapis, odczyt, brak wpisu, uszkodzony JSON
- [x] Task 1.4: Konfiguracja Detox (dev build: symulator iOS + emulator Android, skrypty `e2e:build:*`, `e2e:test:*`) + e2e dymny: aplikacja startuje i ekran główny jest widoczny (requires: 1.1, 1.2, 1.3) (tech: detox, typescript)

### Phase 2: Biblioteka — wybór katalogu i lista utworów

- [x] Task 2.1: Interfejs `LibrarySource` (`pickDirectory()`, `listAudioFiles(dirRef)` rekurencyjnie, `hasAccess(dirRef)`) + implementacja Android przez Storage Access Framework z `expo-file-system` (trwałe uprawnienie, skan podkatalogów, filtr z 1.2) w `src/services/files/` (requires: 1.2) (spec: app.md) (tech: react-native, typescript)
  - AC: entry — użytkownik dotyka „Choose folder” → otwiera się systemowy wybór katalogu Androida
  - AC: lista zawiera obsługiwane pliki audio z wybranego katalogu i jego podkatalogów, pliki ukryte pominięte
  - AC: po ponownym uruchomieniu aplikacji dostęp do katalogu działa bez ponownego wyboru
- [x] Test: 2.1 — testy z atrapą FileSystem: rekurencja, filtr rozszerzeń, odmowa uprawnienia zwraca błąd, nie wyjątek
- [x] Task 2.2: `LibrarySource` dla iOS: Documents aplikacji widoczne w Pliki (`UIFileSharingEnabled`, `LSSupportsOpeningDocumentsInPlace`), „Choose folder” wybiera Documents lub podkatalog, „Import files” przez `expo-document-picker` kopiuje pliki do Documents (requires: 2.1) (spec: app.md) (tech: react-native, typescript)
  - AC: entry — użytkownik dotyka „Choose folder” na iOS → lista podkatalogów Documents; „Import files” → systemowy wybór plików
  - AC: pliki wrzucone do folderu aplikacji w Pliki pojawiają się na liście po wyborze katalogu
  - AC: zaimportowane pliki trafiają do Documents i są widoczne na liście
- [x] Test: 2.2 — testy z atrapą FileSystem i DocumentPicker: listowanie podkatalogów, import kopiuje tylko obsługiwane pliki
- [x] Task 2.3: Stan biblioteki `useLibrary` w `src/features/library/`: przy starcie odczyt katalogu z 1.3 i skan, stany `idle | loading | ready | empty | error`; w buildzie e2e `LibrarySource` podmieniony na katalog z plikami testowymi (requires: 1.3, 2.1, 2.2) (spec: app.md) (tech: react-native, typescript)
  - AC: pusty katalog daje stan `empty`, katalog z plikami stan `ready` z posortowaną listą
  - AC: zmiana katalogu zastępuje listę, nie dokleja do niej
  - AC: po utracie dostępu do katalogu użytkownik widzi prośbę o ponowny wybór
- [x] Test: 2.3 — testy hooka z fałszywym `LibrarySource`: wszystkie stany, odczyt zapamiętanego katalogu, zamiana listy
- [x] Task 2.4: Ekran główny `LibraryScreen`: nagłówek z „Choose folder” (na iOS także „Import files”), `FlatList` z `TrackRow` (nazwa, czas trwania), stan pusty, ładowanie, błąd; testID na elementach; motyw systemowy jasny/ciemny; etykiety dostępności (requires: 2.3) (spec: app.md) (tech: react-native, typescript, accessibility)
  - AC: entry — użytkownik uruchamia aplikację → widzi listę utworów z zapamiętanego katalogu albo stan pusty z przyciskiem wyboru
  - AC: każdy wiersz pokazuje nazwę pliku bez rozszerzenia i czas trwania w formacie m:ss
  - AC: wszystkie teksty interfejsu po angielsku, pochodzą z `src/lib/strings.ts`
- [x] Test: 2.4 — testy RNTL: render listy z fixture, stan pusty, stan błędu, przycisk importu tylko na iOS
- [x] Task 2.5: E2E test — wybór katalogu z plikami testowymi → lista posortowana z czasami trwania; pusty katalog → stan pusty; restart aplikacji → lista przywrócona bez ponownego wyboru (iOS + Android) (requires: 2.1, 2.2, 2.3, 2.4) (spec: app.md) (tech: detox, typescript)

### Phase 3: Odtwarzacz — play, pauza, stop, suwak, kolejka

- [x] Task 3.1: Interfejs `PlayerAdapter` (`load`, `play`, `pause`, `stop`, `seekTo`, `onStatus` → pozycja, czas trwania, isPlaying, didJustFinish, error) + implementacja na `expo-audio` w `src/services/audio/`; tryb audio: gra przy przełączniku wyciszenia iOS, przerwanie (połączenie) pauzuje (requires: 1.2) (spec: app.md) (tech: react-native, typescript)
  - AC: plik MP3 i WAV z katalogu ładuje się i odtwarza przez dekoder systemowy
  - AC: plik, którego nie da się odtworzyć, zgłasza `error` w statusie zamiast wyjątku
- [x] Test: 3.1 — test kontraktu adaptera z atrapą expo-audio: mapowanie statusów, błąd ładowania, seek
- [x] Task 3.2: Kolejka i maszyna stanów odtwarzacza w `src/features/player/` (czysty reducer + hook `usePlayer`): play/pauza, stop, poprzedni/następny, auto-następny, plik nieczytelny → komunikat i przejście dalej; strategia kolejki wymienna pod repeat/shuffle (requires: 3.1, 2.3) (spec: app.md) (tech: typescript)
  - AC: entry — dotknięcie wiersza listy startuje odtwarzanie tego utworu od 0
  - AC: pauza zatrzymuje z zachowaniem pozycji, ponowne play wznawia od tej pozycji
  - AC: stop zatrzymuje i ustawia pozycję na 0; play po stopie startuje od początku
  - AC: po zakończeniu utworu startuje następny z listy, po ostatnim odtwarzacz zatrzymuje się
- [x] Test: 3.2 — testy jednostkowe reducera (wszystkie przejścia) i hooka z fałszywym `PlayerAdapter` (auto-następny, koniec listy, plik z błędem)
- [x] Task 3.3: `PlayerBar` na dole ekranu głównego: tytuł, suwak (`@react-native-community/slider`) z seek, czas bieżący/całkowity `m:ss`, przyciski poprzedni / play-pauza / stop / następny (nieaktywne bez utworu), wyróżnienie granego wiersza (requires: 3.2, 2.4) (spec: app.md) (tech: react-native, typescript, accessibility)
  - AC: suwak pokazuje postęp odtwarzania i przeciągnięcie przewija utwór do wskazanej pozycji
  - AC: przycisk play zmienia się w pauzę podczas odtwarzania i z powrotem po pauzie
  - AC: aktualnie grany utwór jest wyróżniony na liście
- [x] Test: 3.3 — testy RNTL: stany przycisków, wartość suwaka z pozycji, seek wywołuje adapter, wyróżnienie wiersza
- [x] Task 3.4: E2E test — dotknięcie utworu → gra; pauza → pozycja zachowana; stop → 0:00; seek suwakiem; następny/poprzedni; auto-następny na krótkich plikach testowych; koniec listy → stop (iOS + Android) (requires: 3.1, 3.2, 3.3) (spec: app.md) (tech: detox, typescript)

### Phase 4: Odtwarzanie w tle

- [x] Task 4.1: Odtwarzanie w tle: `UIBackgroundModes: audio` (iOS) i uprawnienia usługi pierwszoplanowej (Android) w app.json, `setAudioModeAsync` z odtwarzaniem w tle i trybem przerwań, ponowna synchronizacja stanu przez `AppState` po powrocie na pierwszy plan (requires: 3.1, 3.2) (spec: app.md) (tech: react-native, typescript)
  - AC: entry — użytkownik blokuje ekran lub przełącza aplikację podczas odtwarzania → muzyka gra dalej
  - AC: po powrocie do aplikacji suwak i stan przycisków odpowiadają rzeczywistej pozycji
- [x] Test: 4.1 — testy jednostkowe: konfiguracja trybu audio z oczekiwanymi flagami, resynchronizacja po zdarzeniu `AppState`
- [x] Task 4.2: E2E test — start odtwarzania → aplikacja w tle na 3 s → powrót: pozycja przesunięta o co najmniej 3 s i stan „playing” (iOS + Android) (requires: 4.1) (spec: app.md) (tech: detox, typescript)

### Phase 5: Sterowanie z ekranu blokady

- [x] Task 5.1: Metadane „Now Playing” i zdalne komendy play/pauza z ekranu blokady i powiadomienia medialnego przez expo-audio za `PlayerAdapter`; następny/poprzedni tylko w aplikacji (BACKLOG, DECISIONS.md 2026-11-05 15:47) (requires: 4.1, 3.2) (spec: app.md) (tech: react-native, typescript)
  - AC: entry — użytkownik naciska pauzę na ekranie blokady → odtwarzacz w aplikacji pauzuje i odwrotnie
  - AC: ekran blokady pokazuje nazwę granego utworu
- [x] Test: 5.1 — testy jednostkowe mapowania zdalnych komend na akcje reducera i aktualizacji metadanych przy zmianie utworu
- [x] Task 5.2: E2E test — regresja pełnego scenariusza z fazy 3 przy włączonej sesji medialnej (lista → play → pauza → następny → stop) (iOS + Android) (requires: 5.1) (spec: app.md) (tech: detox, typescript)
- [ ] ⛔ Task 5.3: Test ręczny na fizycznym iPhonie i telefonie z Androidem: play/pauza i tytuł na ekranie blokady i w powiadomieniu, wynik zapisany w REPORT.md (requires: 5.1, 5.2) (spec: app.md)

### Phase 6: Wykończenie

- [x] Task 6.1: Tożsamość aplikacji: nazwa „My Music Player”, ikona, splash, identyfikatory pakietów, orientacja portrait, motyw systemowy w app.json (requires: 1.1) (tech: react-native, typescript)
- [x] Test: 6.1 — konfiguracja app.json przechodzi `npx expo config` bez ostrzeżeń, test dymny z 1.1 nadal zielony
- [x] Task 6.2: README (EN): uruchomienie na emulatorze/symulatorze, testy jednostkowe i e2e, jak wrzucić muzykę na iOS (Pliki/Finder/AirDrop) i wybrać katalog na Androidzie, znane ograniczenia (requires: 2.2, 5.1) (spec: app.md)
- [ ] Task 6.3: E2E test — pełny przebieg wszystkich scenariuszy e2e (fazy 1-5) na iOS i Androidzie z finalną konfiguracją aplikacji (requires: 6.1, 6.2) (tech: detox, typescript)

## Spec coverage

| File                                     | Section                                                                         | Tasks                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Aplikacja jest odtwarzaczem plików audio | Wymagania funkcjonalne (formaty, wybór katalogu, lista, play/stop/pauza, suwak) | 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 5.2, 5.3            |
| Aplikacja jest odtwarzaczem plików audio | Platformy docelowe (Android i iOS)                                              | 1.1, 1.4, 2.1 (Android), 2.2 (iOS), 4.1, 6.1, 6.3                                    |
| TECHNICAL_GUIDELINES.md                  | Nagłówek i instrukcja użycia                                                    | out of scope — szablon bez odstępstw, obowiązują domyślne wytyczne                   |
| TECHNICAL_GUIDELINES.md                  | Stack — odstępstwa                                                              | out of scope — pole puste; stack ustalony w QUESTIONS.md Q1 → 1.1                    |
| TECHNICAL_GUIDELINES.md                  | Hosting i infrastruktura                                                        | out of scope — aplikacja lokalna bez backendu (A2), dystrybucja poza zakresem (A16)  |
| TECHNICAL_GUIDELINES.md                  | Integracje zewnętrzne                                                           | out of scope — brak integracji (A2)                                                  |
| TECHNICAL_GUIDELINES.md                  | Wymagania niefunkcjonalne                                                       | out of scope — brak narzuconych wartości; a11y i i18n jako konwencje w 1.1, 2.4, 3.3 |
| TECHNICAL_GUIDELINES.md                  | Inne ograniczenia                                                               | out of scope — pusta lista                                                           |
| TECHNICAL_GUIDELINES.md                  | Wymagania biznesowe — odsyłacz                                                  | out of scope — odsyłacz do pliku opisu funkcjonalnego                                |
| telesma/spec/ux_ui/                      | (katalog pusty)                                                                 | out of scope — brak makiet, domyślny wygląd platformy (Q6, A11, A13) → 2.4, 3.3      |

## Notes

- Dependencies: `(requires: X.X, Y.Y)` - Telesma skips the task if its dependencies are not completed
- Documentation: `(spec: file)` - Telesma loads ONLY the related fragments of these files (through telesma/state/SPEC_INDEX.md + Read with offset/limit); the spec file here has no extension: `Aplikacja jest odtwarzaczem plików audio`
- Technology: `(tech: tag1, tag2)` - Telesma loads style/convention guidelines from `telesma/guidelines/<tag>.md` + always `general.md`
- Every implementation task has a `- [ ] Test: ...` item (unit/integration) right after it; every phase with UI ends with a Detox e2e task
- E2E a systemowe okna: Detox nie steruje systemowym wyborem katalogu (SAF, Pliki) — build e2e podmienia `LibrarySource` na katalog z krótkimi plikami testowymi (2-3 s) dołączonymi do aplikacji (zadanie 2.3)
- Change: `(change: <file-name>.md)` — annotation on tasks modified or created by a file from `telesma/changes/`
- **Rework phases `.Z<n>`**: created automatically by Telesma when a change from `telesma/changes/` touches a ✅ task
