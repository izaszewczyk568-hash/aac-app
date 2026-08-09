# Komponenty

## Obecny stan

`App` renderuje tymczasowy ekran demonstracyjny `Board` ze sztuczną pustą tablicą. Natywne kontrolki developerskie przełączają tryb i prezentacyjny status zapisu. Demo nie jest funkcją produktu, nie zapisuje danych i zostanie zastąpione przez właściwy przepływ aplikacji.

`Board` jest pierwszą wersją widoku pojedynczej tablicy komunikacyjnej. Przyjmuje model tablicy, tryb `edit` albo `use`, prezentacyjny status zapisu oraz callbacki przyszłych przepływów. Nie zapisuje danych; obecne podłączenie w `App` służy wyłącznie lokalnej demonstracji.

W trybie `edit` komponent udostępnia kompaktowy toolbar z powrotem do strony głównej, lokalnie edytowalną nazwą, nieaktywnymi Undo/Redo, statusem `saving`, `saved` lub `error`, uruchomieniem tablicy i menu przyszłych akcji. Pusta nazwa pozostaje pustą wartością inputu z placeholderem „Tablica bez tytułu”. Floating menu zawiera jawnie niedostępne jeszcze akcje eksportu i usunięcia. Duży workspace poniżej zawiera grid albo wycentrowany empty state z CTA dodania symbolu. W trybie `use` toolbar zawiera wyłącznie powrót do strony głównej, tekstową nazwę tablicy oraz akcję pełnego ekranu. Pusta lub złożona wyłącznie z białych znaków nazwa jest prezentowana jako „Tablica bez tytułu”, bez modyfikowania danych modelu. Pełny ekran obejmuje tylko workspace symboli, ukrywając paski demo i Board; można go zamknąć natywnym Escape albo widocznym przyciskiem X. Empty state dziecka nie zawiera żadnych funkcji edycyjnych.

Grid korzysta z `Board.columns` i przyjmuje opcjonalne elementy potomne jako miejsce dla przyszłych `SymbolTile`. `SymbolTile`, edytor symbolu i logika nawigacji nie są zaimplementowane.

## Zasady przyszłych komponentów

- zaczynaj od semantycznego HTML,
- zachowuj obsługę klawiatury bez własnych zamienników natywnych kontrolek,
- oddzielaj logikę domenową od prezentacji,
- projektuj stany błędu, ładowania i pustej zawartości,
- nie uzależniaj trybu dziecka od funkcji trybu edycji,
- dodawaj testy przez zachowanie widoczne dla użytkownika.
