# Plan rozwoju

## Etap 0 — fundament

- konfiguracja React, TypeScript i Vite,
- lint, testy komponentowe i build w CI,
- dokumentacja zasad jakości, dostępności i prywatności.

## Zrealizowane etapy

1. Model domenowy książki, tablicy i symbolu wraz z testami.
2. Board v1: wspólny, dostępny kontener trybów edycji i użycia bez symboli i storage.
3. SymbolTile v1: lokalne dodawanie zoptymalizowanych obrazów, grid kafelków i kontrolowane zaznaczenie w trybie edycji.
4. SymbolInspector v1: kontekstowa edycja danych, transformacji, wyglądu, połączenia i dwell time zaznaczonego symbolu.

## Kolejne etapy

1. Warstwa lokalnego zapisu w IndexedDB i bezpieczne migracje schematu.
2. Lekki i odporny tryb dziecka z obsługą klawiatury, dotyku i wskaźnika.
3. Synteza mowy oraz aktywacja dwell time.
4. Import i eksport z walidacją i lokalną obsługą obrazów.
5. Testy E2E krytycznych przepływów; automatyczne kontrole dostępności są już obecne i będą rozszerzane.
6. Offline, service worker i instalowalne PWA.

Każdy etap powinien pozostać mały, testowalny i kończyć się oceną dostępności, prywatności, wydajności oraz aktualności dokumentacji.
