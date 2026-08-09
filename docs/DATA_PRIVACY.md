# Dane i prywatność

## Zasady

- książki komunikacyjne mają pozostać lokalnie w przeglądarce,
- podstawowe MVP nie wysyła ich na zewnętrzny serwer,
- repozytorium nie może zawierać sekretów ani rzeczywistych danych użytkowników,
- repozytorium nie może zawierać rzeczywistych eksportów książek AAC,
- logi i komunikaty błędów nie powinny ujawniać treści książek,
- import i eksport wymagają jawnej czynności użytkownika oraz walidacji danych.

## Obecny stan

Aplikacja nie przesyła danych użytkownika. Nie ma backendu, analityki ani telemetrii. Książki i binarne obrazy są przechowywane lokalnie w IndexedDB; runtime `blob:` URL nie jest utrwalany. Import i eksport odczytują lub tworzą plik wyłącznie lokalnie, nie używają zewnętrznego parsera ani cloud storage. Cache Storage zawiera tylko publiczny kod app shell, manifest i ikonę — nigdy książki, obrazy użytkownika ani eksporty `.aacbook`. `.gitignore` wyklucza `.aacbook`, lokalne pliki środowiskowe oraz katalogi prywatnych danych.

Aktualizacja service workera nie czyści ani nie migruje IndexedDB. Przed świadomą aktywacją aplikacja próbuje zakończyć oczekujące zapisy; błąd zatrzymuje reload i jest prezentowany użytkownikowi. Cache cleanup jest ograniczony do nazw zaczynających się od własnego prefiksu `aac-app-shell-`.

## Przyszłe przeglądy

Formularz nie prosi o imię dziecka, diagnozę ani inne dane osobowe. Fixtures są w całości syntetyczne, nie zawierają danych prawdziwych dzieci, szkół ani osób. Akcje developerskie nie uruchamiają się automatycznie, a cleanup rozpoznaje wyłącznie jawny manifest oryginalnych ID demo.

Każda funkcja zapisu, importu, eksportu, synchronizacji lub raportowania błędów wymaga osobnej oceny przepływu danych, retencji i możliwości usunięcia danych.
