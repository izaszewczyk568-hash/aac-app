# AAC MVP 0.1.0

Pierwsza wersja MVP aplikacji AAC obejmuje:

- bibliotekę `CommunicationBook` i wiele tablic `Board`,
- edycję symboli przez `SymbolInspector`,
- lokalne dodawanie i optymalizację obrazów,
- syntezę mowy przez przeglądarkę,
- aktywację symboli kliknięciem, klawiaturą oraz gaze/dwell,
- nawigację między połączonymi tablicami,
- lokalny zapis w IndexedDB i autosave,
- import i eksport całej książki komunikacyjnej,
- instalowalne PWA z app shellem offline,
- podstawową obsługę dostępności oraz automatyczne kontrole axe.

## Known limitations

- Brak kont użytkowników i synchronizacji z chmurą.
- Dostępność głosów syntezy mowy zależy od przeglądarki i systemu operacyjnego.
- Dane lokalne mogą zostać utracone po wyczyszczeniu danych strony; ważne książki należy regularnie eksportować jako backup `.aacbook`.
