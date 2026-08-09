# Dostępność

## Cel

Dostępność jest wymaganiem podstawowym, ze szczególnym uwzględnieniem dzieci korzystających z dotyku, klawiatury, przełączników i eyetrackera działającego jak wskaźnik.

## Standard pracy

- semantyczny HTML i logiczna hierarchia nagłówków,
- pełna obsługa Tab, Enter i Space,
- widoczny fokus i brak pułapek klawiaturowych,
- odpowiednio duże cele dotykowe i bezpieczne odstępy,
- brak znaczenia przekazywanego wyłącznie kolorem,
- wsparcie powiększenia, wysokiego kontrastu i ograniczenia ruchu,
- komunikaty zrozumiałe bez dźwięku,
- ręczne testy z klawiaturą i czytnikiem ekranu.

## Automatyzacja

Test komponentu używa ról dostępności. Po pojawieniu się interaktywnych ekranów należy dodać automatyczne reguły dostępności do testów komponentowych oraz krytycznych testów E2E. Automaty nie zastępują przeglądu ręcznego.

## Obecny ekran

Ma pojedynczy element `main`, nagłówek pierwszego poziomu, tekstową informację, poprawny język dokumentu i responsywną typografię. Nie zawiera elementów interaktywnych.
