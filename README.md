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

Po uruchomieniu lokalny adres wyświetla tymczasowy ekran demonstracyjny komponentu `Board`. Kontrolki nad tablicą pozwalają przełączać tryby `edit`/`use` i prezentacyjne stany zapisu. Jest to wyłącznie narzędzie developerskie: używa sztucznych danych, nie zapisuje zmian i nie stanowi docelowego interfejsu produktu.

## Kontrole jakości

```bash
npm run lint
npm run test
npm run build
```

Testy działają w Vitest i jsdom, a Testing Library wspiera testowanie komponentów przez ich dostępne role i treść. Konfigurację przyszłych testów E2E należy dodać wraz z pierwszym przepływem użytkownika.

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

Obecnie ekran aplikacji udostępnia wyłącznie lokalny podgląd developerski `Board v1`. Dane książek, IndexedDB, PWA, synteza mowy, import/eksport i docelowy interfejs AAC pozostają poza zakresem tego etapu.
