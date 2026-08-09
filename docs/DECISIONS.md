# Decyzje techniczne

## 001 — React, TypeScript i Vite

**Status:** przyjęta

Lekki fundament z szybkim środowiskiem developerskim, statycznym typowaniem i szerokim wsparciem przeglądarek. Projekt nie dodaje frameworka serwerowego, ponieważ MVP jest local-first i nie wymaga backendu.

## 002 — Vitest, jsdom i Testing Library

**Status:** przyjęta

Test runner współdzieli konfigurację i sposób transformacji z Vite. Testing Library promuje testowanie przez zachowanie dostępne dla użytkownika.

## 003 — Brak narzędzia E2E na etapie pustego fundamentu

**Status:** zastąpiona po wprowadzeniu automatycznych testów a11y

Na etapie pustego fundamentu instalację przeglądarek odłożono. Decyzję zastąpiło późniejsze wymaganie stałych automatycznych skanów dostępności. Playwright i axe obsługują testy a11y, a osobne konfiguracje Playwright sprawdzają krytyczny przepływ produkcyjny oraz działanie PWA po odcięciu sieci.

## 004 — Node.js 22 w CI

**Status:** przyjęta

Używana jest aktywna linia LTS wspierana przez obecny zestaw narzędzi. Instalacja w CI korzysta z pliku blokady zależności.

## 005 — GitHub i GitHub Actions

**Status:** przyjęta

Kod będzie utrzymywany w GitHub, a automatyczne kontrole zapewnia GitHub Actions. `main` jest główną gałęzią; workflow działa dla pushów do `main` oraz pull requestów kierowanych do `main`. Większe zmiany mogą powstawać na gałęziach `feature/...`.

## 006 — Wersjonowany model domenowy niezależny od storage

**Status:** przyjęta

Model `CommunicationBook → Board → Symbol` jest czystym modułem TypeScript bez zależności od Reacta i IndexedDB. Agregaty przechowują elementy podrzędne oraz jawne identyfikatory relacji. `schemaVersion` znajduje się na książce, aby przyszłe migracje mogły rozpoznać format danych.

Tablice używają siatki określonej liczbą kolumn, a symbole pola `position`; model nie przewiduje współrzędnych x/y. Opcjonalne wartości serializowalne, takie jak `linkedBoardId`, obraz i indywidualny `dwellTime`, używają `null`. Fabryki zapewniają bezpieczne wartości domyślne, a helper efektywnego dwell time stosuje wartość symbolu przed wartością tablicy. `Symbol.label` jest jedynym źródłem podpisu i przyszłego tekstu mowy; model nie duplikuje tej treści w `speechText`.

`Board.name` może być pustym stringiem i fabryka zachowuje podaną wartość bez podstawiania tekstu zastępczego. Warstwa prezentacji pokazuje „Tablica bez tytułu” dla pustej lub składającej się wyłącznie z białych znaków nazwy, gdy wyświetla ją jako tekst.

## 007 — Główna tablica jako pojedyncza referencja książki

**Status:** przyjęta

`CommunicationBook.mainBoardId` jest jedynym źródłem prawdy o głównej tablicy komunikacyjnej. `Board` nie przechowuje flagi głównej tablicy. Stan ten wylicza się przez porównanie `board.id === communicationBook.mainBoardId`, dzięki czemu nie może powstać rozbieżność między dwiema trwałymi reprezentacjami. `mainBoardId` może być `null`, a ustawienie innej tablicy zastępuje wcześniejszą wartość.

## 008 — Lokalne przetwarzanie obrazów natywnymi API

**Status:** przyjęta

Walidacja, dekodowanie, skalowanie i kompresja obrazów symboli odbywają się wyłącznie w przeglądarce przy użyciu natywnych API, bez zewnętrznej biblioteki ani usługi. Model domenowy przechowuje tylko metadane `ImageReference`; zawartość binarna i tymczasowy URL podglądu pozostają poza domeną i na obecnym etapie istnieją wyłącznie w pamięci demo.

## 009 — Transformacje obrazu jako metadane

**Status:** przyjęta

Obrót i powiększenie obrazu są zapisane w `ImageReference` jako `rotation` oraz `scale`. Transformacje są stosowane prezentacyjnie i nie powodują ponownej kompresji ani modyfikacji binarnego obrazu. Domyślne wartości to odpowiednio `0` i `1`.

Dodanie trwałych pól transformacji podniosło `CURRENT_SCHEMA_VERSION` do `2`. Był to etap przed wprowadzeniem IndexedDB; obecne Repository zapisuje wyłącznie aktualną wersję schematu, a migracje starszych wersji nadal pozostają osobnym zadaniem.

Usunięcie zdublowanego pola `speechText` i przyjęcie `Symbol.label` jako jedynego źródła tekstu podniosło `CURRENT_SCHEMA_VERSION` do `3`. Decyzja poprzedzała implementację obecnego Repository IndexedDB.

## 010 — Lokalna mowa i lekki dwell

**Status:** przyjęta

Synteza mowy używa wyłącznie natywnego Web Speech API osłoniętego małym serwisem bez zależności zewnętrznych. `Symbol.label` pozostaje jedynym tekstem mówionym. Dwell jest alternatywną metodą aktywacji uruchamianą jawnie, korzysta z domenowego efektywnego czasu i lekkiej animacji CSS, a eyetracker jest traktowany jak wskaźnik. Stan ostatniej wypowiedzi i demonstracyjne przejścia nie są zapisywane.

## 011 — CommunicationBook jako jednostka biblioteki

**Status:** przyjęta

Home zarządza całymi `CommunicationBook`, które są również docelową jednostką importu i eksportu. Karty nie renderują pełnego Board, lecz lekkie, nieinteraktywne preview głównej tablicy. Do czasu dodania osobnego pola aktywności kolejność „Ostatnio używane” jest przybliżana przez `updatedAt`.

Nazwa książki może być pusta, aby tworzenie nie wymagało danych osobowych ani obowiązkowej treści. Warstwa prezentacji pokazuje wtedy „Książka bez tytułu” bez zapisywania fallbacku. Zmiana reguły podnosi `CURRENT_SCHEMA_VERSION` do `4`; przyszły import starszych danych wymaga jawnej migracji.

## 012 — Domyślne ustawienia Board kopiowane do nowych symboli

**Status:** przyjęta

Wartości `defaultBorderColor`, `defaultTextColor` i `defaultBorderWidth` są kopiowane do symbolu podczas jego tworzenia przez `createSymbolForBoard`. Istniejące symbole przechowują własne wartości i nie są masowo aktualizowane po zmianie defaults. `defaultDwellTime` nie jest kopiowany: symbol z `dwellTime = null` dziedziczy go dynamicznie przez `getEffectiveDwellTime`. Nazwa tablicy pozostaje edytowana inline, a `mainBoardId` jest zarządzane wyłącznie na poziomie CommunicationBook.

## 013 — CommunicationBook jako wersjonowana jednostka backupu

**Status:** przyjęta

Plik `.aacbook` jest JSON-ową kopią całej książki, łącznie z tablicami, symbolami, relacjami i obrazami. Base64 występuje wyłącznie na granicy pliku; primary storage nadal przechowuje `Blob`. Import waliduje cały graf przed transakcją Repository, odrzuca dangling links oraz nowsze i nieobsługiwane wersje. Konflikty ID są remapowane bez nadpisywania lokalnych danych. Pojedynczy Board nie jest główną jednostką eksportu MVP.

## 014 — Syntetyczne fixtures tylko dla developmentu

**Status:** przyjęta

Realistyczne książki demo są odseparowanym modułem, nie zmieniają domeny i nie otrzymują pola `isDemo`. Są ładowane wyłącznie jawną akcją w development build i zapisują się przez normalne Repository. Stabilny manifest ID zapewnia idempotentność i bezpieczny cleanup oryginałów. Zaimportowana kopia z innym ID nie jest usuwana. Grafiki PNG są lokalnie generowanymi `synthetic demo assets`, nie profesjonalnymi symbolami AAC.

## 015 — App shell PWA oddzielony od danych użytkownika

**Status:** przyjęta

Service worker jest generowany podczas produkcyjnego buildu bez dodatkowej zależności runtime. Precache obejmuje wyłącznie własny app shell; książki i obrazy pozostają w IndexedDB i nie są kopiowane do Cache Storage. Cache ma własny, wersjonowany prefiks, a cleanup nie dotyka obcych cache’y ani bazy danych.

Aktualizacja nie używa automatycznego `skipWaiting`. Oczekująca wersja jest aktywowana dopiero po jawnej akcji użytkownika i udanym opróżnieniu kolejki lokalnych zapisów. Błąd zapisu zatrzymuje aktualizację i reload. Development nie rejestruje service workera, aby zachować przewidywalny hot reload. Instalacja korzysta z natywnego mechanizmu przeglądarki; dedykowany prompt instalacji pozostaje poza zakresem PWA v1.
