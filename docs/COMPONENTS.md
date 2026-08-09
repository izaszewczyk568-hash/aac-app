# Komponenty

## Obecny stan

`App` renderuje tymczasowy ekran demonstracyjny `Board` ze sztuczną tablicą. Natywne kontrolki developerskie przełączają tryb i prezentacyjny status zapisu. W trybie `edit` natywny wybór pliku pozwala dodać zoptymalizowany obraz jako symbol oraz przełączać zaznaczenie. Demo nie jest funkcją produktu, przechowuje dane wyłącznie w pamięci i zostanie zastąpione przez właściwy przepływ aplikacji.

`Board` jest pierwszą wersją widoku pojedynczej tablicy komunikacyjnej. Przyjmuje model tablicy, tryb `edit` albo `use`, prezentacyjny status zapisu oraz callbacki przyszłych przepływów. Nie zapisuje danych; obecne podłączenie w `App` służy wyłącznie lokalnej demonstracji.

W trybie `edit` komponent udostępnia kompaktowy toolbar z powrotem do strony głównej, lokalnie edytowalną nazwą, nieaktywnymi Undo/Redo, statusem `saving`, `saved` lub `error`, uruchomieniem tablicy i menu przyszłych akcji. Pusta nazwa pozostaje pustą wartością inputu z placeholderem „Tablica bez tytułu”. Floating menu zawiera jawnie niedostępne jeszcze akcje eksportu i usunięcia. Duży workspace poniżej zawiera grid albo wycentrowany empty state z CTA dodania symbolu. W trybie `use` toolbar zawiera wyłącznie powrót do strony głównej, tekstową nazwę tablicy oraz akcję pełnego ekranu. Pusta lub złożona wyłącznie z białych znaków nazwa jest prezentowana jako „Tablica bez tytułu”, bez modyfikowania danych modelu. Pełny ekran obejmuje tylko workspace symboli, ukrywając paski demo i Board; można go zamknąć natywnym Escape albo widocznym przyciskiem X. Empty state dziecka nie zawiera żadnych funkcji edycyjnych.

Grid korzysta z `Board.columns`, a kolejność kafelków wynika z `Symbol.position`. Po dodaniu symbolu dostępna jest pływająca akcja dodania kolejnego obrazu bez tworzenia dodatkowego toolbara.

## SymbolTile v1

`SymbolTile` pokazuje podpis nad obrazem zachowującym proporcje. W trybie `edit` cały kafelek jest pojedynczym natywnym przyciskiem wyboru z kontrolowanymi propsami `selected` i `onSelect`. Fokus oraz zaznaczenie używają osobnych wskaźników, a zaznaczenie zawiera także tekst „Wybrano”, więc nie zależy wyłącznie od koloru ani konfigurowalnego obramowania symbolu. Pusty `label` pozostaje pusty w modelu; neutralne „Bez podpisu” jest wyłącznie prezentacją trybu edycji.

Tryb `use` renderuje kafelek bez funkcji edycji. Uruchamianie komunikatu, synteza mowy, dwell, inspector, linkowanie tablic i edycja wyglądu pozostają poza zakresem tej wersji.

## SymbolInspector v1

Inspector jest kontekstowym overlayem renderowanym wyłącznie dla zaznaczonego symbolu w trybie `edit`; nie zmienia wymiarów gridu. Edytuje lokalnie `label`, `speechText`, obrót i skalę obrazu, border, kolor tekstu, `linkedBoardId` oraz `dwellTime`. Lista połączeń pokazuje nazwy innych tablic i prezentacyjny fallback, nigdy surowe ID. Akcja „Utwórz nową tablicę” jest oddzielnym callbackiem demonstracyjnym, nie gotowym flow tworzenia.

Usunięcie wymaga potwierdzenia w dostępnym dialogu i usuwa tylko wybrany symbol z pamięci demo. Inspector ma jawne zamknięcie; nie istnieje w trybie `use`. Synteza mowy, aktywacja dwell i trwały zapis nadal nie są zaimplementowane.

## Zasady przyszłych komponentów

- zaczynaj od semantycznego HTML,
- zachowuj obsługę klawiatury bez własnych zamienników natywnych kontrolek,
- oddzielaj logikę domenową od prezentacji,
- projektuj stany błędu, ładowania i pustej zawartości,
- nie uzależniaj trybu dziecka od funkcji trybu edycji,
- dodawaj testy przez zachowanie widoczne dla użytkownika.
