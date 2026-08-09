# Komponenty

## Obecny stan

`Home` jest pierwszym ekranem aplikacji i operuje na `CommunicationBook`. Zawiera tworzenie i natywny wybór pliku importu oraz opcjonalną sekcję ostatnio używanych książek. Pusta biblioteka nie renderuje nagłówka sekcji, placeholderów ani demo. Karty pokazują nazwę, liczbę tablic i lekkie preview głównej tablicy, a menu udostępnia wspólny eksport całej książki. Statusy importu i eksportu są dostępnie ogłaszane.

Po utworzeniu lub otwarciu książki prosty widok książki pokazuje jej tablice i pozwala wrócić do strony głównej. Nowa pusta książka może utworzyć pierwszą pustą tablicę i przejść do istniejącego edytora. Widok pojedynczej tablicy wraca do książki, a w `use` po przejściu przez `linkedBoardId` udostępnia krótki „Wróć” oraz „Tablica główna”. Książki i obrazy odczytywane są przez Repository.

`App` renderuje także tymczasowy ekran demonstracyjny `Board`. Na Home wyłącznie development build pokazuje akcje seed/cleanup syntetycznych fixtures. Akcje korzystają z Repository, są idempotentne i nie usuwają zwykłych ani ponownie zaimportowanych książek.

`Board` jest pierwszą wersją widoku pojedynczej tablicy komunikacyjnej. Przyjmuje model tablicy, tryb `edit` albo `use`, prezentacyjny status zapisu oraz callbacki przepływów. Nadal nie zależy bezpośrednio od storage; `App` koordynuje debounce i zapis zmian książki przez Repository.

W trybie `edit` komponent udostępnia kompaktowy toolbar z powrotem do strony głównej, lokalnie edytowalną nazwą, nieaktywnymi Undo/Redo, statusem `saving`, `saved` lub `error`, uruchomieniem tablicy i menu przyszłych akcji. Pusta nazwa pozostaje pustą wartością inputu z placeholderem „Tablica bez tytułu”. Floating menu zawiera jawnie niedostępne jeszcze akcje eksportu i usunięcia. Duży workspace poniżej zawiera grid albo wycentrowany empty state z CTA dodania symbolu. W trybie `use` toolbar zawiera wyłącznie powrót do strony głównej, tekstową nazwę tablicy oraz akcję pełnego ekranu. Pusta lub złożona wyłącznie z białych znaków nazwa jest prezentowana jako „Tablica bez tytułu”, bez modyfikowania danych modelu. Pełny ekran obejmuje tylko workspace symboli, ukrywając paski demo i Board; można go zamknąć natywnym Escape albo widocznym przyciskiem X. Empty state dziecka nie zawiera żadnych funkcji edycyjnych.

Grid korzysta z `Board.columns`, a kolejność kafelków wynika z `Symbol.position`. Po dodaniu symbolu dostępna jest pływająca akcja dodania kolejnego obrazu bez tworzenia dodatkowego toolbara.

## BoardSettings v1

`BoardSettings` jest dostępnym dialogiem otwieranym z menu More edytora. Zmienia lokalnie liczbę kolumn, domyślny dwell time oraz domyślną grubość i kolory symboli. Nie zawiera nazwy tablicy, która pozostaje edytowana inline, ani ustawienia głównej tablicy, ponieważ jedynym źródłem tej informacji jest `CommunicationBook.mainBoardId`.

Zmiana kolumn natychmiast aktualizuje wyłącznie układ gridu i nie zmienia `Symbol.position`. Ustawienia domyślne nie modyfikują istniejących symboli. Helper domenowy `createSymbolForBoard` kopiuje aktualne wartości domyślne do nowego symbolu. Dialog nie ma przycisku „Zapisz”; `App` przekazuje zmiany do wspólnego autosave Repository.

## SymbolTile v1

`SymbolTile` pokazuje podpis nad obrazem zachowującym proporcje. W trybie `edit` cały kafelek jest pojedynczym natywnym przyciskiem wyboru z kontrolowanymi propsami `selected` i `onSelect`. Fokus oraz zaznaczenie używają osobnych wskaźników, a zaznaczenie zawiera także tekst „Wybrano”, więc nie zależy wyłącznie od koloru ani konfigurowalnego obramowania symbolu. Pusty `label` pozostaje pusty w modelu; neutralne „Bez podpisu” jest wyłącznie prezentacją trybu edycji.

W trybie `use` kafelek jest dużym natywnym przyciskiem aktywowanym kliknięciem, dotykiem, Enter lub Space. Aktywacja pokazuje krótki, niezależny od konfigurowalnego bordera stan „Aktywowano” i przekazuje symbol do lokalnej syntezy mowy. `label` jest jedynym tekstem widocznym i mówionym; pusty label otrzymuje wyłącznie dostępnościowy fallback i nie uruchamia pustej wypowiedzi.

Dwell jest domyślnie włączony w developerskim trybie `use` i można go wyłączyć checkboxem „Sterowanie wzrokiem (dwell)”. Zarówno kursor, jak i eyetracker działający jak wskaźnik rozpoczynają odliczanie po najechaniu. CSS-owy wskaźnik postępu korzysta z efektywnego czasu wyliczanego przez domenę, resetuje się po opuszczeniu kafelka i aktywuje symbol tylko raz podczas jednego ciągłego wskazania. Kliknięcie podczas odliczania przerywa loader i aktywuje symbol natychmiast. `linkedBoardId` wywołuje po krótkim opóźnieniu demonstracyjny callback; finalny routing tablic nie jest jeszcze zaimplementowany. Akcja „Powtórz” przechowuje ostatni faktycznie wypowiedziany tekst wyłącznie w stanie sesji.

## SymbolInspector v1

Inspector jest kontekstowym overlayem renderowanym wyłącznie dla zaznaczonego symbolu w trybie `edit`; nie zmienia wymiarów gridu. Edytuje lokalnie pojedynczą nazwę używaną jako podpis i przyszły tekst mowy, border, kolor tekstu, `linkedBoardId` oraz `dwellTime`. Nie udostępnia kontrolek obrotu ani powiększenia obrazu. Lista połączeń pokazuje nazwy innych tablic i prezentacyjny fallback, nigdy surowe ID. Akcja „Utwórz nową tablicę” jest oddzielnym callbackiem demonstracyjnym, nie gotowym flow tworzenia.

Usunięcie wymaga potwierdzenia w dostępnym dialogu i usuwa tylko wybrany symbol. Inspector ma jawne zamknięcie i nie istnieje w trybie `use`. Synteza mowy i aktywacja dwell są koordynowane poza Inspectorem, a zapis zmian książki pozostaje odpowiedzialnością `App` i Repository.

## PwaStatus

`PwaStatus` prezentuje globalny, nienachalny stan offline oraz oczekującą aktualizację. Nie przejmuje fokusu. Aktualizacja jest uruchamiana wyłącznie natywnym przyciskiem użytkownika; komponent deleguje najpierw `flushPendingWrites`, a dopiero po sukcesie aktywuje nowy service worker i przeładowuje stronę. W przypadku błędu pokazuje alert oraz możliwość ponowienia. Sam komponent nie zna IndexedDB i nie zapisuje danych.

## Zasady przyszłych komponentów

- zaczynaj od semantycznego HTML,
- zachowuj obsługę klawiatury bez własnych zamienników natywnych kontrolek,
- oddzielaj logikę domenową od prezentacji,
- projektuj stany błędu, ładowania i pustej zawartości,
- nie uzależniaj trybu dziecka od funkcji trybu edycji,
- dodawaj testy przez zachowanie widoczne dla użytkownika.
