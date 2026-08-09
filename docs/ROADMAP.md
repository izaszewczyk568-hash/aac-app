# Plan rozwoju

## Etap 0 — fundament

- konfiguracja React, TypeScript i Vite,
- lint, testy komponentowe i build w CI,
- dokumentacja zasad jakości, dostępności i prywatności.

## Zrealizowane etapy

1. Model domenowy książki, tablicy i symbolu wraz z testami.
2. Board v1: wspólny, dostępny kontener trybów edycji i użycia bez symboli i storage.

## Kolejne etapy

1. Warstwa lokalnego zapisu w IndexedDB i bezpieczne migracje schematu.
2. Rozwinięcie dostępnego trybu edycji.
3. Lekki i odporny tryb dziecka z obsługą klawiatury, dotyku i wskaźnika.
4. Synteza mowy oraz ustawienia dwell time.
5. Import i eksport z walidacją i lokalną obsługą obrazów.
6. Testy E2E krytycznych przepływów i automatyczne kontrole dostępności.
7. Offline, service worker i instalowalne PWA.

Każdy etap powinien pozostać mały, testowalny i kończyć się oceną dostępności, prywatności, wydajności oraz aktualności dokumentacji.
