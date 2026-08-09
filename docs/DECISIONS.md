# Decyzje techniczne

## 001 — React, TypeScript i Vite

**Status:** przyjęta. Lekki frontend bez frameworka serwerowego odpowiada local-first MVP.

## 002 — Testy i automatyczna dostępność

**Status:** przyjęta. Vitest, jsdom i Testing Library testują logikę/komponenty. Playwright i axe obsługują skany a11y, E2E oraz PWA; automaty nie zastępują kontroli manualnych.

## 003 — GitHub Actions i Node.js 22

**Status:** przyjęta. CI działa dla push i pull request do `main`, instaluje z lockfile i wykonuje wszystkie stałe kontrole projektu.

## 004 — Wersjonowana domena niezależna od storage

**Status:** przyjęta. `CommunicationBook → Board → Symbol` jest czystym TypeScript. `mainBoardId` jest jedynym źródłem głównej tablicy; grid używa `columns` i `position`. Opcjonalne dane serializowalne używają `null`. `Symbol.label` jest jedynym źródłem podpisu i mowy.

## 005 — Lokalny storage, obrazy i mowa

**Status:** przyjęta. Repository izoluje IndexedDB. Obrazy są przetwarzane natywnie i przechowywane jako Blob, Web Speech API pozostaje lokalne, a dwell korzysta z lekkiej animacji CSS.

## 006 — CommunicationBook jako jednostka biblioteki i backupu

**Status:** przyjęta. Jedna `CommunicationBook` jest kartą Home oraz jednostką `.aacbook`. Nazwa może być pusta, a fallback nie trafia do modelu. Import waliduje dane i remapuje kolidujące ID bez nadpisywania lokalnych danych.

## 007 — Terminologia user-facing „Księga”

**Status:** przyjęta. Całe polskie copy używa „Księga” z poprawną odmianą. Techniczne nazwy `CommunicationBook`, typy, nazwy stores i format `.aacbook` pozostają bez zmian.

## 008 — Jedna runtime miniatura PNG karty

**Status:** przyjęta. Karta wybiera pierwszy dostępny obraz symbolu głównej tablicy według `position`, tworzy lokalny PNG w runtime i pokazuje go przez zwalniany object URL. Źródłowy Blob nie jest modyfikowany, a PNG nie jest zapisywany w IndexedDB.

## 009 — Reguły wejścia do Board

**Status:** przyjęta. Istniejąca Board otwiera się domyślnie w `use`, nowa w `edit`. `use` zawiera jawny przycisk „Edytuj tablicę” bez PIN/caregiver locka w MVP. Undo/Redo usunięto, ponieważ nie mają implementacji.

## 010 — Cross-book linking przez globalne Board ID

**Status:** przyjęta. Board ID tworzone przez `crypto.randomUUID` są globalnie unikalne, a import remapuje konflikty względem wszystkich lokalnych ksiąg. `linkedBoardId` wystarcza; nie dodano `linkedBookId` ani zmiany `schemaVersion`. Relacje nie opierają się na nazwach.

Select Inspectora pokazuje wszystkie inne lokalne Boards jako „Tablica — Księga”. Utworzenie nowej tablicy z Inspectora dodaje ją do aktualnej księgi i natychmiast przypisuje `selectedSymbol.linkedBoardId`.

## 011 — Historia i główna tablica w nawigacji cross-book

**Status:** przyjęta. Historia przechowuje `{bookId, boardId}`, więc `Wróć` odtwarza oba konteksty. Po przejściu aktualną księgą staje się księga docelowa; „Tablica główna” korzysta z jej `mainBoardId`.

## 012 — Granica eksportu przy cross-book links

**Status:** przyjęta. Eksport jednej księgi nie dołącza automatycznie innych ksiąg. `linkedBoardId` pozostaje w pliku. Import dopuszcza brak zewnętrznego targetu; symbol i mowa działają, a nawigacja pokazuje bezpieczny komunikat o niedostępnym połączeniu bez crasha.

## 013 — Fixtures i PWA oddzielone od danych użytkownika

**Status:** przyjęta. Fixtures są syntetyczne i uruchamiane tylko jawnie w development build. Service worker cache’uje wyłącznie app shell; IndexedDB, obrazy, `.aacbook` i adresy `blob:` nie trafiają do Cache Storage.
