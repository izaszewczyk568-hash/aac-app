# AAC

Webowa aplikacja komunikacji wspomagającej i alternatywnej (AAC). Projekt jest na etapie fundamentu technicznego; właściwe funkcje komunikacyjne nie zostały jeszcze zaimplementowane.

## Wymagania

- Node.js 22.12 lub nowszy
- npm

## Uruchomienie

```bash
npm ci
npm run dev
```

Po uruchomieniu lokalny adres wyświetla tymczasowy ekran demonstracyjny komponentów `Board`, `SymbolTile` i `SymbolInspector`. Kontrolki nad tablicą pozwalają przełączać tryby `edit`/`use` i prezentacyjne stany zapisu. W trybie `edit` można lokalnie wybrać obraz, dodać zoptymalizowany symbol, zmieniać zaznaczenie kafelków i edytować dane wybranego symbolu. Jest to wyłącznie narzędzie developerskie: dane istnieją w pamięci do odświeżenia strony, nie trafiają do storage ani sieci i nie stanowią docelowego interfejsu produktu.

## Kontrole jakości

```bash
npm run lint
npm run test
npm run test:a11y
npm run build
```

Testy jednostkowe i komponentowe działają w Vitest i jsdom, a Testing Library wspiera testowanie komponentów przez ich dostępne role i treść. `npm run test:a11y` uruchamia Playwright z Chromium i skanuje aktualne stany developerskiego preview przez `@axe-core/playwright`. Skany axe nie zastępują manualnych kontroli dostępności ani nie oznaczają pełnej zgodności z WCAG. Właściwe scenariusze E2E produktu pozostają do dodania wraz z pierwszym krytycznym przepływem użytkownika.

Te same kontrole wykonuje GitHub Actions po każdym pushu do `main` oraz dla pull requestów kierowanych do `main`. Zależności w CI są instalowane przez `npm ci` na podstawie pliku blokady.

## Praca z repozytorium

Główną gałęzią jest `main`. Większe zmiany mogą być rozwijane na gałęziach `feature/...` i włączane przez pull request.

Nie commituj plików `.env`, sekretów, prawdziwych danych użytkowników ani rzeczywistych eksportów książek AAC. `.env.example` pozostaje wersjonowanym, bezpiecznym szablonem. Lokalne eksporty i prywatne dane umieszczaj odpowiednio w ignorowanych katalogach `exports/`, `private/` lub `user-data/`.

## Dokumentacja

- [Produkt](docs/PRODUCT.md)
- [Architektura](docs/ARCHITECTURE.md)
- [Komponenty](docs/COMPONENTS.md)
- [Dostępność](docs/ACCESSIBILITY.md)
- [Dane i prywatność](docs/DATA_PRIVACY.md)
- [Decyzje](docs/DECISIONS.md)
- [Plan rozwoju](docs/ROADMAP.md)

## Status

Obecnie ekran aplikacji udostępnia lokalny podgląd developerski `Board v1`, `SymbolTile v1` i `SymbolInspector v1`. IndexedDB, aktywacja dwell, synteza mowy, PWA, import/eksport i docelowy interfejs AAC pozostają poza zakresem tego etapu.
