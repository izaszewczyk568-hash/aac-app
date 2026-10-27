# Produkt

## Cel i użytkownicy

Aplikacja AAC pomaga dzieciom z trudnościami w komunikacji werbalnej wyrażać potrzeby, wybory i emocje za pomocą symboli oraz lokalnej syntezy mowy. Terapeuta, rodzic lub opiekun przygotowuje księgi, tablice i symbole; dziecko korzysta z trybu `use`.

## Założenia MVP

Produkt jest aplikacją webową, local-first i nie wymaga konta. Dane pozostają lokalnie w przeglądarce. Priorytetami są dostępność, niezawodność, prostota, prywatność i wydajność na słabszych urządzeniach.

## Zaimplementowany zakres

Model `CommunicationBook → Board → Symbol` jest wersjonowany. `mainBoardId` wskazuje jedyną główną tablicę księgi. Podczas tworzenia księgi można opcjonalnie dodać jej własny obraz okładki. Księga i każda tablica mogą też wskazać własny `coverSymbolId`: okładka księgi wybiera symbol z całej księgi, a okładka tablicy wyłącznie symbol należący do tej tablicy. Wybrany później symbol ma pierwszeństwo przed obrazem dodanym przy tworzeniu; brak obu uruchamia automatyczny fallback do pierwszego obrazowego symbolu. Tablice używają gridu, symbole kolejności `position`, a `linkedBoardId` może wskazać globalnie unikalną tablicę w tej samej lub innej lokalnej księdze.

Home zawiera stałą sekcję „Wybierz księgę” ze wszystkimi lokalnymi księgami, także gdy biblioteka jest pusta. Duża okładka jest celem wyboru dziecka: kliknięcie, klawiatura lub dwell odczytują nazwę księgi i prowadzą do jej tablic. Każda tablica ma następną dużą kontrolkę okładki, obsługiwaną tymi samymi metodami, która odczytuje nazwę i otwiera Board w `use`; następnie dziecko wybiera symbole. Pełnoekranowy tryb dziecka można uruchomić już na Home i zachować przez wszystkie trzy poziomy; funkcje opiekuna są wtedy ukryte. Osobne menu opiekuna pozwala edytować nazwę i opcjonalny symbol okładki, usuwać, importować i eksportować księgę. Ustawienia tablicy pozwalają wybrać jej opcjonalny symbol okładki. Prezentacyjne fallbacki pustych nazw nie są zapisywane do modelu.

Istniejąca tablica otwiera się w `use`, a nowo utworzona w `edit`. Tryb `use` pozwala przełączyć bieżącą tablicę do edycji. Tryb `edit` nie pokazuje niezaimplementowanych Undo/Redo. Lista księgi zawsze udostępnia akcję „+ Dodaj tablicę”.

SymbolInspector pozwala połączyć symbol z dowolną inną lokalną tablicą. Opcje pokazują nazwę tablicy i księgi. Może też utworzyć nową tablicę w aktualnej księdze i natychmiast przypisać jej ID do wybranego symbolu. Historia `Wróć` zachowuje `bookId` i `boardId`; „Tablica główna” odnosi się do aktualnej, również docelowej księgi.

Aktywacja symbolu działa kliknięciem, dotykiem, Enter, Space lub dwell. W trybie `use` również akcja „Wróć” obsługuje kursor/eyetracker z dwell, a zwykłe kliknięcie uruchamia ją od razu. Mowa korzysta z Web Speech API. Repository/IndexedDB zapewnia lokalny zapis, PWA app shell działa offline po pierwszym poprawnym uruchomieniu online, a fixtures są dostępne tylko po jawnej akcji developerskiej.
