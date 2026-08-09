# Architektura

## Fundament

- React i TypeScript do interfejsu,
- Vite do środowiska developerskiego i budowania,
- Vitest, jsdom i Testing Library do testów jednostkowych i komponentowych,
- ESLint do statycznej kontroli kodu,
- GitHub Actions do powtarzalnej weryfikacji.

Workflow CI działa dla pushów do `main` i pull requestów kierowanych do `main`. Używa Node.js 22, instaluje zależności przez `npm ci`, a następnie wykonuje lint, testy jednostkowe i build.

## Kierunek rozwoju

Architektura pozostaje local-first. Warstwa widoku nie powinna zależeć bezpośrednio od mechanizmu trwałego zapisu. Przyszły dostęp do IndexedDB należy ukryć za małym, testowalnym interfejsem repozytorium. Tryb dziecka powinien mieć możliwie krótki krytyczny przepływ, mało zależności i bezpieczne zachowanie przy błędach.

## Model domenowy

Niezależny od Reacta i mechanizmu zapisu moduł domenowy opisuje hierarchię `CommunicationBook → Board → Symbol`. Książka zawiera tablice, a tablica uporządkowane symbole. Każda relacja ma również jawny identyfikator rodzica, co umożliwia późniejsze mapowanie do warstwy storage bez uzależniania domeny od IndexedDB.

Książka posiada `schemaVersion`, a bieżącą wersję określa stała `CURRENT_SCHEMA_VERSION`. `CommunicationBook.mainBoardId` jest jedynym źródłem prawdy o tablicy, od której rozpoczyna się korzystanie z książki; `Board` nie duplikuje tej informacji. Wartość może być `null`, a zmiana głównej tablicy zastępuje poprzedni identyfikator. Układ używa liczby kolumn i kolejności `position`, bez współrzędnych x/y. Obraz symbolu jest opcjonalną referencją z metadanymi, nie binarną zawartością ani kluczem konkretnej technologii zapisu.

## Testy E2E i dostępności

Projekt jest gotowy do dodania osobnego katalogu testów E2E oraz narzędzia automatycznej kontroli dostępności, gdy pojawi się pierwszy rzeczywisty przepływ. Nie dodajemy jeszcze ciężkiego środowiska przeglądarkowego bez testowanego scenariusza. Semantyczne zapytania Testing Library stanowią podstawę testów komponentowych.

## Warstwa widoku Board

`Board` jest lekkim komponentem prezentacyjnym zależnym od modelu domenowego, ale niezależnym od storage. Tryb, status zapisu i reakcje na działania są przekazywane przez props. Lokalny stan nazwy przygotowuje pole do przyszłego autosave, nie wykonując zapisu ani komunikacji sieciowej. Rozłączne renderowanie trybów zapobiega umieszczaniu kontrolek edycji w drzewie DOM trybu dziecka.

## Granice obecnego etapu

Brak trwałego zapisu, repozytorium danych, routingu, service workera, telemetrii i połączeń z backendem. Komponent `Board` jest podłączony do głównego ekranu wyłącznie jako lokalne demo developerskie ze sztucznymi danymi, a symbole nie mają jeszcze reprezentacji UI.
