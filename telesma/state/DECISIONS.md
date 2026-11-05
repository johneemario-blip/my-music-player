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

