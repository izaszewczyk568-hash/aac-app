# Produkt

## Cel

Aplikacja AAC ma pomagać dzieciom z trudnościami w komunikacji werbalnej wyrażać potrzeby, wybory i emocje za pomocą symboli oraz syntezy mowy.

## Użytkownicy

- dziecko korzystające z przygotowanej tablicy komunikacyjnej,
- terapeuta, rodzic lub opiekun przygotowujący książki, tablice i symbole.

## Założenia MVP

Produkt będzie aplikacją webową, dostępną publicznie bez konta. Dane użytkownika pozostaną lokalnie w przeglądarce. Priorytetami są dostępność, niezawodność, prostota, prywatność i wydajność na słabszych urządzeniach.

## Zakres obecnego etapu

Zaimplementowany jest podstawowy, wersjonowany model książki komunikacyjnej, tablic i symboli. Książka może zawierać wiele połączonych tablic, a `mainBoardId` wskazuje jedyną główną tablicę, od której rozpoczyna się korzystanie z książki i do której będzie prowadzić akcja „Tablica główna”. Wybór jest opcjonalny i można go zmienić. Tablice używają siatki, a symbole kolejności w siatce. Symbol może prowadzić do innej tablicy i może nadpisywać domyślny czas dwell tablicy.

Developer preview pozwala lokalnie dodać i edytować symbole oraz aktywować je w trybie dziecka kliknięciem, dotykiem, klawiaturą albo opcjonalnym dwell. Jedna nazwa jest podpisem i tekstem odczytywanym lokalnie przez Web Speech API. Eyetracker jest traktowany jak wskaźnik. Dla książek z repozytorium działają przejścia `linkedBoardId`, powrót oraz przejście do tablicy głównej.

Pierwszym ekranem aplikacji jest `Home / CommunicationBook Library`. Zarządza całymi książkami komunikacyjnymi, nie pojedynczymi tablicami. Pozwala utworzyć książkę z opcjonalną nazwą, otworzyć ją i przejść do jej tablic. Sekcja „Ostatnio używane” jest renderowana wyłącznie wtedy, gdy lista książek nie jest pusta. `CommunicationBook` jest jednostką działającego, lokalnego importu i eksportu.

Tryb developerski udostępnia pięć syntetycznych fixtures: „Posiłki”, „Szkoła”, „Jak się czuję”, „Zabawa” i „Wizyta u lekarza”. Nie są to dane startowe produktu i nigdy nie są dodawane automatycznie użytkownikowi. Zawarte grafiki są prostymi `synthetic demo assets`, a nie profesjonalnym zestawem symboli AAC.

Edytor tablicy udostępnia `BoardSettings v1` dla liczby kolumn, domyślnego dwell time oraz domyślnego wyglądu nowych symboli. Nazwa pozostaje edytowana inline, a wybór tablicy głównej należy do poziomu CommunicationBook. Zmiana defaults nie resetuje istniejących symboli. Zmiany książek otwartych z biblioteki są kolejkowane do lokalnego Repository.

PWA v1 pozwala po pierwszym uruchomieniu online ponownie otworzyć app shell bez sieci oraz korzystać z lokalnie zapisanych książek, obrazów, edycji i nawigacji między tablicami. Instalacja korzysta z natywnego mechanizmu przeglądarki; aplikacja nie pokazuje własnej obietnicy instalacji, gdy przeglądarka jej nie wspiera. Synteza mowy offline zależy od głosów dostępnych lokalnie w systemie i nie jest gwarantowana przez service worker.
