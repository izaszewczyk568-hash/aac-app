# Dostępność

## Standard pracy

- semantyczny HTML i logiczna hierarchia nagłówków,
- obsługa Tab, Enter, Space i Escape,
- widoczny fokus i brak pułapek klawiaturowych,
- duże cele dotykowe i bezpieczne odstępy,
- stan nieprzekazywany wyłącznie kolorem,
- wsparcie powiększenia, reflow, wysokiego kontrastu i `prefers-reduced-motion`,
- manualne testy z klawiaturą, czytnikiem ekranu, dotykiem i eyetrackerem.

## Automatyzacja

Vitest/Testing Library sprawdzają role i accessible names. Playwright uruchamia Chromium, a AxeBuilder skanuje stany z regułami WCAG 2 A/AA, 2.1 A/AA i 2.2 AA. Reguły axe nie są wyłączane tylko w celu uzyskania zielonego wyniku. Automatyczny skan nie jest deklaracją pełnej zgodności z WCAG i nie zastępuje manualnych kontroli.

## Home

Home ma jeden H1, natywne CTA i listy kart. Dekoracyjna miniatura PNG ma pusty alt/`aria-hidden` i nie trafia do kolejności Tab. Menu karty obsługuje strzałki, Home/End i Escape. Nazwy Edytuj/Usuń zawierają kontekst księgi.

Dialog tworzenia/zmiany nazwy przenosi fokus na „Nazwa księgi”, utrzymuje fokus, obsługuje Escape i zwraca fokus do wywołującej kontrolki. Potwierdzenie usunięcia używa `alertdialog` i ustawia fokus na Anuluj. Toast importu korzysta ze spokojnego `role=status`, nie zabiera fokusu, jest ogłaszany raz i znika bez zmiany bieżącego kontekstu.

## Board i symbole

`Board edit` ma dostępny input nazwy i status zapisu; nie zawiera atrap Undo/Redo. `Board use` renderuje tekstową nazwę, funkcje użycia oraz natywny przycisk „Edytuj tablicę”, ale nie pokazuje destrukcyjnych funkcji edycji symboli. Pełny ekran można zamknąć Escape lub przyciskiem X.

`SymbolTile` jest natywnym przyciskiem. Fokus, zaznaczenie, aktywacja i dwell mają osobne wskaźniki. Postęp dwell jest dekoracyjny i nie spamuje czytnika procentami. `SymbolInspector` używa etykietowanych inputów/selectów; opcje cross-book mają czytelne „Tablica — Księga” bez technicznych ID. Dialog tworzenia połączonej tablicy i usuwania symbolu zarządza fokusem. Panel Inspectora mieści się w wąskim viewporcie, nie wymaga poziomego przewijania i zachowuje pionowy scroll dla długiej zawartości.

## Kontrole manualne pozostające

Czytniki ekranu, pełna kolejność Tab, powiększenie do 400%, reflow na małych ekranach, tryby wysokiego kontrastu, dotyk, realny eyetracker, systemowe okno plikowe, ogłaszanie auto-dismiss toastu oraz zachowanie systemowych głosów Web Speech API.
