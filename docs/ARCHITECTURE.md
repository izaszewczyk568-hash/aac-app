# Architektura

## Fundament

- React i TypeScript do interfejsu,
- Vite do środowiska developerskiego i budowania,
- Vitest, jsdom i Testing Library do testów jednostkowych i komponentowych,
- Playwright i `@axe-core/playwright` do automatycznych skanów dostępności w Chromium,
- generowany podczas buildu service worker i Web App Manifest do PWA,
- ESLint do statycznej kontroli kodu,
- GitHub Actions do powtarzalnej weryfikacji.

Workflow CI działa dla pushów do `main` i pull requestów kierowanych do `main`. Używa Node.js 22, instaluje zależności przez `npm ci`, instaluje Chromium dla Playwright, a następnie wykonuje lint, testy jednostkowe i komponentowe, automatyczne testy dostępności, build oraz produkcyjny test PWA offline.

## Kierunek rozwoju

Warstwa widoku utrzymuje obecnie prosty stan ekranów `Home → CommunicationBook → Board` bez biblioteki routingu. `Home` otrzymuje książki i callbacki, nie zależy od storage. Miniatury kart są lekką prezentacją danych głównej tablicy i celowo nie używają interaktywnego komponentu `Board`. Książki w preview są sortowane malejąco po `updatedAt`; jest to tymczasowe przybliżenie ostatniego użycia, ponieważ model nie posiada osobnego pola aktywności.

Architektura pozostaje local-first. Natywny IndexedDB jest ukryty za małym interfejsem `CommunicationBookRepository`, a pamięciowa implementacja pozwala testować te same operacje bez przeglądarkowego storage. Książka i jej obrazy są zapisywane wspólną transakcją. Warstwa widoku korzysta z repozytorium zamiast bezpośrednio wywoływać IndexedDB.

## PWA i granice cache

Build Vite generuje wersjonowany `sw.js`, który precache’uje wyłącznie app shell tego samego originu: HTML, lokalny JavaScript, CSS, manifest i ikonę. Nawigacja używa strategii network-first z fallbackiem do lokalnego `index.html`, a znane statyczne zasoby są odczytywane cache-first. Service worker nie przechwytuje metod innych niż GET, obcych originów ani nieznanych żądań aplikacji. Książki, obrazy użytkownika, pliki `.aacbook` i adresy `blob:` nie trafiają do Cache Storage; ich jedynym primary storage pozostaje IndexedDB.

Rejestracja service workera działa tylko w produkcyjnym buildzie, aby development nie korzystał ze starego kodu. Nowa wersja czeka na decyzję użytkownika. Akcja „Zaktualizuj teraz” najpierw opróżnia kolejkę lokalnych zapisów, potem wysyła `SKIP_WAITING` do oczekującego workera i przeładowuje stronę dopiero po przejęciu kontroli. Błąd zapisu zatrzymuje aktualizację i pozostawia dane oraz bieżącą wersję bez wymuszonego reloadu. `AutosaveCoordinator` odpowiada za debounce zapisów i wspólny punkt `flush`; nie zmienia schematu IndexedDB ani nie usuwa bazy podczas aktualizacji.

## Model domenowy

Niezależny od Reacta i mechanizmu zapisu moduł domenowy opisuje hierarchię `CommunicationBook → Board → Symbol`. Książka zawiera tablice, a tablica uporządkowane symbole. Każda relacja ma również jawny identyfikator rodzica, co umożliwia późniejsze mapowanie do warstwy storage bez uzależniania domeny od IndexedDB.

Książka posiada `schemaVersion`, a bieżącą wersję określa stała `CURRENT_SCHEMA_VERSION`. `CommunicationBook.mainBoardId` jest jedynym źródłem prawdy o tablicy, od której rozpoczyna się korzystanie z książki; `Board` nie duplikuje tej informacji. Wartość może być `null`, a zmiana głównej tablicy zastępuje poprzedni identyfikator. Układ używa liczby kolumn i kolejności `position`, bez współrzędnych x/y. Obraz symbolu jest opcjonalną referencją z metadanymi, nie binarną zawartością ani kluczem konkretnej technologii zapisu. `Symbol.label` może być pusty; model zachowuje tę wartość bez tworzenia nazwy z pliku lub fallbacku.

`ImageReference.rotation` i `ImageReference.scale` przechowują lekkie transformacje prezentacyjne. Obrót ma kroki 90°, a skala bazową wartość `1`; zmiany nie modyfikują pliku ani gridu i nie uruchamiają ponownej kompresji.

## Testy przeglądarkowe i dostępności

Playwright uruchamia developerskie preview w Chromium, a `@axe-core/playwright` sprawdza wymagane stany `Board` i `SymbolTile`. Osobna konfiguracja produkcyjna testuje krytyczny przepływ `CommunicationBook → Board → Symbol → use → reload`, a zestaw PWA powtarza zapisany przepływ po odcięciu sieci. Narzędzia pozostają wyłącznie w `devDependencies`, więc nie trafiają do produkcyjnego bundle. Semantyczne zapytania Testing Library nadal stanowią podstawę testów komponentowych, a manualna weryfikacja dostępności pozostaje obowiązkowa.

## Warstwa widoku Board

`Board` jest lekkim komponentem prezentacyjnym zależnym od modelu domenowego, ale niezależnym od storage. Tryb, status zapisu i reakcje na działania są przekazywane przez props. Lokalny stan nazwy przygotowuje pole do przyszłego autosave, nie wykonując zapisu ani komunikacji sieciowej. Rozłączne renderowanie trybów zapobiega umieszczaniu kontrolek edycji w drzewie DOM trybu dziecka.

`BoardSettings` przekazuje częściowe zmiany aktualnej tablicy do właściciela stanu. Domenowy `createSymbolForBoard` tworzy symbol z kopią bieżących wartości domyślnych Board; dzięki temu późniejsze zmiany defaults nie wpływają wstecznie na istniejące symbole. Nie dodano zależności od Reacta do modelu ani trwałego zapisu.

## Lokalne przetwarzanie obrazów

Moduł `features/images/processImage` jest niezależny od JSX i storage. Waliduje pliki JPEG, PNG i WebP do 10 MB, dekoduje je natywnym API przeglądarki, skaluje dłuższy bok do maksymalnie 512 px oraz koduje zoptymalizowaną kopię, preferując WebP. Gdy pierwszy wynik przekracza 500 KB, wykonywana jest druga próba z niższą jakością. Do modelu trafiają wyłącznie metadane `ImageReference`; binarny `Blob` jest przechowywany osobno w Repository, a tymczasowy URL pozostaje wyłącznie reprezentacją widoku.

`SymbolInspector` otrzymuje wybrany symbol i callback zmian od rodzica. Dzięki temu selection oraz edycja pozostają pojedynczym źródłem prawdy w stanie demo, a komponent nie zależy od IndexedDB ani nie duplikuje danych obrazu.

Mały moduł `features/speech/speechService` izoluje natywne Web Speech API od JSX i bezpiecznie obsługuje brak wsparcia oraz błędy. Tekst nie jest wysyłany do zewnętrznego API. `SymbolTile` realizuje dwell lekką animacją CSS zamiast aktualizować stan całego Board na każdej klatce; efektywny czas pochodzi z domenowego `getEffectiveDwellTime`. Koordynacja mowy, ostatniego komunikatu i demonstracyjnego linkowania pozostaje w stanie `App`.

## Import, eksport i fixtures

Moduł `features/bookTransfer` buduje i waliduje wersjonowany plik `.aacbook`. Zawiera on cały agregat `CommunicationBook` i dane obrazów zakodowane base64 wyłącznie na granicy pliku. Import traktuje zawartość jako niezaufaną, sprawdza graf relacji przed zapisem i remapuje kolidujące ID książki, tablic, symboli oraz obrazów. Uszkodzone linki są odrzucane, a nowsza wersja schematu nie jest zgadywana. Starsze wersje pozostają nieobsługiwane do czasu powstania jawnych migracji.

`demo/communicationBookFixtures` jest odseparowany od domeny i usuwany z produkcyjnego buildu przez warunek `import.meta.env.DEV`. Seed i cleanup używają normalnego Repository. Stabilny manifest ID umożliwia idempotentny seed i usuwanie tylko oryginalnych fixtures; kopia zaimportowana z remapowanym ID jest traktowana jak zwykła książka. Syntetyczne obrazy PNG powstają lokalnie przez Canvas dopiero podczas seedowania.

## Granice obecnego etapu

Brak migracji starszych schematów, docelowego routingu URL, telemetrii i połączeń z backendem. Edycje tablicy i symboli podłączone do zapisanej książki są zapisywane z debounce do Repository, natomiast nie każda przyszła operacja produktu ma już docelową politykę autosave. PWA v1 zapewnia app shell offline i kontrolowaną aktualizację, ale instalacja zależy od natywnego mechanizmu oraz kryteriów obsługiwanej przeglądarki.
