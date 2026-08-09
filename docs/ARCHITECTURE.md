# Architektura

## Fundament

- React, TypeScript i Vite,
- Vitest, jsdom i Testing Library,
- Playwright oraz `@axe-core/playwright`,
- natywny IndexedDB za `CommunicationBookRepository`,
- PWA app shell generowany podczas buildu,
- ESLint i GitHub Actions na Node.js 22.

CI dla push/PR do `main` wykonuje instalację z lockfile, lint, testy unit/component, testy a11y, build, E2E i PWA/offline zgodnie ze skryptami projektu. Po zielonym CI dla pushu do `main` osobny job buduje app shell z `VITE_BASE_PATH=/aac-app/` i publikuje katalog `dist` w GitHub Pages. Pull requesty nigdy nie wykonują deploymentu.

## Warstwy i nawigacja

Stan widoku realizuje przepływ `Home → CommunicationBook → Board` bez nowej biblioteki routingu. `Home`, `Board` i `SymbolInspector` otrzymują dane i callbacki; nie wywołują IndexedDB. `App` koordynuje Repository, autosave, runtime URL, mowę i nawigację. Nowa tablica jest najpierw zapisywana lokalnie, a następnie otwierana w osobnej karcie przez lekki adres `?book=…&board=…&mode=edit`; podczas startu `App` odtwarza wskazany widok z Repository. Nie wprowadzono zależności od routera.

Board ID są globalnie unikalne: nowe ID powstają przez `crypto.randomUUID`, a import remapuje konflikty względem wszystkich lokalnych ksiąg. Dlatego cross-book link nadal używa wyłącznie stabilnego `linkedBoardId`; nie dodano `linkedBookId` ani nowej wersji schematu. Historia nawigacji przechowuje pary `{bookId, boardId}`. Po przejściu aktualizowane są oba konteksty, a „Tablica główna” korzysta z `mainBoardId` bieżącej księgi.

## Dane i obrazy

Model domenowy `CommunicationBook → Board → Symbol` nie zależy od Reacta ani storage. `mainBoardId` jest jedynym źródłem głównej tablicy. Układ wykorzystuje `columns` i `position`, bez x/y. Obrazy są Blobami w Repository, a model przechowuje metadane.

Źródłowy obraz symbolu jest lokalnie optymalizowany przez natywne API. Miniatura karty jest osobną, lekką reprezentacją PNG tworzoną tylko w runtime; nie zmienia źródła, nie jest zapisywana w IndexedDB i ma zwalniany object URL.

## Import i eksport

`.aacbook` zawiera jeden agregat `CommunicationBook` oraz jego obrazy. Import waliduje strukturę, parent relations, wersję i obrazy oraz remapuje kolizje globalnych ID. `linkedBoardId` może wskazywać poza importowany agregat, więc nie jest odrzucany tylko z powodu braku celu w pliku.

Eksport jednej księgi nie dołącza innych ksiąg. Zewnętrzny `linkedBoardId` pozostaje w danych. Jeśli po imporcie target nie istnieje lokalnie, mowa symbolu nadal działa, próba nawigacji pokazuje bezpieczny komunikat, a aplikacja nie crashuje.

## PWA i granice

Service worker buforuje wyłącznie app shell tego samego originu i respektuje bazową ścieżkę deploymentu (`/` lokalnie, `/aac-app/` w GitHub Pages). Manifest używa relatywnego scope/start URL, dzięki czemu instalacja PWA pozostaje ograniczona do właściwej aplikacji. IndexedDB, Bloby, adresy `blob:` i `.aacbook` nie trafiają do Cache Storage. Brak backendu, telemetrii, cloud sync, finalnego routingu URL i caregiver locka.
