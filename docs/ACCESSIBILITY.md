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

Automatyczne skany obejmują pusty `Board edit`, edit z `SymbolTile`, zaznaczony kafelek, otwarte menu More, pusty `Board use`, use z symbolami oraz komunikaty PWA: offline, dostępna aktualizacja i błąd aktualizacji. Są to automatyczne kontrole dostępności bieżącego preview, nie deklaracja pełnej zgodności z WCAG.

Kontrole manualne nadal obejmują pełną kolejność Tab, rzeczywiste działanie Enter/Space i Escape w obsługiwanych przeglądarkach, czytniki ekranu, powiększenie do 400%, reflow, dotyk, wysokie kontrasty oraz ocenę zrozumiałości interfejsu dla użytkowników AAC. Automaty nie zastępują tych przeglądów.

Wskaźnik offline jest spokojnym tekstem i nie przenosi fokusu. Baner aktualizacji używa natywnego przycisku, zachowuje bieżący fokus i pokazuje błąd jako `alert`; użytkownik może ponowić operację bez utraty strony. Manualnie trzeba nadal sprawdzić ogłaszanie zmiany stanu sieci i aktualizacji w rzeczywistych czytnikach ekranu, kontrast systemowy, powiększenie oraz zachowanie podczas długiego zapisu.

## Obecny ekran

Ekran developerski zawiera jedno `main` wewnątrz komponentu `Board` oraz poprzedzający go panel demonstracyjny. Natywne radio przełącza tryb, a select pozwala prezentować status zapisu. Kontrolki demo nie są częścią docelowego interfejsu produktu.

`Home` ma jeden logiczny H1, natywne CTA i responsywną listę kart. Każda książka ma jednoznaczną akcję „Otwórz” oraz kontekstową nazwę przycisku menu. Nieinteraktywny preview jest ukryty przed technologiami asystującymi i nie trafia do kolejności Tab. Dialog tworzenia przenosi fokus na opcjonalną nazwę, obsługuje Escape, utrzymuje fokus wewnątrz i po anulowaniu zwraca go do przycisku otwierającego. Automatyczne skany axe obejmują pusty Home, karty, otwarte menu i dialog. Nadal wymagane są manualne testy reflow, czytników ekranu i pełnej kolejności klawiatury.

## Board v1

Komponent używa natywnych przycisków, pola tekstowego z powiązaną etykietą, logicznych nagłówków oraz sekcji gridu. Fokus klawiatury ma wyraźny obrys. Undo i Redo są natywnie wyłączone. Przyszłe akcje menu są fokusowalne, oznaczone przez `aria-disabled` i opisane jako niedostępne; otwarcie przenosi fokus do pierwszej pozycji, strzałki oraz Home/End przemieszczają go między pozycjami, a Escape zamyka menu i zwraca fokus. Status zapisu używa uprzejmego regionu `status` z atomowym komunikatem. Tryb `use` nie renderuje kontrolek edycji.

Toolbar trybu `use` ogranicza kolejność fokusu do powrotu na stronę główną i pełnego ekranu. Nazwa tablicy pozostaje nagłówkiem tekstowym, a akcje edycyjne, destrukcyjne i status zapisu nie są obecne w DOM. W pełnym ekranie pozostaje wyłącznie workspace z dostępnym przyciskiem „Zamknij pełny ekran”; użytkownik może też użyć natywnego klawisza Escape przeglądarki.

Testy komponentowe sprawdzają role, etykietę i rozdzielenie trybów. Przed integracją należy manualnie sprawdzić kolejność Tab, widoczność fokusu, czytnik ekranu, powiększenie do 400%, reflow na tablecie i małym ekranie oraz działanie w trybach wysokiego kontrastu.

Dialog `BoardSettings` używa natywnych selectów, pól number i color z jednoznacznymi etykietami. Po otwarciu fokus trafia na liczbę kolumn, Escape zamyka dialog, fokus pozostaje w dialogu podczas nawigacji Tab, a zamknięcie zwraca go do przycisku More. Automatyczny skan axe obejmuje otwarty dialog; manualnie nadal należy zweryfikować natywne color inputy w obsługiwanych przeglądarkach i trybach wysokiego kontrastu.

## SymbolTile v1

W trybie `edit` kafelek jest jednym natywnym przyciskiem, więc obsługuje Tab, Enter i Space bez niestandardowej emulacji klawiatury. Dostępna nazwa opisuje akcję wyboru oraz podpis symbolu; pusty podpis otrzymuje neutralną nazwę dostępną „Symbol bez podpisu”. Stan wyboru używa `aria-pressed`, zewnętrznego obrysu i widocznego tekstu „Wybrano”. Osobny, podwójny obrys fokusu pozwala odróżnić fokus od zaznaczenia i od przyszłego konfigurowalnego bordera symbolu.

Obraz wewnątrz kafelka ma pusty `alt`, ponieważ dostępna nazwa całego kafelka zawiera już podpis i zapobiega podwójnemu odczytaniu. W trybie `use` nie są renderowane mechanizmy zaznaczania ani dodawania. Komunikaty przetwarzania korzystają z regionu `status`, a błędy z `alert`.

W trybie `use` natywny przycisk zapewnia kliknięcie, Tab, Enter i Space niezależnie od dwell. Developerski checkbox sterowania wzrokiem jest domyślnie zaznaczony; najechanie kursorem lub wskaźnikiem eyetrackera rozpoczyna odliczanie, a kliknięcie przerywa je i aktywuje symbol natychmiast. Postęp dwell jest warstwą wizualną ukrytą przed technologiami asystującymi, nie ogłasza procentów i nie zastępuje pozostałych metod aktywacji. Fokus, postęp i krótkotrwała aktywacja mają osobne wskaźniki. Animacje respektują `prefers-reduced-motion`. Skany axe obejmują fokus, aktywację oraz włączony dwell, ale nadal wymagane są manualne testy z rzeczywistym eyetrackerem, dotykiem, klawiaturą i czytnikami ekranu.

## SymbolInspector v1

Pola inspectora używają natywnych inputów, selectów i color inputów z powiązanymi etykietami. Jedno pole nazwy jest opisane jako źródło podpisu i przyszłego tekstu mowy, a przycisk zamknięcia ma nazwę dostępną. Potwierdzenie usunięcia ma rolę `alertdialog`, przenosi fokus na bezpieczną akcję anulowania i nie tworzy keyboard trap. Zamknięcie inspectora zwraca fokus do kafelka, jeśli nadal istnieje.

Automatyczne skany axe obejmują inspector oraz dialog usunięcia. Nadal wymagane są manualne testy kolejności Tab, zarządzania fokusem w czytnikach ekranu, kontrastu kolorów wybranych przez użytkownika i zachowania overlayu przy powiększeniu/reflow.

## Import, eksport i dane demo

Import używa natywnego inputu plikowego z etykietą. Komunikaty operacji korzystają z `status`, błędy z `alert`, a retry jest natywnym przyciskiem. Menu eksportu obsługuje strzałki i Escape. Automatyczne skany obejmują Home z wieloma kartami, błąd i sukces importu, menu eksportu, widok książki z wieloma tablicami oraz wypełniony Board w `use`. Manualnie nadal należy sprawdzić pełną kolejność Tab na Home, komunikaty czytnika ekranu podczas długiego importu i obsługę systemowego okna wyboru pliku.
