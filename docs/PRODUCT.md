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

Interfejs AAC, trwały zapis, import i eksport, PWA oraz synteza mowy pozostają poza zakresem tego etapu.
