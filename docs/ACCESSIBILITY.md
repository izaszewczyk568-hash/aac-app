# Dostępność

## Standard pracy

- semantyczny HTML i logiczna hierarchia nagłówków,
- obsługa Tab, Enter, Space i Escape,
- widoczny fokus i brak pułapek klawiaturowych,
- duże cele dotykowe i bezpieczne odstępy,
- stan nieprzekazywany wyłącznie kolorem,
- wsparcie powiększenia, reflow, wysokiego kontrastu i `prefers-reduced-motion`,
- manualne testy z klawiaturą, czytnikiem ekranu, dotykiem i eyetrackerem.

Warstwa wizualna inspirowana presetem shadcn-vue zachowuje wspólne tokeny, ale kolor Teal został przyciemniony względem podglądu presetu, aby tekst na głównych CTA miał odpowiedni kontrast. Widoczny fokus pozostaje niezależny od dekoracyjnych obramowań komponentów. Ikony Hugeicons towarzyszą tekstowym etykietom i są ukryte przed technologiami asystującymi; nie zastępują accessible names. Stylizowane listy rozwijane nadal używają natywnego elementu `select`.

## Automatyzacja

Vitest/Testing Library sprawdzają role i accessible names. Playwright uruchamia Chromium, a AxeBuilder skanuje stany z regułami WCAG 2 A/AA, 2.1 A/AA i 2.2 AA. Reguły axe nie są wyłączane tylko w celu uzyskania zielonego wyniku. Automatyczny skan nie jest deklaracją pełnej zgodności z WCAG i nie zastępuje manualnych kontroli.

## Home

Home ma jeden H1 oraz stałą, wyróżnioną bibliotekę z instrukcją wyboru. Cała okładka księgi jest dużym natywnym przyciskiem z nazwą „Wybierz księgę …”, obsługiwanym myszą, dotykiem, Enter, Space i dwell; jej aktywacja odczytuje prezentowaną nazwę. W widoku księgi okładki tablic są analogicznymi przyciskami „Wybierz tablicę …” i również przekazują nazwę do syntezy mowy. Po nawigacji dwell ma krótki okres bezpieczeństwa, aby nieruchomy wskaźnik nie aktywował automatycznie kolejnego poziomu. Postęp dwell ma niezależny, niepolegający wyłącznie na kolorze obrys i jest ukryty przed czytnikiem. Dekoracyjne obrazy mają pusty alt i nie dublują nazwy kontrolki. Menu opiekuna pozostaje osobnym celem i obsługuje strzałki, Home/End i Escape. Nazwy Edytuj/Usuń zawierają kontekst księgi.

Dialog tworzenia/zmiany nazwy przenosi fokus na „Nazwa księgi”, utrzymuje fokus, obsługuje Escape i zwraca fokus do wywołującej kontrolki. Opcjonalny natywny input obrazu okładki ma widoczną etykietę i nie jest wymagany do utworzenia księgi. Potwierdzenie usunięcia używa `alertdialog` i ustawia fokus na Anuluj. Toast importu korzysta ze spokojnego `role=status`, nie zabiera fokusu, jest ogłaszany raz i znika bez zmiany bieżącego kontekstu.

## Board i symbole

`Board edit` ma dostępny input nazwy i status zapisu; nie zawiera atrap Undo/Redo. `Board use` renderuje tekstową nazwę i funkcje użycia. Po wejściu w pełnoekranowy tryb dziecka funkcje edycji i duże nagłówki zostają ukryte, a stabilny pełny ekran trwa od Home przez księgę aż do symboli. Wszystkie cele dziecka — księgi, tablice, symbole, przycisk powrotu i zamknięcie pełnego ekranu — używają tego samego przerywanego obramowania i przebiegu animacji dwell. Wskaźnik pozostaje niezależny od dekoracyjnego obramowania elementu. Akcje „Wróć” i X pozostają natywnymi przyciskami obsługiwanymi myszą, dotykiem i klawiaturą. Kliknięcie podczas odliczania przerywa je i uruchamia akcję natychmiast. W pełnym ekranie widoczna strzałka i tekst „Wróć do poprzedniej tablicy” pozostają stale dostępne ponad obszarem symboli. Pełny ekran można zamknąć Escape, kliknięciem lub dwell na przycisku X dostępnym na każdym poziomie.

`SymbolTile` jest natywnym przyciskiem. Fokus, zaznaczenie, aktywacja i dwell mają osobne wskaźniki. Responsywne kafelki zachowują stabilny rozmiar i zawijają się bez poziomego przewijania workspace, a obraz jest przycięty do zaokrąglonego kontenera. Postęp dwell jest dekoracyjny i nie spamuje czytnika procentami. `SymbolInspector` grupuje etykietowane inputy/selecty w semantyczne sekcje; opcje cross-book mają czytelne „Tablica — Księga” bez technicznych ID. Dialog tworzenia połączonej tablicy i usuwania symbolu zarządza fokusem. Kompaktowy panel Inspectora mieści się w wąskim viewporcie, nie wymaga poziomego przewijania, zachowuje pionowy scroll i zamyka się przez X, Escape lub kliknięcie poza panelem bez tworzenia pułapki klawiaturowej.

## Kontrole manualne pozostające

Czytniki ekranu, pełna kolejność Tab, powiększenie do 400%, reflow na małych ekranach, tryby wysokiego kontrastu, dotyk, realny eyetracker, systemowe okno plikowe, ogłaszanie auto-dismiss toastu oraz zachowanie systemowych głosów Web Speech API.
