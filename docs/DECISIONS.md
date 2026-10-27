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

**Status:** przyjęta. Opcjonalny `CommunicationBook.coverSymbolId` wskazuje symbol należący do tej samej księgi, a opcjonalny `CommunicationBook.coverImage` opisuje bezpośredni obraz dodany podczas tworzenia. Karta wybiera kolejno obraz wskazanego symbolu, bezpośrednią okładkę i pierwszy dostępny obraz symbolu głównej tablicy według `position`. Następnie tworzy lokalny PNG w runtime i pokazuje go przez zwalniany object URL. Źródłowy Blob nie jest modyfikowany, a PNG nie jest zapisywany w IndexedDB. Bezpośrednia okładka należy do agregatu, więc jest zapisywana, eksportowana, importowana i usuwana razem z księgą. Brak pola w starszych danych jest równoważny `null` i nie wymaga zmiany `schemaVersion = 4`.

## 009 — Reguły wejścia do Board

**Status:** przyjęta. Istniejąca Board otwiera się domyślnie w `use`, nowa w `edit`. `use` zawiera jawny przycisk „Edytuj tablicę” bez PIN/caregiver locka w MVP. Undo/Redo usunięto, ponieważ nie mają implementacji.

## 010 — Cross-book linking przez globalne Board ID

**Status:** przyjęta. Board ID tworzone przez `crypto.randomUUID` są globalnie unikalne, a import remapuje konflikty względem wszystkich lokalnych ksiąg. `linkedBoardId` wystarcza; nie dodano `linkedBookId` ani zmiany `schemaVersion`. Relacje nie opierają się na nazwach.

Select Inspectora pokazuje wszystkie inne lokalne Boards jako „Tablica — Księga”. Utworzenie nowej tablicy z Inspectora dodaje ją do aktualnej księgi i natychmiast przypisuje `selectedSymbol.linkedBoardId`.

## 011 — Historia i główna tablica w nawigacji cross-book

**Status:** przyjęta. Historia przechowuje `{bookId, boardId}`, więc `Wróć` odtwarza oba konteksty. Po przejściu aktualną księgą staje się księga docelowa; „Tablica główna” korzysta z jej `mainBoardId`. W trybie `use` przycisk „Wróć” korzysta również z aktywacji dwell, ale zwykłe kliknięcie ma pierwszeństwo i wykonuje akcję od razu.

## 012 — Granica eksportu przy cross-book links

**Status:** przyjęta. Eksport jednej księgi nie dołącza automatycznie innych ksiąg. `linkedBoardId` pozostaje w pliku. Import dopuszcza brak zewnętrznego targetu; symbol i mowa działają, a nawigacja pokazuje bezpieczny komunikat o niedostępnym połączeniu bez crasha.

## 013 — Fixtures i PWA oddzielone od danych użytkownika

**Status:** przyjęta. Fixtures są syntetyczne i uruchamiane tylko jawnie w development build. Service worker cache’uje wyłącznie app shell; IndexedDB, obrazy, `.aacbook` i adresy `blob:` nie trafiają do Cache Storage.

## 014 — Estetyka shadcn-vue bez migracji frameworka

**Status:** przyjęta. Aplikacja pozostaje w React. Estetykę presetu shadcn-vue `a28C8pg8` odwzorowano przez istniejące CSS i tokeny: styl Nova, bazę Olive, akcent Teal, kompaktowe kontrolki, spokojne powierzchnie i standardowe zaokrąglenie. Typografia Inter jest bundlowana lokalnie przez `@fontsource-variable/inter`, a zgodna z presetem rodzina Stroke Rounded pochodzi z oficjalnych pakietów `@hugeicons/react` i `@hugeicons/core-free-icons`. Nie dodano Vue ani Tailwinda. Zasoby nie wymagają połączeń z zewnętrznym CDN, a Teal pozostaje przyciemniony dla czytelnego kontrastu tekstu i kontrolek.

## 015 — Home jako biblioteka i punkt wejścia dziecka

**Status:** przyjęta. Home zawsze pokazuje jedną sekcję wszystkich lokalnych ksiąg zamiast warunkowego „Ostatnio używane” i osobnej, zduplikowanej karty importu. Duża okładka jest główną kontrolką wyboru i prowadzi do listy tablic księgi; wspiera kliknięcie, klawiaturę i dwell. Zarządzanie księgą pozostaje w osobnym menu.

## 016 — Jawna hierarchia wyboru księga → tablica → symbol

**Status:** przyjęta. Dziecko przechodzi przez trzy jawne, wybieralne poziomy: okładkę księgi, okładkę tablicy i symbol. `Board.coverSymbolId` może wskazać wyłącznie symbol należący do tej tablicy. Brak ustawienia oznacza automatyczny wybór pierwszego obrazowego symbolu według `position`. Pole jest opcjonalnym i wstecznie zgodnym rozszerzeniem schematu 4; import danych bez niego zapisuje `null`. Usunięcie symbolu będącego okładką czyści nieaktualne odwołanie. Okładki księgi i tablicy są dużymi natywnymi przyciskami obsługującymi kliknięcie, klawiaturę i dwell. Po każdej nawigacji krótki cooldown dwell zapobiega kaskadowej aktywacji kontrolki, która pojawi się pod nieruchomym wskaźnikiem.

## 017 — Jedna pełnoekranowa sesja dziecka i mowa na każdym poziomie

**Status:** przyjęta. Wybranie księgi, tablicy lub symbolu przekazuje jego prezentowaną nazwę do tej samej lokalnej usługi Web Speech API. Pełnoekranowy tryb dziecka jest uruchamiany na stabilnym korzeniu `App`, a nie na pojedynczym widoku, dlatego nie kończy się przy przejściu `Home → CommunicationBook → Board`. Funkcje tworzenia, edycji i menu opiekuna są w tej sesji ukryte. Escape lub widoczny przycisk X kończą pełny ekran. Rozwiązanie używa natywnego Fullscreen API i nie dodaje zależności ani transmisji danych.
