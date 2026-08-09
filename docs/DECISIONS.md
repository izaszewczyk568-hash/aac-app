# Decyzje techniczne

## 001 — React, TypeScript i Vite

**Status:** przyjęta

Lekki fundament z szybkim środowiskiem developerskim, statycznym typowaniem i szerokim wsparciem przeglądarek. Projekt nie dodaje frameworka serwerowego, ponieważ MVP jest local-first i nie wymaga backendu.

## 002 — Vitest, jsdom i Testing Library

**Status:** przyjęta

Test runner współdzieli konfigurację i sposób transformacji z Vite. Testing Library promuje testowanie przez zachowanie dostępne dla użytkownika.

## 003 — Brak narzędzia E2E na etapie pustego fundamentu

**Status:** przyjęta

Struktura i skrypty pozwalają dodać testy przeglądarkowe wraz z pierwszym krytycznym przepływem. Instalację przeglądarek i zależności odkładamy, aby nie zwiększać kosztu projektu bez rzeczywistego scenariusza.

## 004 — Node.js 22 w CI

**Status:** przyjęta

Używana jest aktywna linia LTS wspierana przez obecny zestaw narzędzi. Instalacja w CI korzysta z pliku blokady zależności.

## 005 — GitHub i GitHub Actions

**Status:** przyjęta

Kod będzie utrzymywany w GitHub, a automatyczne kontrole zapewnia GitHub Actions. `main` jest główną gałęzią; workflow działa dla pushów do `main` oraz pull requestów kierowanych do `main`. Większe zmiany mogą powstawać na gałęziach `feature/...`.
