# AAC

Webowa aplikacja komunikacji wspomagającej i alternatywnej (AAC), która pomaga tworzyć księgi komunikacyjne oraz używać symboli do wyrażania potrzeb, wyborów i emocji.

Aplikacja jest local-first: nie wymaga konta ani synchronizacji z chmurą. Księgi i obrazy zapisuje lokalnie w IndexedDB bieżącej przeglądarki. Wyczyszczenie danych strony może je usunąć, dlatego ważne `CommunicationBook` należy regularnie eksportować do plików `.aacbook` jako kopie zapasowe.

## Wymagania i uruchomienie

- Node.js 22.12 lub nowszy
- npm

```bash
npm ci
npm run dev
```

Home pozwala utworzyć, otworzyć, zmienić nazwę, usunąć, zaimportować lub wyeksportować księgę. Istniejąca tablica otwiera się w trybie `use`, nowa w `edit`. W trybie developerskim jawna akcja `Załaduj dane demo` zapisuje pięć syntetycznych ksiąg; fixtures nie są dodawane automatycznie.

Plik `.aacbook` jest lokalną, wersjonowaną kopią jednej `CommunicationBook` wraz z jej tablicami, symbolami i obrazami. Import i eksport nie wysyłają danych do sieci. Eksport nie dołącza innych ksiąg wskazanych przez linki między tablicami.

## Kontrole jakości

```bash
npm run lint
npm run test
npm run test:a11y
npm run build
npm run test:e2e
npm run test:pwa
```

Vitest i Testing Library obsługują testy jednostkowe/komponentowe. Playwright z `@axe-core/playwright` wykonuje automatyczne skany dostępności; zielony axe nie zastępuje manualnych kontroli ani nie oznacza pełnej zgodności z WCAG. Testy E2E sprawdzają krytyczny przepływ produkcyjny, a testy PWA manifest, app shell i pracę po odcięciu sieci.

GitHub Actions uruchamia kontrole po pushu do `main` oraz dla pull requestów do `main`. Produkcyjna aplikacja po pierwszym poprawnym uruchomieniu online może działać offline; dane ksiąg nadal pozostają wyłącznie w IndexedDB.

## Wersja publiczna

Po zielonych kontrolach push do `main` automatycznie buduje i publikuje aplikację przez GitHub Pages pod adresem `https://izaszewczyk568-hash.github.io/aac-app/`. Build deploymentu używa bazowej ścieżki `/aac-app/`; lokalne komendy nadal działają pod `/`. Hosting obejmuje tylko statyczny app shell. Księgi, obrazy i ustawienia użytkownika pozostają w IndexedDB konkretnej przeglądarki i nie są wysyłane do GitHub.

## Bezpieczeństwo repozytorium

Główną gałęzią jest `main`; większe zmiany mogą powstawać na `feature/...`. Nie commituj `.env`, sekretów, prawdziwych danych użytkowników ani rzeczywistych eksportów `.aacbook`. `.env.example` pozostaje bezpiecznym, wersjonowanym szablonem. Lokalne dane umieszczaj w ignorowanych katalogach `exports/`, `private/` lub `user-data/`.

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

Aplikacja ma lokalne Repository/IndexedDB, autosave, import/eksport jednej księgi, powiązania tablic także między księgami, PWA v1 oraz developerskie fixtures. Finalny routing URL i docelowy caregiver lock pozostają poza zakresem obecnego etapu.
