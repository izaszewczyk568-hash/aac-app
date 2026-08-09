# Architektura

## Fundament

- React i TypeScript do interfejsu,
- Vite do środowiska developerskiego i budowania,
- Vitest, jsdom i Testing Library do testów jednostkowych i komponentowych,
- ESLint do statycznej kontroli kodu,
- GitHub Actions do powtarzalnej weryfikacji.

Workflow CI działa dla pushów do `main` i pull requestów kierowanych do `main`. Używa Node.js 22, instaluje zależności przez `npm ci`, a następnie wykonuje lint, testy jednostkowe i build.

## Kierunek rozwoju

Architektura pozostaje local-first. Warstwa widoku nie powinna zależeć bezpośrednio od mechanizmu trwałego zapisu. Przyszły dostęp do IndexedDB należy ukryć za małym, testowalnym interfejsem repozytorium. Tryb dziecka powinien mieć możliwie krótki krytyczny przepływ, mało zależności i bezpieczne zachowanie przy błędach.

## Testy E2E i dostępności

Projekt jest gotowy do dodania osobnego katalogu testów E2E oraz narzędzia automatycznej kontroli dostępności, gdy pojawi się pierwszy rzeczywisty przepływ. Nie dodajemy jeszcze ciężkiego środowiska przeglądarkowego bez testowanego scenariusza. Semantyczne zapytania Testing Library stanowią podstawę testów komponentowych.

## Granice obecnego etapu

Brak modelu domenowego, trwałego zapisu, routingu, service workera, telemetrii i połączeń z backendem.
