# telesma/state/QUESTIONS.md - Project clarification

## Status

- **State**: done
- **Total questions**: 6
- **Answered**: 0
- **Assumptions**: 17
- **Contradictions**: 0
- **Generated on**: 2026-11-05

## Analyzed documents

- `telesma/spec/Aplikacja jest odtwarzaczem plików audio` (2 lines) — opis funkcjonalny
- `telesma/spec/TECHNICAL_GUIDELINES.md` (89 lines) — szablon bez zmian, obowiązują domyślne wytyczne
- `telesma/spec/ux_ui/` — katalog pusty, brak makiet

## Contradictions in the documentation

<!-- No contradictions detected -->

## Assumptions

### A1: Jedna wspólna baza kodu (cross-platform) dla Android i iOS — nie dwie aplikacje natywne
- **Category**: architecture
- **Source**: Aplikacja jest odtwarzaczem plików audio:2
- **Rationale**: Prosty odtwarzacz z jednym ekranem nie uzasadnia utrzymywania dwóch kodów; frameworki cross-platform dają natywne odtwarzanie audio na obu systemach. Konkretny framework — pytanie Q1.
- **Status**: ✅

### A2: Brak backendu i sieci — aplikacja w pełni lokalna, offline
- **Category**: architecture
- **Source**: Aplikacja jest odtwarzaczem plików audio:1-2 (brak wzmianki o serwerze, kontach, synchronizacji)
- **Rationale**: Wszystkie dane (pliki audio, wybrany katalog) są na urządzeniu; żadnych kont, logowania, analityki ani wywołań sieciowych. Uprawnienia tylko do odczytu plików.
- **Status**: ✅

### A3: Odtwarzanie przez natywny dekoder systemu (biblioteka audio frameworka), bez własnych kodeków
- **Category**: technology
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "MP3, WAV oraz inne"
- **Rationale**: Lista obsługiwanych formatów = to, co dekoduje system: MP3, WAV, AAC/M4A, FLAC, OGG (OGG tylko Android). Plik o nieobsługiwanym rozszerzeniu nie trafia na listę; plik, którego nie da się odtworzyć mimo rozszerzenia, dostaje komunikat i jest pomijany.
- **Status**: ✅

### A4: Lista utworów obejmuje podkatalogi wybranego katalogu (skan rekurencyjny)
- **Category**: requirements
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "wybrać katalog z utworami"
- **Rationale**: Muzyka jest zwykle ułożona w podkatalogi (wykonawca/album); płaski skan pokazałby pusty katalog. Głębokość nieograniczona, pliki ukryte (`.`) pomijane.
- **Status**: ✅

### A5: Pozycja na liście = nazwa pliku (bez rozszerzenia) + czas trwania; tagi ID3 i okładki poza pierwszą wersją
- **Category**: requirements
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "zostaną wyświetlone na liście"
- **Rationale**: Spec nie wspomina o metadanych; czytanie tagów wymaga dodatkowej biblioteki i jest wolne przy dużych katalogach. Sortowanie alfabetyczne po nazwie pliku. Tagi można dodać jako osobną fazę.
- **Status**: ✅

### A6: Wybrany katalog jest zapamiętywany między uruchomieniami; lista odświeżana przy starcie
- **Category**: requirements
- **Source**: Aplikacja jest odtwarzaczem plików audio:1
- **Rationale**: Bez tego użytkownik wybierałby katalog przy każdym uruchomieniu. Pozycja w utworze NIE jest pamiętana po zamknięciu aplikacji (prostota).
- **Status**: ✅

### A7: Semantyka przycisków: pauza zachowuje pozycję, stop wraca do początku utworu, play wznawia lub startuje od 0
- **Category**: requirements
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "play, stop, pauza"
- **Rationale**: Standardowa semantyka odtwarzaczy. Play i pauza to jeden przełączany przycisk, stop osobny.
- **Status**: ✅

### A8: Dodatkowo przyciski poprzedni/następny; po końcu utworu automatycznie startuje kolejny z listy, po ostatnim — stop
- **Category**: requirements
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "standardowe akcje jak …" (lista otwarta)
- **Rationale**: Bez przejścia do następnego utworu lista traci sens. Brak trybów powtarzania i losowego w pierwszej wersji.
- **Status**: ✅

### A9: Suwak postępu jest interaktywny — pokazuje pozycję/czas trwania i pozwala przewijać przeciągnięciem
- **Category**: requirements
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "jest suwak postępu"
- **Rationale**: Suwak tylko do odczytu byłby paskiem, nie suwakiem. Obok suwaka czas bieżący i całkowity (mm:ss).
- **Status**: ✅

### A10: Pierwsza wersja bez playlist, ulubionych, wyszukiwania, equalizera i regulacji głośności w aplikacji
- **Category**: priorities
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "prosty odtwarzacz"
- **Rationale**: Zakres = wybór katalogu, lista, play/pauza/stop, poprzedni/następny, suwak. Głośność przyciskami systemowymi. Jeden katalog naraz (zmiana katalogu zastępuje listę).
- **Status**: ✅

### A11: Jeden ekran główny: lista utworów + dolny pasek odtwarzacza (tytuł, suwak, przyciski) + akcja "wybierz katalog" w nagłówku
- **Category**: architecture
- **Source**: none — brak makiet (telesma/spec/ux_ui/ pusty)
- **Rationale**: Najprostszy układ pokrywający wszystkie wymagania bez nawigacji między ekranami. Aktualnie grany utwór podświetlony na liście. Wygląd — pytanie Q6.
- **Status**: ✅

### A12: Interfejs w języku polskim; teksty zebrane w jednym pliku, bez pełnego mechanizmu i18n
- **Category**: requirements
- **Source**: none — spec po polsku, Language: pl w telesma/config.md
- **Rationale**: Odtwarzacz ma kilkanaście napisów; jeden plik z tekstami pozwala dodać angielski później bez przeróbek.
- **Status**: ❌
- **User comment**: ustaw domyślnie angielski

### A13: Motyw podąża za systemem (jasny/ciemny), domyślne komponenty platformy
- **Category**: technology
- **Source**: none — brak makiet
- **Rationale**: Brak tokenów projektowych; motyw systemowy to standard na obu platformach i nie wymaga decyzji projektowych.
- **Status**: ✅

### A14: Minimalne wersje: Android 10 (API 29) i iOS 15; telefon w orientacji pionowej, tablet bez osobnego układu
- **Category**: constraints
- **Source**: Aplikacja jest odtwarzaczem plików audio:2
- **Rationale**: API 29 wymusza Storage Access Framework (scoped storage) — i tak konieczny; iOS 15 pokrywa niemal wszystkie aktywne urządzenia. Orientacja pozioma dopuszczona, ale układ nie jest pod nią optymalizowany.
- **Status**: ✅

### A15: Stany brzegowe obsługiwane komunikatem w aplikacji: pusty katalog, brak uprawnień, plik usunięty lub nieczytelny
- **Category**: requirements
- **Source**: none — obsługa błędów nieopisana
- **Rationale**: Pusty katalog → ekran "brak utworów, wybierz inny katalog"; cofnięte uprawnienie → prośba o ponowny wybór; plik nie do odtworzenia → komunikat i przejście do następnego.
- **Status**: ✅

### A16: Uruchamianie i testy lokalnie — emulator Android i symulator iOS na tym Macu; publikacja w sklepach poza zakresem
- **Category**: constraints
- **Source**: none — brak sekcji o dystrybucji (TECHNICAL_GUIDELINES.md:35-42 puste)
- **Rationale**: Spec nie wspomina o dystrybucji. Plan kończy się na działającej aplikacji uruchamianej z repozytorium; konfiguracja kont deweloperskich, podpisywania i sklepów to osobne zlecenie.
- **Status**: ✅

### A17: Testy: jednostkowe logiki (lista, kolejka, formatowanie czasu) + testy komponentów + e2e na końcu każdej fazy z UI
- **Category**: technology
- **Source**: stack convention (telesma/guidelines/react-native.md, flutter.md)
- **Rationale**: Odtwarzanie audio nie da się sensownie testować jednostkowo — warstwa odtwarzacza za interfejsem (adapter), logika stanu odtwarzacza testowana z atrapą. Framework e2e — pytanie Q4.
- **Status**: ✅

## Questions

### Q1: Jaki stack mobilny: React Native (Expo, TypeScript), Flutter, czy natywnie (Kotlin + Swift)?
- **Category**: technology
- **Source**: none — TECHNICAL_GUIDELINES.md bez odstępstw, a wytyczne nie wskazują domyślnego frameworka mobilnego
- **Proposed answer**: React Native z Expo (managed workflow, New Architecture) + TypeScript — odtwarzanie przez `expo-audio`, wybór katalogu przez `expo-file-system` (SAF) i `expo-document-picker`, testy Jest + React Native Testing Library. Alternatywa: Flutter (`just_audio`, `file_picker`), gdy wolisz Darta. Natywnie — tylko gdy zależy Ci na pełnej kontroli nad sesją audio, kosztem dwóch kodów.
- **Answer**: 
- **Status**: ✅

### Q2: Czy odtwarzanie ma działać w tle (zablokowany ekran, inna aplikacja) ze sterowaniem z ekranu blokady / powiadomienia?
- **Category**: requirements
- **Source**: none — spec wymienia tylko akcje na ekranie aplikacji
- **Proposed answer**: Tak — odtwarzanie w tle w pierwszej wersji (bez tego muzyka urywa się po zgaszeniu ekranu, co dla odtwarzacza jest wadą dyskwalifikującą), a sterowanie z ekranu blokady (play/pauza/następny) jako osobna, ostatnia faza planu. Wymaga konfiguracji trybu audio w tle na iOS (`UIBackgroundModes: audio`) i usługi pierwszoplanowej na Androidzie.
- **Answer**: 
- **Status**: ✅

### Q3: Jak użytkownik "wybiera katalog" na iOS, gdzie system nie daje dostępu do dowolnych katalogów tak jak Android?
- **Category**: architecture
- **Source**: Aplikacja jest odtwarzaczem plików audio:1-2 — "wybrać katalog z utworami" + "Android i iOS"
- **Proposed answer**: Android — systemowy wybór katalogu (Storage Access Framework) z trwałym uprawnieniem. iOS — katalog aplikacji widoczny w aplikacji Pliki ("Na moim iPhonie / <nazwa>") dzięki `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`; użytkownik wrzuca tam pliki lub podkatalogi (Pliki, iTunes/Finder, AirDrop), a przycisk "wybierz katalog" pokazuje podkatalogi tego folderu. Dodatkowo import wielu plików przez systemowy picker. Alternatywa: natywny moduł z wyborem dowolnego folderu (security-scoped bookmarks) — więcej pracy, bardziej kruche.
- **Answer**: 
- **Status**: ✅

### Q4: Jaki framework e2e na urządzeniu: Detox czy Maestro?
- **Category**: technology
- **Source**: none — testy nieopisane; wytyczne mają plik detox.md, Maestro nie ma pliku wytycznych
- **Proposed answer**: Detox (ma wytyczne w telesma/guidelines/, działa z Expo przez dev build) — scenariusze: wybór katalogu z przygotowanymi plikami testowymi → lista → play/pauza/stop → przewijanie suwakiem → następny utwór. Alternatywa: Maestro (prostsza konfiguracja, YAML, bez wytycznych w Telesmie). Przy Flutterze (Q1) — wbudowany `integration_test`.
- **Answer**: 
- **Status**: ✅

### Q5: Czy w pierwszej wersji wystarczy sekwencyjne odtwarzanie listy, czy od razu tryby powtarzania (utwór/lista) i losowy?
- **Category**: priorities
- **Source**: Aplikacja jest odtwarzaczem plików audio:1 — "prosty odtwarzacz", lista akcji otwarta ("jak …")
- **Proposed answer**: Sekwencyjnie z poprzedni/następny (założenie A8), bez powtarzania i losowego — można dodać w późniejszej fazie jako dwa przełączniki, logika kolejki pisana tak, by to umożliwić.
- **Answer**: 
- **Status**: ✅

### Q6: Brak makiet — czy wystarczy prosty, domyślny wygląd platformy, czy masz referencję wizualną (inny odtwarzacz, szkic, kolory)?
- **Category**: requirements
- **Source**: none — telesma/spec/ux_ui/ pusty
- **Proposed answer**: Domyślny wygląd: lista z nazwą i czasem trwania, dolny pasek odtwarzacza z suwakiem i ikonami (poprzedni, play/pauza, stop, następny), motyw systemowy (A13). Jeśli masz referencję — wrzuć obraz lub plik do telesma/spec/ux_ui/ przed wygenerowaniem planu, a zadania UI dostaną tag makiety.
- **Answer**: 
- **Status**: ✅
