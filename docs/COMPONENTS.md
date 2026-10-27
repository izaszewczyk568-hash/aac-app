# Komponenty

## Wspólny język wizualny

Komponenty korzystają ze wspólnych tokenów inspirowanych presetem shadcn-vue `a28C8pg8`: neutralna baza Olive, akcent Teal, lokalna typografia Inter, subtelne obramowania, ograniczone cienie i promień `0.625rem`. Implementacja pozostaje natywnym CSS w React i nie wprowadza zależności od Vue ani Tailwinda. Akcje korzystają z ikon Hugeicons Stroke Rounded, a współdzielony `SelectControl` zachowuje natywny `select`, dodając jednolitą oprawę i ikonę rozwinięcia.

## Home i CommunicationBookCard

`Home` operuje na `CommunicationBook`, ale user-facing copy używa słowa „Księga”. Formularz tworzenia przyjmuje opcjonalny lokalny obraz okładki i przetwarza go tym samym bezpiecznym mechanizmem co obrazy symboli. Stała sekcja „Wybierz księgę” renderuje każdą lokalną księgę dokładnie raz. Cała duża okładka jest natywnym przyciskiem prowadzącym do tablic księgi; obsługuje kliknięcie, klawiaturę i dwell, a przed nawigacją przekazuje nazwę do lokalnej syntezy mowy. Akcja „Uruchom pełnoekranowy tryb dziecka” obejmuje stabilny korzeń aplikacji, dzięki czemu fullscreen trwa przez kolejne widoki. W tej sesji duże nagłówki są wizualnie ukryte, aby przeznaczyć przestrzeń na okładki, a księgi, tablice, symbole i powrót korzystają ze wspólnego wskaźnika dwell. Osobne menu prowadzi opiekuna do akcji edycji, eksportu i usuwania; w pełnoekranowym trybie dziecka nie jest wyświetlane. Lista symboli okładki pokazuje obrazowe symbole z tablic bieżącej księgi; brak wyboru zachowuje okładkę wgraną przy tworzeniu lub automatyczną miniaturę. Import używa natywnego inputu plikowego i po sukcesie pokazuje krótki `status` bez duplikowania karty.

Karta pokazuje nazwę, liczbę tablic, dekoracyjną miniaturę oraz menu: Otwórz, Edytuj księgę, Eksportuj księgę, Usuń księgę. Miniatura jest runtime PNG z wybranego symbolu okładki, bezpośredniego obrazu księgi albo pierwszego dostępnego obrazu symbolu głównej tablicy według `position`; brak obrazu daje neutralny placeholder.

## Widok księgi i Board

Widok księgi zawsze udostępnia opiekunowi „+ Dodaj tablicę”. Każda istniejąca tablica jest prezentowana jako duża `CommunicationBoardCard` z nazwą i opcjonalną okładką symbolu. Cała karta obsługuje kliknięcie, klawiaturę i dwell, odczytuje nazwę oraz otwiera tablicę w `use`; nowa tablica otwiera się w `edit`. W pełnoekranowym trybie dziecka akcja dodawania jest ukryta. `BoardSettings` pozwala wskazać jako okładkę dowolny obrazowy symbol należący do danej tablicy. Przy braku wyboru karta używa pierwszego dostępnego obrazu według `position`. `Board` pozostaje komponentem prezentacyjnym niezależnym od storage; `App` koordynuje stan i zapis przez Repository.

Toolbar `edit` zawiera powrót, input nazwy, status zapisu, uruchomienie tablicy i menu. Undo/Redo nie są renderowane. Toolbar `use` zawiera powrót, tekstową nazwę, akcje „Tablica główna” i „Powtórz” zależnie od stanu, „Edytuj tablicę” oraz „Pełny ekran”. Powrót działa natychmiast po kliknięciu i opcjonalnie przez ten sam mechanizm dwell co symbole. Pełny ekran obejmuje workspace, zachowuje pływający przycisk ze strzałką „Wróć do poprzedniej tablicy” i można go zamknąć Escape lub przyciskiem X.

Kolejność kafelków wynika z `Symbol.position`. Ich rozmiar jest responsywny względem wysokości viewportu: kafelek zajmuje około jednej trzeciej dostępnej wysokości, zachowuje proporcje i ma bezpieczne minimum oraz maksimum. `Board.columns` wpływa na preferowaną gęstość, ale grid wykorzystuje wolne miejsce, automatycznie mieści możliwie dużo pełnych kafelków w wierszu i przenosi pozostałe do kolejnego. `BoardSettings` zmienia ustawienia tablicy i defaults nowych symboli; nie zmienia istniejących symboli.

## SymbolTile i SymbolInspector

`SymbolTile` jest natywnym przyciskiem. Obraz zachowuje proporcje, wypełnia przeznaczony obszar kafelka oraz jest automatycznie centrowany i kadrowany bez wychodzenia poza jego granice. W `edit` kafelek ma kontrolowane zaznaczenie niezależne od konfigurowalnego bordera. W `use` obsługuje kliknięcie, klawiaturę, dotyk i dwell; kliknięcie podczas dwell aktywuje symbol natychmiast.

Jawnie ładowane dane developerskie zawierają wyłącznie podpisane symbole z lokalnie generowanymi, tematycznymi piktogramami. Każdy symbol ma odpowiadający mu Blob obrazu, pierwszy symbol każdej tablicy jest jej okładką, a pierwszy symbol głównej tablicy również okładką księgi demo.

`SymbolInspector` istnieje tylko w `edit`. Edytuje pojedyncze źródło nazwy/mowy, wygląd, `linkedBoardId` i `dwellTime`. Formularz jest podzielony na kompaktowe sekcje „Treść”, „Wygląd” i „Działanie”, mieści się w wysokości małego ekranu z pionowym przewijaniem i nie powoduje przewijania poziomego. Można go zamknąć przyciskiem X, klawiszem Escape lub kliknięciem poza panelem; kliknięcie wewnątrz nie zamyka formularza. Select pokazuje wszystkie lokalne tablice poza bieżącą w formacie „Tablica — Księga”, bez ID. Dialog „Utwórz nową tablicę” tworzy Board w aktualnej księdze, od razu przypisuje jej ID do wybranego symbolu i po zapisie otwiera nową tablicę w osobnej karcie przeglądarki. Usunięcie symbolu wymaga potwierdzenia.

## PwaStatus

`PwaStatus` spokojnie pokazuje offline i oczekującą aktualizację. Przed aktywacją nowego service workera opróżnia kolejkę lokalnych zapisów; błąd zatrzymuje reload.
