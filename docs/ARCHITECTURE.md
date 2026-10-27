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

Stan widoku realizuje przepływ `Home → CommunicationBook → Board` bez nowej biblioteki routingu. `Home`, `Board` i `SymbolInspector` otrzymują dane i callbacki; nie wywołują IndexedDB. `App` koordynuje Repository, autosave, runtime URL, mowę, nawigację i pełnoekranową sesję dziecka. Fullscreen API jest wywoływane na stabilnym korzeniu aplikacji, dlatego tryb pozostaje aktywny podczas zmiany widoku z ksiąg na tablice i symbole. Nowa tablica jest najpierw zapisywana lokalnie, a następnie otwierana w osobnej karcie przez lekki adres `?book=…&board=…&mode=edit`; podczas startu `App` odtwarza wskazany widok z Repository. Nie wprowadzono zależności od routera.

Board ID są globalnie unikalne: nowe ID powstają przez `crypto.randomUUID`, a import remapuje konflikty względem wszystkich lokalnych ksiąg. Dlatego cross-book link nadal używa wyłącznie stabilnego `linkedBoardId`; nie dodano `linkedBookId` ani nowej wersji schematu. Historia nawigacji przechowuje pary `{bookId, boardId}`. Po przejściu aktualizowane są oba konteksty, a „Tablica główna” korzysta z `mainBoardId` bieżącej księgi.

## Dane i obrazy

Model domenowy `CommunicationBook → Board → Symbol` nie zależy od Reacta ani storage. `mainBoardId` jest jedynym źródłem głównej tablicy. `CommunicationBook.coverImage` przechowuje opcjonalne metadane obrazu wgranego podczas tworzenia księgi, `CommunicationBook.coverSymbolId` wskazuje później wybrany symbol z tej samej księgi, a `Board.coverSymbolId` symbol z tej konkretnej tablicy. Pola okładek są opcjonalne; starsze zgodne dane bez nich są interpretowane jak `null`. To wstecznie zgodne rozszerzenie schematu 4. Układ wykorzystuje `columns` i `position`, bez x/y. Bloby obrazów pozostają w Repository, a model przechowuje wyłącznie metadane.

Źródłowe obrazy symboli i okładek ksiąg są lokalnie optymalizowane przez natywne API. Miniatura księgi preferuje jej `coverSymbolId`, potem bezpośredni `coverImage`, a następnie bezpiecznie wraca do pierwszego obrazu głównej tablicy. Dzięki temu okładka dodana przy tworzeniu działa od razu, a późniejszy wybór symbolu może ją zastąpić. Okładka tablicy preferuje jej `coverSymbolId`, a następnie pierwszy dostępny obraz tej tablicy według `position`. Podglądy powstają wyłącznie z lokalnych danych i nie wysyłają obrazu poza urządzenie.

## Import i eksport

`.aacbook` zawiera jeden agregat `CommunicationBook` oraz wszystkie jego obrazy, w tym opcjonalną bezpośrednią okładkę księgi. Import waliduje strukturę, parent relations, wersję i obrazy oraz remapuje kolizje globalnych ID. `linkedBoardId` może wskazywać poza importowany agregat, więc nie jest odrzucany tylko z powodu braku celu w pliku.

Eksport jednej księgi nie dołącza innych ksiąg. Zewnętrzny `linkedBoardId` pozostaje w danych. Jeśli po imporcie target nie istnieje lokalnie, mowa symbolu nadal działa, próba nawigacji pokazuje bezpieczny komunikat, a aplikacja nie crashuje.

## PWA i granice

Service worker buforuje wyłącznie app shell tego samego originu i respektuje bazową ścieżkę deploymentu (`/` lokalnie, `/aac-app/` w GitHub Pages). Manifest używa relatywnego scope/start URL, dzięki czemu instalacja PWA pozostaje ograniczona do właściwej aplikacji. IndexedDB, Bloby, adresy `blob:` i `.aacbook` nie trafiają do Cache Storage. Brak backendu, telemetrii, cloud sync, finalnego routingu URL i caregiver locka.
