# Plan rozwoju

## Zrealizowane

1. Fundament React/TypeScript/Vite, testy, lint i GitHub Actions.
2. Wersjonowany model `CommunicationBook → Board → Symbol`.
3. Board edit/use, SymbolTile, SymbolInspector i BoardSettings.
4. Lokalna synteza mowy, dwell i aktywacja klawiaturą/dotykiem.
5. Home z zarządzaniem księgami, wspólnymi kartami i runtime PNG thumbnail.
6. Repository/IndexedDB, autosave i bezpieczne usuwanie agregatu.
7. Import/eksport jednej księgi, remapowanie ID i obsługa niedostępnych cross-book links.
8. Nawigacja między tablicami także w różnych księgach z historią `{bookId, boardId}`.
9. Dostępne automatyczne skany axe, E2E i testy PWA/offline.
10. PWA v1 oraz jawnie ładowane syntetyczne fixtures developmentu.
11. Automatyczny deployment statycznej aplikacji do GitHub Pages po zielonym CI na `main`.

## Kolejne etapy

1. Bezpieczne migracje starszych wersji schematu.
2. Dalsze testy na rzeczywistych urządzeniach wspomagających i caregiver lock jako rozważenie Post-MVP.
3. Finalny routing URL między zapisanymi tablicami.
4. Dalsze E2E cross-book, importu i zarządzania danymi.
5. Finalne ikony/branding PWA i manualna walidacja instalacji.

Undo/Redo nie jest elementem MVP, dopóki nie istnieje poprawna historia zmian.
