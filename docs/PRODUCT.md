# Produkt

## Cel i użytkownicy

Aplikacja AAC pomaga dzieciom z trudnościami w komunikacji werbalnej wyrażać potrzeby, wybory i emocje za pomocą symboli oraz lokalnej syntezy mowy. Terapeuta, rodzic lub opiekun przygotowuje księgi, tablice i symbole; dziecko korzysta z trybu `use`.

## Założenia MVP

Produkt jest aplikacją webową, local-first i nie wymaga konta. Dane pozostają lokalnie w przeglądarce. Priorytetami są dostępność, niezawodność, prostota, prywatność i wydajność na słabszych urządzeniach.

## Zaimplementowany zakres

Model `CommunicationBook → Board → Symbol` jest wersjonowany. `mainBoardId` wskazuje jedyną główną tablicę księgi. Tablice używają gridu, symbole kolejności `position`, a `linkedBoardId` może wskazać globalnie unikalną tablicę w tej samej lub innej lokalnej księdze.

Home zarządza całymi księgami. Pozwala je tworzyć bez wymaganej nazwy, otwierać, zmieniać nazwę, usuwać oraz lokalnie importować i eksportować. Prezentacyjny fallback pustej nazwy to „Księga bez tytułu”. Karta używa tymczasowej miniatury PNG pierwszego dostępnego obrazu z głównej tablicy; PNG nie jest zapisywany w IndexedDB.

Istniejąca tablica otwiera się w `use`, a nowo utworzona w `edit`. Tryb `use` pozwala przełączyć bieżącą tablicę do edycji. Tryb `edit` nie pokazuje niezaimplementowanych Undo/Redo. Lista księgi zawsze udostępnia akcję „+ Dodaj tablicę”.

SymbolInspector pozwala połączyć symbol z dowolną inną lokalną tablicą. Opcje pokazują nazwę tablicy i księgi. Może też utworzyć nową tablicę w aktualnej księdze i natychmiast przypisać jej ID do wybranego symbolu. Historia `Wróć` zachowuje `bookId` i `boardId`; „Tablica główna” odnosi się do aktualnej, również docelowej księgi.

Aktywacja symbolu działa kliknięciem, dotykiem, Enter, Space lub dwell. Mowa korzysta z Web Speech API. Repository/IndexedDB zapewnia lokalny zapis, PWA app shell działa offline po pierwszym poprawnym uruchomieniu online, a fixtures są dostępne tylko po jawnej akcji developerskiej.
