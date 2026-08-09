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

Testy komponentowe używają ról i nazw dostępności. Osobny zestaw Playwright uruchamia aktualne UI w Chromium i skanuje je przez `AxeBuilder` z regułami WCAG 2 A/AA, WCAG 2.1 A/AA i WCAG 2.2 AA. Test failuje po wykryciu naruszenia; reguły nie są wyłączane w celu uzyskania zielonego wyniku.

Automatyczne skany obejmują pusty `Board edit`, edit z `SymbolTile`, zaznaczony kafelek, otwarte menu More, pusty `Board use` oraz use z symbolami. Są to automatyczne kontrole dostępności bieżącego preview, nie scenariusze E2E produktu i nie deklaracja pełnej zgodności z WCAG.

Kontrole manualne nadal obejmują pełną kolejność Tab, rzeczywiste działanie Enter/Space i Escape w obsługiwanych przeglądarkach, czytniki ekranu, powiększenie do 400%, reflow, dotyk, wysokie kontrasty oraz ocenę zrozumiałości interfejsu dla użytkowników AAC. Automaty nie zastępują tych przeglądów.

## Obecny ekran

Ekran developerski zawiera jedno `main` wewnątrz komponentu `Board` oraz poprzedzający go panel demonstracyjny. Natywne radio przełącza tryb, a select pozwala prezentować status zapisu. Kontrolki demo nie są częścią docelowego interfejsu produktu.

## Board v1

Komponent używa natywnych przycisków, pola tekstowego z powiązaną etykietą, logicznych nagłówków oraz sekcji gridu. Fokus klawiatury ma wyraźny obrys. Undo i Redo są natywnie wyłączone. Przyszłe akcje menu są fokusowalne, oznaczone przez `aria-disabled` i opisane jako niedostępne; otwarcie przenosi fokus do pierwszej pozycji, strzałki oraz Home/End przemieszczają go między pozycjami, a Escape zamyka menu i zwraca fokus. Status zapisu używa uprzejmego regionu `status` z atomowym komunikatem. Tryb `use` nie renderuje kontrolek edycji.

Toolbar trybu `use` ogranicza kolejność fokusu do powrotu na stronę główną i pełnego ekranu. Nazwa tablicy pozostaje nagłówkiem tekstowym, a akcje edycyjne, destrukcyjne i status zapisu nie są obecne w DOM. W pełnym ekranie pozostaje wyłącznie workspace z dostępnym przyciskiem „Zamknij pełny ekran”; użytkownik może też użyć natywnego klawisza Escape przeglądarki.

Testy komponentowe sprawdzają role, etykietę i rozdzielenie trybów. Przed integracją należy manualnie sprawdzić kolejność Tab, widoczność fokusu, czytnik ekranu, powiększenie do 400%, reflow na tablecie i małym ekranie oraz działanie w trybach wysokiego kontrastu.

## SymbolTile v1

W trybie `edit` kafelek jest jednym natywnym przyciskiem, więc obsługuje Tab, Enter i Space bez niestandardowej emulacji klawiatury. Dostępna nazwa opisuje akcję wyboru oraz podpis symbolu; pusty podpis otrzymuje neutralną nazwę dostępną „Symbol bez podpisu”. Stan wyboru używa `aria-pressed`, zewnętrznego obrysu i widocznego tekstu „Wybrano”. Osobny, podwójny obrys fokusu pozwala odróżnić fokus od zaznaczenia i od przyszłego konfigurowalnego bordera symbolu.

Obraz wewnątrz kafelka ma pusty `alt`, ponieważ dostępna nazwa całego kafelka zawiera już podpis i zapobiega podwójnemu odczytaniu. W trybie `use` nie są renderowane mechanizmy zaznaczania ani dodawania. Komunikaty przetwarzania korzystają z regionu `status`, a błędy z `alert`.

## SymbolInspector v1

Pola inspectora używają natywnych inputów, selectów, color inputów i range z powiązanymi etykietami. Slider udostępnia zakres i procentową wartość, a przycisk zamknięcia ma nazwę dostępną. Potwierdzenie usunięcia ma rolę `alertdialog`, przenosi fokus na bezpieczną akcję anulowania i nie tworzy keyboard trap. Zamknięcie inspectora zwraca fokus do kafelka, jeśli nadal istnieje.

Automatyczne skany axe obejmują inspector oraz dialog usunięcia. Nadal wymagane są manualne testy kolejności Tab, zarządzania fokusem w czytnikach ekranu, kontrastu kolorów wybranych przez użytkownika i zachowania overlayu przy powiększeniu/reflow.
