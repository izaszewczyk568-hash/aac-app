# Architektura

## Fundament

- React i TypeScript do interfejsu,
- Vite do środowiska developerskiego i budowania,
- Vitest, jsdom i Testing Library do testów jednostkowych i komponentowych,
- Playwright i `@axe-core/playwright` do automatycznych skanów dostępności w Chromium,
- ESLint do statycznej kontroli kodu,
- GitHub Actions do powtarzalnej weryfikacji.

Workflow CI działa dla pushów do `main` i pull requestów kierowanych do `main`. Używa Node.js 22, instaluje zależności przez `npm ci`, instaluje Chromium dla Playwright, a następnie wykonuje lint, testy jednostkowe i komponentowe, automatyczne testy dostępności oraz build.

## Kierunek rozwoju

Architektura pozostaje local-first. Warstwa widoku nie powinna zależeć bezpośrednio od mechanizmu trwałego zapisu. Przyszły dostęp do IndexedDB należy ukryć za małym, testowalnym interfejsem repozytorium. Tryb dziecka powinien mieć możliwie krótki krytyczny przepływ, mało zależności i bezpieczne zachowanie przy błędach.

## Model domenowy

Niezależny od Reacta i mechanizmu zapisu moduł domenowy opisuje hierarchię `CommunicationBook → Board → Symbol`. Książka zawiera tablice, a tablica uporządkowane symbole. Każda relacja ma również jawny identyfikator rodzica, co umożliwia późniejsze mapowanie do warstwy storage bez uzależniania domeny od IndexedDB.

Książka posiada `schemaVersion`, a bieżącą wersję określa stała `CURRENT_SCHEMA_VERSION`. `CommunicationBook.mainBoardId` jest jedynym źródłem prawdy o tablicy, od której rozpoczyna się korzystanie z książki; `Board` nie duplikuje tej informacji. Wartość może być `null`, a zmiana głównej tablicy zastępuje poprzedni identyfikator. Układ używa liczby kolumn i kolejności `position`, bez współrzędnych x/y. Obraz symbolu jest opcjonalną referencją z metadanymi, nie binarną zawartością ani kluczem konkretnej technologii zapisu. `Symbol.label` może być pusty; model zachowuje tę wartość bez tworzenia nazwy z pliku lub fallbacku.

`ImageReference.rotation` i `ImageReference.scale` przechowują lekkie transformacje prezentacyjne. Obrót ma kroki 90°, a skala bazową wartość `1`; zmiany nie modyfikują pliku ani gridu i nie uruchamiają ponownej kompresji.

## Testy przeglądarkowe i dostępności

Playwright uruchamia developerskie preview w Chromium, a `@axe-core/playwright` sprawdza wymagane stany `Board` i `SymbolTile`. Konfiguracja jest celowym wyjątkiem od minimalnej liczby zależności i pozostaje wyłącznie w `devDependencies`, więc nie trafia do produkcyjnego bundle. Obecne testy przeglądarkowe służą automatycznej kontroli a11y; właściwe scenariusze E2E produktu nie są jeszcze zaimplementowane. Semantyczne zapytania Testing Library nadal stanowią podstawę testów komponentowych, a manualna weryfikacja dostępności pozostaje obowiązkowa.

## Warstwa widoku Board

`Board` jest lekkim komponentem prezentacyjnym zależnym od modelu domenowego, ale niezależnym od storage. Tryb, status zapisu i reakcje na działania są przekazywane przez props. Lokalny stan nazwy przygotowuje pole do przyszłego autosave, nie wykonując zapisu ani komunikacji sieciowej. Rozłączne renderowanie trybów zapobiega umieszczaniu kontrolek edycji w drzewie DOM trybu dziecka.

## Lokalne przetwarzanie obrazów

Moduł `features/images/processImage` jest niezależny od JSX i storage. Waliduje pliki JPEG, PNG i WebP do 10 MB, dekoduje je natywnym API przeglądarki, skaluje dłuższy bok do maksymalnie 512 px oraz koduje zoptymalizowaną kopię, preferując WebP. Gdy pierwszy wynik przekracza 500 KB, wykonywana jest druga próba z niższą jakością. Do modelu trafiają wyłącznie metadane `ImageReference`; `Blob` i jego tymczasowy URL pozostają w stanie demonstracyjnym i są zwalniane po zakończeniu sesji widoku.

`SymbolInspector` otrzymuje wybrany symbol i callback zmian od rodzica. Dzięki temu selection oraz edycja pozostają pojedynczym źródłem prawdy w stanie demo, a komponent nie zależy od IndexedDB ani nie duplikuje danych obrazu.

## Granice obecnego etapu

Brak trwałego zapisu, repozytorium danych, routingu, service workera, telemetrii i połączeń z backendem. Komponenty `Board`, `SymbolTile` i `SymbolInspector` są podłączone do głównego ekranu wyłącznie jako lokalne demo developerskie; obrazy, symbole i ich ustawienia znikają po odświeżeniu strony.
