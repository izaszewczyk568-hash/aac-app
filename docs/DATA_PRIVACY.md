# Dane i prywatność

## Zasady

- książki komunikacyjne mają pozostać lokalnie w przeglądarce,
- podstawowe MVP nie wysyła ich na zewnętrzny serwer,
- repozytorium nie może zawierać sekretów ani rzeczywistych danych użytkowników,
- repozytorium nie może zawierać rzeczywistych eksportów książek AAC,
- logi i komunikaty błędów nie powinny ujawniać treści książek,
- import i eksport będą wymagały jawnej czynności użytkownika oraz walidacji danych.

## Obecny stan

Aplikacja nie zbiera, trwale nie zapisuje ani nie przesyła danych użytkownika. Nie ma backendu, analityki, telemetrii, IndexedDB ani zmiennych środowiskowych. Wybrany obraz jest walidowany, dekodowany, skalowany i kompresowany lokalnie w przeglądarce. Duży oryginał nie jest przechowywany; zoptymalizowany `Blob` oraz URL podglądu istnieją wyłącznie w pamięci demonstracji i są zwalniane po zakończeniu widoku. `.gitignore` wyklucza lokalne pliki środowiskowe oraz katalogi przeznaczone na prywatne dane i rzeczywiste eksporty, a `.env.example` nie zawiera wartości.

## Przyszłe przeglądy

Każda funkcja zapisu, importu, eksportu, synchronizacji lub raportowania błędów wymaga osobnej oceny przepływu danych, retencji i możliwości usunięcia danych.
