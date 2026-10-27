# Dane i prywatność

## Zasady

- księgi komunikacyjne i obrazy pozostają lokalnie w przeglądarce,
- MVP nie ma backendu, kont, analityki, telemetrii ani cloud sync,
- repozytorium kodu nie zawiera sekretów, prawdziwych danych użytkowników ani rzeczywistych `.aacbook`,
- import, eksport i usunięcie wymagają jawnej czynności użytkownika,
- komunikaty błędów nie ujawniają treści ksiąg.

## Przepływ danych

Repository przechowuje księgi oraz Bloby obrazów symboli i opcjonalnych okładek w IndexedDB. Obraz okładki wybrany przy tworzeniu jest przetwarzany lokalnie i nie opuszcza urządzenia. Runtime URL oraz miniatury PNG nie są utrwalane i są zwalniane. Zmiana nazwy i utworzenie tablicy zapisują się przez ten sam lokalny Repository. Usunięcie księgi transakcyjnie usuwa jej agregat i należące do niego obrazy bez naruszania innych ksiąg.

Import i eksport działają wyłącznie lokalnie. Eksport jednej księgi nie pobiera danych z księgi docelowej cross-book linku. Sam stabilny `linkedBoardId` może pozostać w kopii, ale nie zawiera treści drugiej księgi. Cache Storage obejmuje tylko publiczny app shell, nigdy IndexedDB, obrazy użytkownika ani eksporty.

Formularze nie proszą o imię dziecka, diagnozę ani dane osobowe. Fixtures są syntetyczne, uruchamiane wyłącznie jawną akcją developmentu i nie seedują się automatycznie. Ich piktogramy są generowane lokalnie w przeglądarce, bez pobierania obrazów i wysyłania danych do usług zewnętrznych.
