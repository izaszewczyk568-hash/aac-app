# Plan rozwoju

## Etap 0 — fundament

- konfiguracja React, TypeScript i Vite,
- lint, testy komponentowe i build w CI,
- dokumentacja zasad jakości, dostępności i prywatności.

## Zrealizowane etapy

1. Model domenowy książki, tablicy i symbolu wraz z testami.
2. Board v1: wspólny, dostępny kontener trybów edycji i użycia bez symboli i storage.
3. SymbolTile v1: lokalne dodawanie zoptymalizowanych obrazów, grid kafelków i kontrolowane zaznaczenie w trybie edycji.
4. SymbolInspector v1: kontekstowa edycja nazwy, wyglądu, połączenia i dwell time zaznaczonego symbolu.
5. SymbolTile use mode: lokalna synteza mowy, aktywacja kliknięciem/klawiaturą, lekki dwell progress, powtarzanie i demonstracyjne linkowanie.
6. Home / CommunicationBook Library: tworzenie i otwieranie książek, responsywne karty oraz lekkie preview głównej tablicy; późniejszy etap Repository dodał trwałość danych.
7. BoardSettings v1: lokalna konfiguracja gridu, domyślnego dwell time i wyglądu nowych symboli.
8. Natywne Repository/IndexedDB oraz wersjonowany import i eksport całej `CommunicationBook` z obrazami i remapowaniem ID.
9. Realistyczne, syntetyczne CommunicationBooks ładowane i usuwane wyłącznie akcjami developerskimi.
10. PWA v1: instalowalny manifest, wersjonowany offline app shell, status sieci, kontrolowane aktualizacje i produkcyjne testy offline.

## Kolejne etapy

1. Bezpieczne migracje starszych wersji schematu i domknięcie polityki autosave dla wszystkich przyszłych operacji.
2. Dalsze utwardzenie trybu dziecka na rzeczywistych urządzeniach wspomagających.
3. Finalny routing URL między zapisanymi tablicami.
5. Dalsze testy E2E krytycznych przepływów; kontrola PWA offline i automatyczne testy dostępności są już obecne i będą rozszerzane.
6. Finalne ikony/branding PWA oraz manualna walidacja instalacji i aktualizacji na docelowych urządzeniach.

Każdy etap powinien pozostać mały, testowalny i kończyć się oceną dostępności, prywatności, wydajności oraz aktualności dokumentacji.
