# Dostępność

## Cel

Dostępność jest wymaganiem podstawowym, ze szczególnym uwzględnieniem dzieci korzystających z dotyku, klawiatury, przełączników i eyetrackera działającego jak wskaźnik.

## Standard pracy

- semantyczny HTML i logiczna hierarchia nagłówków,
- pełna obsługa Tab, Enter i Space,
- widoczny fokus i brak pułapek klawiaturowych,
- odpowiednio duże cele dotykowe i bezpieczne odstępy,
- brak znaczenia przekazywanego wyłącznie kolorem,
- wsparcie powiększenia, wysokiego kontrastu i ograniczenia ruchu,
- komunikaty zrozumiałe bez dźwięku,
- ręczne testy z klawiaturą i czytnikiem ekranu.

## Automatyzacja

Test komponentu używa ról dostępności. Po pojawieniu się interaktywnych ekranów należy dodać automatyczne reguły dostępności do testów komponentowych oraz krytycznych testów E2E. Automaty nie zastępują przeglądu ręcznego.

## Obecny ekran

Ekran developerski zawiera jedno `main` wewnątrz komponentu `Board` oraz poprzedzający go panel demonstracyjny. Natywne radio przełącza tryb, a select pozwala prezentować status zapisu. Kontrolki demo nie są częścią docelowego interfejsu produktu.

## Board v1

Komponent używa natywnych przycisków, pola tekstowego z powiązaną etykietą, logicznych nagłówków oraz sekcji gridu. Fokus klawiatury ma wyraźny obrys. Undo i Redo są natywnie wyłączone. Przyszłe akcje menu są fokusowalne, oznaczone przez `aria-disabled` i opisane jako niedostępne; otwarcie przenosi fokus do pierwszej pozycji, strzałki oraz Home/End przemieszczają go między pozycjami, a Escape zamyka menu i zwraca fokus. Status zapisu używa uprzejmego regionu `status` z atomowym komunikatem. Tryb `use` nie renderuje kontrolek edycji.

Toolbar trybu `use` ogranicza kolejność fokusu do powrotu na stronę główną i pełnego ekranu. Nazwa tablicy pozostaje nagłówkiem tekstowym, a akcje edycyjne, destrukcyjne i status zapisu nie są obecne w DOM. W pełnym ekranie pozostaje wyłącznie workspace z dostępnym przyciskiem „Zamknij pełny ekran”; użytkownik może też użyć natywnego klawisza Escape przeglądarki.

Testy komponentowe sprawdzają role, etykietę i rozdzielenie trybów. Przed integracją należy manualnie sprawdzić kolejność Tab, widoczność fokusu, czytnik ekranu, powiększenie do 400%, reflow na tablecie i małym ekranie oraz działanie w trybach wysokiego kontrastu.
