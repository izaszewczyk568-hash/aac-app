# AAC

Webowa aplikacja komunikacji wspomagającej i alternatywnej (AAC), która pomaga tworzyć książki komunikacyjne i używać symboli do wyrażania potrzeb, wyborów oraz emocji.

Aplikacja jest local-first: nie wymaga konta, nie posiada synchronizacji z chmurą, a książki i obrazy zapisuje lokalnie w IndexedDB bieżącej przeglądarki. Wyczyszczenie danych strony może usunąć te dane, dlatego należy regularnie eksportować ważne `CommunicationBook` do plików `.aacbook` jako kopie zapasowe.

## Wymagania

- Node.js 22.12 lub nowszy
- npm

## Uruchomienie

```bash
npm ci
npm run dev
```

Po uruchomieniu lokalny adres wyświetla `Home / CommunicationBook Library`, z którego można utworzyć, otworzyć, zaimportować albo wyeksportować książkę komunikacyjną. W trybie developerskim akcja `Załaduj dane demo` zapisuje do lokalnego IndexedDB pięć syntetycznych książek, a `Usuń dane demo` usuwa wyłącznie ich oryginalne ID. Dane demo nie są dodawane automatycznie. W `use` symbol można aktywować kliknięciem, dotykiem, Enter, Space lub dwell i usłyszeć jego nazwę przez lokalne Web Speech API.

Plik `.aacbook` jest wersjonowaną, lokalną kopią całej `CommunicationBook`, łącznie z tablicami, symbolami, relacjami i obrazami. Import i eksport odbywają się w przeglądarce bez wysyłania danych. Obrazy są kodowane base64 wyłącznie na czas zapisu pliku, co zwiększa jego rozmiar względem danych binarnych.

## Kontrole jakości

```bash
npm run lint
npm run test
npm run test:a11y
npm run build
npm run test:e2e
npm run test:pwa
```

Testy jednostkowe i komponentowe działają w Vitest i jsdom, a Testing Library wspiera testowanie komponentów przez ich dostępne role i treść. `npm run test:a11y` uruchamia Playwright z Chromium i skanuje aktualne stany developerskiego preview przez `@axe-core/playwright`. Skany axe nie zastępują manualnych kontroli dostępności ani nie oznaczają pełnej zgodności z WCAG. Po `npm run build` skrypt `npm run test:e2e` sprawdza krytyczny przepływ produkcyjny, a `npm run test:pwa` weryfikuje manifest, cache app shell oraz ten przepływ po rzeczywistym odcięciu sieci.

Te same kontrole wykonuje GitHub Actions po każdym pushu do `main` oraz dla pull requestów kierowanych do `main`. Zależności w CI są instalowane przez `npm ci` na podstawie pliku blokady. Po pierwszym uruchomieniu online produkcyjna aplikacja buforuje własny app shell i może zostać zainstalowana natywnym mechanizmem przeglądarki. Dane książek pozostają w IndexedDB i nie trafiają do cache service workera.

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
- [Finalny release review](docs/RELEASE_REVIEW.md)
- [Release notes 0.1.0](RELEASE_NOTES.md)

## Status

Obecnie aplikacja ma natywne repozytorium IndexedDB, lokalny import/eksport całej książki, developerskie fixtures oraz PWA v1 z app shellem offline, manifestem i kontrolowaną aktualizacją. Finalny routing i docelowy interfejs AAC pozostają poza zakresem tego etapu. Ikona PWA jest neutralnym zasobem roboczym; finalny branding i dodatkowe warianty ikon pozostają do przygotowania przed wydaniem.
