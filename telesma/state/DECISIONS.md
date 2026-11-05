# DECISIONS.md — Changelog of agreements from interactive mode

<!--
This file is created and filled in automatically by Claude in interactive mode
(after TELESMA COMPLETE / TELESMA BLOCKED, when the user drives the conversation by hand).

Every user↔Claude exchange in that mode = one entry below.
Entry format (section 10 of the instructions):

## YYYY-MM-DD HH:MM — [short topic]
**Kind**: bug | correction | feature | question | operations
**Bug source**: [only for a bug: task X.Y that built it | unknown]
**Detected by**: [only for a bug: test | scenario | review | telesma | owner | production]
**Question/context**: [paraphrase of what the user asked, 1-2 sentences]
**Outcome**: [essence of the decision/explanation, 2-4 sentences, no code]
**Impact** (optional): [task X.Y / file / phase]

The file is WRITE-ONLY — Telesma does not read it in any other process.
It is a changelog for humans, to remember "what we agreed on and why along the way".
-->

## 2026-11-05 13:01 — Build e2e Androida bez minifikacji
**Kind**: operations
**Question/context**: Detox na Androidzie padał, bo R8 w buildzie release usuwał klasy Kotlina używane przez kod testowy; trzy próby z regułami keep nie wystarczyły. Właściciel wybrał wariant rekomendowany.
**Outcome**: Uzgodniliśmy, że build e2e Androida (`detox build -c android.emu.*`) idzie z `-Pandroid.enableMinifyInReleaseBuilds=false`, a produkcyjny build release zostaje z R8 bez dodatkowych reguł keep (reguły z prób wycofane). Konsekwencja: e2e nie wykrywa błędów wprowadzonych przez samo R8. Odrzucone: `-keep kotlin.**` w produkcji (większy APK) i e2e na debug (wymaga Metro).
**Impact**: Task 1.4, `.detoxrc.js`, `plugins/withDetox.js`, `app.json`

## 2026-11-05 13:10 — Wydanie wersji v0.1.0
**Kind**: operations
**Question/context**: Po zielonej regresji fazy 1 zaproponowałem pierwszą wersję; właściciel odpowiedział „tak”.
**Outcome**: Uzgodniliśmy wydanie v0.1.0 — szkielet aplikacji startujący na iOS i Androidzie z ekranem głównym, rozpoznawaniem plików audio i zapamiętywaniem katalogu. Scenariusze ręczne w `docs/test-scenarios/v0.1.0.md`; wypchnięcie tagu należy do właściciela.
**Impact**: faza 1, tag `v0.1.0`

## 2026-11-05 13:41 — E2E w trakcie pracy: obie platformy
**Kind**: question
**Question/context**: Właściciel zapytał, czy w trakcie pracy uruchamiać e2e tylko na iOS, a na wszystkich platformach dopiero na końcu; zmieniałoby to decyzję z 2026-11-05 o Detox na iOS + Android.
**Outcome**: Decyzja z 2026-11-05 stands — każde zadanie e2e (2.5, 3.4, 4.2, 5.2) idzie na iOS i Androidzie przed ✅. Argument przeważający: błędy specyficzne dla Androida (usługa pierwszoplanowa w fazie 4, powiadomienie medialne w fazie 5) wychodziłyby dopiero w 6.3.
**Impact**: zadania e2e faz 2–5 bez zmian

## 2026-11-05 15:05 — Wydanie wersji v0.2.0
**Kind**: operations
**Question/context**: Po zielonej regresji fazy 3 zaproponowałem v0.2.0 (fazy 2–3); właściciel odpowiedział „tak”.
**Outcome**: Uzgodniliśmy wydanie v0.2.0 — wybór folderu z muzyką na obu platformach, lista z czasami trwania i odtwarzanie z paskiem sterowania (bez odtwarzania w tle). Scenariusze ręczne w `docs/test-scenarios/v0.2.0.md`; wypchnięcie tagu należy do właściciela.
**Impact**: fazy 2–3, tag `v0.2.0`

## 2026-11-05 15:47 — Ekran blokady bez następny/poprzedni w v1
**Kind**: correction
**Question/context**: W 5.1 wyszło, że expo-audio obsługuje następny/poprzedni z ekranu blokady tylko dla natywnej `AudioPlaylist`; zapytałem o wybór: (a) bez tych przycisków w v1, (b) przejście na `AudioPlaylist`, (c) react-native-track-player. Właściciel wybrał (a).
**Outcome**: Uzgodniliśmy, że w v1 ekran blokady i powiadomienie medialne mają tylko play/pauzę i tytuł utworu; następny/poprzedni działają w aplikacji. Przyciski skoku na ekranie blokady trafiają do BACKLOG (P2). Odrzucone na teraz: (b) — przepisanie kolejki z 3.1–3.2 i ryzyko regresji pomijania nieczytelnych plików na iOS; (c) — nowa natywna zależność o niepewnej zgodności z New Architecture. Warunek powrotu: element BACKLOG „Następny/poprzedni na ekranie blokady”.
**Impact**: Task 5.1, 5.2, 5.3; `src/services/audio/expoPlayerAdapter.ts`

## 2026-11-05 17:28 — Wynik testu ręcznego 5.3 na Androidzie
**Kind**: operations
**Question/context**: Właściciel zgłosił, że na fizycznym telefonie z Androidem wszystko działa (test ręczny ekranu blokady i powiadomienia medialnego).
**Outcome**: Wynik dla Androida zapisany w REPORT.md. Zadanie 5.3 pozostaje otwarte do czasu testu na fizycznym iPhonie. No decision — awaits: wynik testu na iPhonie, decyzja o niezacommitowanej zmianie `tsconfig.json` oraz odpowiedź na propozycję wydania v0.3.0.
**Impact**: Task 5.3

## 2026-11-05 17:35 — Zamknięcie 5.3 bez fizycznego iPhone'a
**Kind**: operations
**Question/context**: Właściciel nie może teraz sprawdzić iPhone'a; poprosił o działanie zgodnie z rekomendacją i dokończenie projektu.
**Outcome**: Uzgodniliśmy zamknięcie 5.3 z adnotacją „iOS sprawdzony tylko na symulatorze (e2e)”; projekt zakończony, powstał `docs/RUNBOOK.md`. Wersja v0.3.0 nie została utworzona, zgodnie z rekomendacją czekania na test na iPhonie. No decision — awaits: czy zacommitować, czy cofnąć zmianę `tsconfig.json`, której Telesma nie zrobiła (zostawiona bez zmian).
**Impact**: Task 5.3, docs/RUNBOOK.md

## 2026-11-05 22:20 — Commit tsconfig i APK do instalacji
**Kind**: operations
**Question/context**: Właściciel kazał zacommitować zmianę `tsconfig.json` i zapytał, czy APK w `release/` nadaje się do zainstalowania.
**Outcome**: Zmiana `tsconfig.json` zacommitowana (1b5b5b8). Stary APK w `release/` był buildem e2e (dźwięki testowe zamiast biblioteki, tylko arm64), więc nie nadawał się do instalacji. Zbudowany zwykły APK release (`./gradlew :app:assembleRelease` bez `EXPO_PUBLIC_E2E`, wszystkie ABI, podpisany kluczem debug). Ma w sobie 3 krótkie pliki testowe (~110 KB) przez statyczny import `e2eLibrarySource`, ale nie są używane w działaniu aplikacji.
**Impact**: android/app/build/outputs/apk/release/app-release.apk

## 2026-11-05 22:35 — APK release nadal w trybie e2e
**Kind**: bug
**Bug source**: unknown
**Detected by**: owner
**Question/context**: Po instalacji APK z poprzedniego wpisu „Choose folder” pokazywał tylko foldery testowe Fixtures/Long/Empty.
**Outcome**: Przyczyna: `EXPO_PUBLIC_E2E` jest wkompilowane w paczkę JS, a Gradle nie śledzi tej zmiennej, więc `assembleRelease` użył paczki z buildu e2e (16:26). Naprawa: usunięcie `android/app/build/generated/assets` i `sourcemaps` oraz `createBundleReleaseJsAndAssets --rerun`. Na emulatorze sprawdzone, że „Choose folder” otwiera systemowy wybór folderu. Procedura i ostrzeżenie dopisane do `docs/RUNBOOK.md` oraz do Known problems w PROJECT_CONTEXT. Wcześniej sprawdziłem tylko zawartość pliku APK, a nie zachowanie aplikacji, i to był mój błąd.
**Impact**: docs/RUNBOOK.md, android/app/build/outputs/apk/release/app-release.apk

