import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import type { CommunicationBook } from '../../domain/communicationBook'
import { getBookDisplayName, untitledBookLabel } from './homeUtils'
import './Home.css'

export interface HomeProps {
  books: CommunicationBook[]
  onCreateBook: (name: string) => void
  onOpenBook: (bookId: string) => void
  onImportBook?: (file: File) => void | Promise<void>
  onExportBook?: (bookId: string) => void | Promise<void>
  imageSources?: Record<string, string>
  transferNotice?: {
    type: 'status' | 'success' | 'error'
    message: string
  } | null
}

export function Home({ books, onCreateBook, onOpenBook, onImportBook, onExportBook, imageSources = {}, transferNotice }: HomeProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const titleId = useId()
  const nameId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const sortedBooks = [...books].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  useEffect(() => {
    if (isCreateOpen) nameRef.current?.focus()
  }, [isCreateOpen])

  function closeCreate() {
    setIsCreateOpen(false)
    window.setTimeout(() => createButtonRef.current?.focus())
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeCreate()
      return
    }
    if (event.key === 'Tab') {
      const first = nameRef.current
      const last = submitRef.current
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void onImportBook?.(file)
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      const bookId = openMenuId
      setOpenMenuId(null)
      window.setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-book-menu="${bookId}"]`)?.focus())
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      items[(index + direction + items.length) % items.length]?.focus()
    }
  }

  return (
    <main className="home">
      <section className="home__hero" aria-labelledby="home-title">
        <h1 id="home-title">Rozpocznij pracę z książką AAC</h1>
        <div className="home__actions">
          <button ref={createButtonRef} type="button" className="home__primary" onClick={() => setIsCreateOpen(true)}>
            + Utwórz nową książkę
          </button>
          <button type="button" className="home__secondary" onClick={() => importInputRef.current?.click()} disabled={!onImportBook} aria-describedby={!onImportBook ? 'import-unavailable' : undefined}>
            <span aria-hidden="true">⇧</span> Importuj książkę z pliku
          </button>
          <input
            ref={importInputRef}
            className="home__visually-hidden"
            type="file"
            accept=".aacbook,application/vnd.aacbook+json"
            aria-label="Wybierz plik kopii książki AAC"
            onChange={handleImportChange}
          />
          {!onImportBook && <span id="import-unavailable" className="home__visually-hidden">Import nie jest jeszcze dostępny</span>}
        </div>
        {transferNotice && (
          <div className={`home__transfer home__transfer--${transferNotice.type}`}>
            <p role={transferNotice.type === 'error' ? 'alert' : 'status'}>{transferNotice.message}</p>
            {transferNotice.type === 'error' && (
              <button type="button" onClick={() => importInputRef.current?.click()}>Spróbuj ponownie</button>
            )}
          </div>
        )}
      </section>

      {sortedBooks.length > 0 && (
        <section className="home__recent" aria-labelledby="recent-title">
          <h2 id="recent-title">Ostatnio używane</h2>
          <ul className="home__book-grid">
            {sortedBooks.map((book) => {
              const displayName = getBookDisplayName(book.name)
              const mainBoard = book.boards.find((board) => board.id === book.mainBoardId)
              return (
                <li key={book.id} className="book-card">
                  <div className="book-card__preview" aria-hidden="true">
                    {mainBoard?.symbols.slice(0, 8).map((symbol) => (
                      <span key={symbol.id} style={{ borderColor: symbol.borderColor, color: symbol.textColor }}>
                        {symbol.image && imageSources[symbol.image.id]
                          ? <img src={imageSources[symbol.image.id]} alt="" />
                          : symbol.label.slice(0, 1)}
                      </span>
                    ))}
                  </div>
                  <div className="book-card__details">
                    <div>
                      <h3>{displayName}</h3>
                      <p>{book.boards.length} {book.boards.length === 1 ? 'tablica' : 'tablice'}</p>
                    </div>
                    <button type="button" className="book-card__open" onClick={() => onOpenBook(book.id)}>
                      Otwórz <span className="home__visually-hidden">książkę {displayName}</span>
                    </button>
                    <div className="book-card__more">
                      <button
                        type="button"
                        data-book-menu={book.id}
                        aria-label={`Więcej opcji książki ${displayName}`}
                        aria-expanded={openMenuId === book.id}
                        onClick={() => setOpenMenuId((current) => current === book.id ? null : book.id)}
                      >⋮</button>
                      {openMenuId === book.id && (
                        <div role="menu" aria-label={`Opcje książki ${displayName}`} onKeyDown={handleMenuKeyDown}>
                          <button autoFocus type="button" role="menuitem" onClick={() => onOpenBook(book.id)}>Otwórz</button>
                          {onExportBook && (
                            <button type="button" role="menuitem" onClick={() => {
                              setOpenMenuId(null)
                              void onExportBook(book.id)
                            }}>Eksportuj książkę</button>
                          )}
                          <p>Zmiana nazwy i usuwanie nie są jeszcze dostępne.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {isCreateOpen && (
        <div className="home__dialog-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="home__dialog" onKeyDown={handleDialogKeyDown}>
            <h2 id={titleId}>Utwórz nową książkę</h2>
            <form onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              onCreateBook(String(form.get('bookName') ?? ''))
              setIsCreateOpen(false)
            }}>
              <label htmlFor={nameId}>Nazwa książki <span>(opcjonalnie)</span></label>
              <input ref={nameRef} id={nameId} name="bookName" autoComplete="off" placeholder={untitledBookLabel} />
              <div>
                <button type="button" onClick={closeCreate}>Anuluj</button>
                <button ref={submitRef} type="submit" className="home__primary">Utwórz książkę</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
