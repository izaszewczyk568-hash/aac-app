# Komponenty

## Home i CommunicationBookCard

`Home` operuje na `CommunicationBook`, ale user-facing copy używa słowa „Księga”. Tworzenie, zmiana nazwy i usuwanie korzystają z dostępnych dialogów. Import używa natywnego inputu plikowego, po sukcesie pokazuje krótki `status` i sesyjną sekcję „Dodana księga”. Sekcja ta i „Ostatnio używane” renderują dokładnie ten sam `CommunicationBookCard`.

Karta pokazuje nazwę, liczbę tablic, dekoracyjną miniaturę oraz menu: Otwórz, Edytuj księgę, Eksportuj księgę, Usuń księgę. Miniatura jest runtime PNG z pierwszego dostępnego obrazu symbolu głównej tablicy według `position`; brak obrazu lub poprawnego `mainBoardId` daje neutralny placeholder.

## Widok księgi i Board

Widok księgi zawsze udostępnia „+ Dodaj tablicę”. Istniejąca tablica otwiera się w `use`, nowa w `edit`. `Board` pozostaje komponentem prezentacyjnym niezależnym od storage; `App` koordynuje stan i zapis przez Repository.

Toolbar `edit` zawiera powrót, input nazwy, status zapisu, uruchomienie tablicy i menu. Undo/Redo nie są renderowane. Toolbar `use` zawiera powrót, tekstową nazwę, akcje „Tablica główna” i „Powtórz” zależnie od stanu, „Edytuj tablicę” oraz „Pełny ekran”. Pełny ekran obejmuje workspace i można go zamknąć Escape lub przyciskiem X.

Grid wynika z `Board.columns`, a kolejność z `Symbol.position`. `BoardSettings` zmienia ustawienia tablicy i defaults nowych symboli; nie zmienia istniejących symboli.

## SymbolTile i SymbolInspector

`SymbolTile` jest natywnym przyciskiem. W `edit` ma kontrolowane zaznaczenie niezależne od konfigurowalnego bordera. W `use` obsługuje kliknięcie, klawiaturę, dotyk i dwell; kliknięcie podczas dwell aktywuje symbol natychmiast.

`SymbolInspector` istnieje tylko w `edit`. Edytuje pojedyncze źródło nazwy/mowy, wygląd, `linkedBoardId` i `dwellTime`. Select pokazuje wszystkie lokalne tablice poza bieżącą w formacie „Tablica — Księga”, bez ID. Dialog „Utwórz nową tablicę” tworzy Board w aktualnej księdze, od razu przypisuje jej ID do wybranego symbolu i po zapisie otwiera nową tablicę w osobnej karcie przeglądarki. Panel dopasowuje szerokość i położenie do viewportu bez poziomego przewijania. Usunięcie symbolu wymaga potwierdzenia.

## PwaStatus

`PwaStatus` spokojnie pokazuje offline i oczekującą aktualizację. Przed aktywacją nowego service workera opróżnia kolejkę lokalnych zapisów; błąd zatrzymuje reload.
