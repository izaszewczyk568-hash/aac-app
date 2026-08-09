import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type RefObject } from 'react'
import type { CommunicationBook } from '../../domain/communicationBook'
import { getBoardCountLabel, getBookDisplayName, untitledBookLabel } from './homeUtils'
import './Home.css'

export interface HomeProps {
  books: CommunicationBook[]
  onCreateBook: (name: string) => void | Promise<void>
  onOpenBook: (bookId: string) => void
  onRenameBook?: (bookId: string, name: string) => void | Promise<void>
  onDeleteBook?: (bookId: string) => void | Promise<void>
  onImportBook?: (file: File) => void | Promise<void>
  onExportBook?: (bookId: string) => void | Promise<void>
  thumbnailSources?: Record<string, string>
  addedBookId?: string | null
  transferNotice?: {
    type: 'status' | 'success' | 'error'
    message: string
  } | null
}

interface CommunicationBookCardProps {
  book: CommunicationBook
  menuKey: string
  thumbnailSource?: string
  isMenuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpen: () => void
  onEdit?: () => void
  onExport?: () => void
  onDelete?: () => void
}

export function CommunicationBookCard({
  book,
  menuKey,
  thumbnailSource,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onEdit,
  onExport,
  onDelete,
}: CommunicationBookCardProps) {
  const displayName = getBookDisplayName(book.name)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      onCloseMenu()
      window.setTimeout(() => menuButtonRef.current?.focus())
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      items[(index + direction + items.length) % items.length]?.focus()
    }
  }

  return (
    <article className="book-card">
      <div className="book-card__preview" aria-hidden="true">
        {thumbnailSource
          ? <img src={thumbnailSource} alt="" />
          : <span className="book-card__placeholder">AAC</span>}
      </div>
      <div className="book-card__details">
        <div>
          <h3>{displayName}</h3>
          <p>{getBoardCountLabel(book.boards.length)}</p>
        </div>
        <button type="button" className="book-card__open" onClick={onOpen}>
          Otwórz <span className="home__visually-hidden">księgę {displayName}</span>
        </button>
        <div className="book-card__more">
          <button
            ref={menuButtonRef}
            type="button"
            data-book-menu={menuKey}
            aria-label={`Więcej opcji księgi ${displayName}`}
            aria-expanded={isMenuOpen}
            onClick={onToggleMenu}
          >⋮</button>
          {isMenuOpen && (
            <div role="menu" aria-label={`Opcje księgi ${displayName}`} onKeyDown={handleMenuKeyDown}>
              <button autoFocus type="button" role="menuitem" onClick={onOpen}>Otwórz</button>
              <button type="button" role="menuitem" onClick={onEdit} disabled={!onEdit}>
                Edytuj księgę <span className="home__visually-hidden">{displayName}</span>
              </button>
              <button type="button" role="menuitem" onClick={onExport} disabled={!onExport}>
                Eksportuj księgę <span className="home__visually-hidden">{displayName}</span>
              </button>
              <button type="button" role="menuitem" className="book-card__danger" onClick={onDelete} disabled={!onDelete}>
                Usuń księgę <span className="home__visually-hidden">{displayName}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

type BookDialog = { kind: 'create' } | { kind: 'rename'; book: CommunicationBook }

export function Home({
  books,
  onCreateBook,
  onOpenBook,
  onRenameBook,
  onDeleteBook,
  onImportBook,
  onExportBook,
  thumbnailSources = {},
  addedBookId = null,
  transferNotice,
}: HomeProps) {
  const [bookDialog, setBookDialog] = useState<BookDialog | null>(null)
  const [deleteBook, setDeleteBook] = useState<CommunicationBook | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const dialogTitleId = useId()
  const deleteTitleId = useId()
  const nameId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const sortedBooks = [...books].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const addedBook = books.find((book) => book.id === addedBookId)

  useEffect(() => {
    if (bookDialog) nameRef.current?.focus()
  }, [bookDialog])

  useEffect(() => {
    if (deleteBook) cancelDeleteRef.current?.focus()
  }, [deleteBook])

  function restoreFocus() {
    window.setTimeout(() => (returnFocusRef.current ?? createButtonRef.current)?.focus())
  }

  function closeBookDialog() {
    setBookDialog(null)
    restoreFocus()
  }

  function trapDialogFocus(
    event: KeyboardEvent<HTMLDivElement>,
    first: RefObject<HTMLElement | null>,
    last: RefObject<HTMLElement | null>,
    close: () => void,
  ) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === first.current) {
        event.preventDefault()
        last.current?.focus()
      } else if (!event.shiftKey && document.activeElement === last.current) {
        event.preventDefault()
        first.current?.focus()
      }
    }
  }

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void onImportBook?.(file)
  }

  function renderCard(book: CommunicationBook, instance: 'added' | 'recent') {
    const menuKey = `${instance}-${book.id}`
    const startMenuAction = (action: () => void) => {
      returnFocusRef.current = document.querySelector(`[data-book-menu="${menuKey}"]`)
      setOpenMenuId(null)
      action()
    }
    return (
      <li key={menuKey}>
        <CommunicationBookCard
          book={book}
          menuKey={menuKey}
          thumbnailSource={thumbnailSources[book.id]}
          isMenuOpen={openMenuId === menuKey}
          onToggleMenu={() => setOpenMenuId((current) => current === menuKey ? null : menuKey)}
          onCloseMenu={() => setOpenMenuId(null)}
          onOpen={() => onOpenBook(book.id)}
          onEdit={onRenameBook ? () => startMenuAction(() => setBookDialog({ kind: 'rename', book })) : undefined}
          onExport={onExportBook ? () => startMenuAction(() => {
            void onExportBook(book.id)
            restoreFocus()
          }) : undefined}
          onDelete={onDeleteBook ? () => startMenuAction(() => setDeleteBook(book)) : undefined}
        />
      </li>
    )
  }

  return (
    <main className="home">
      <section className="home__hero" aria-labelledby="home-title">
        <h1 id="home-title">Rozpocznij pracę z Księgą AAC</h1>
        <div className="home__actions">
          <button ref={createButtonRef} type="button" className="home__primary" onClick={() => {
            returnFocusRef.current = createButtonRef.current
            setBookDialog({ kind: 'create' })
          }}>
            Utwórz nową księgę
          </button>
          <button type="button" className="home__secondary" onClick={() => importInputRef.current?.click()} disabled={!onImportBook}>
            <span aria-hidden="true">⇧</span> Importuj księgę z pliku
          </button>
          <input
            ref={importInputRef}
            className="home__visually-hidden"
            type="file"
            accept=".aacbook,application/vnd.aacbook+json"
            aria-label="Wybierz plik kopii księgi AAC"
            onChange={handleImportChange}
          />
        </div>
        {transferNotice && (
          <div className={`home__transfer home__transfer--${transferNotice.type}`}>
            <p role={transferNotice.type === 'error' ? 'alert' : 'status'} aria-live={transferNotice.type === 'error' ? 'assertive' : 'polite'}>
              {transferNotice.message}
            </p>
            {transferNotice.type === 'error' && (
              <button type="button" onClick={() => importInputRef.current?.click()}>Spróbuj ponownie</button>
            )}
          </div>
        )}
      </section>

      {addedBook && (
        <section className="home__recent" aria-labelledby="added-title">
          <h2 id="added-title">Dodana księga</h2>
          <ul className="home__book-grid">{renderCard(addedBook, 'added')}</ul>
        </section>
      )}

      {sortedBooks.length > 0 && (
        <section className="home__recent" aria-labelledby="recent-title">
          <h2 id="recent-title">Ostatnio używane</h2>
          <ul className="home__book-grid">{sortedBooks.map((book) => renderCard(book, 'recent'))}</ul>
        </section>
      )}

      {bookDialog && (
        <div className="home__dialog-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} className="home__dialog" onKeyDown={(event) => trapDialogFocus(event, nameRef, submitRef, closeBookDialog)}>
            <h2 id={dialogTitleId}>{bookDialog.kind === 'create' ? 'Utwórz nową księgę' : `Edytuj księgę ${getBookDisplayName(bookDialog.book.name)}`}</h2>
            <form onSubmit={(event) => {
              event.preventDefault()
              const name = String(new FormData(event.currentTarget).get('bookName') ?? '')
              if (bookDialog.kind === 'create') void onCreateBook(name)
              else void onRenameBook?.(bookDialog.book.id, name)
              setBookDialog(null)
              restoreFocus()
            }}>
              <label htmlFor={nameId}>Nazwa księgi</label>
              <input ref={nameRef} id={nameId} name="bookName" defaultValue={bookDialog.kind === 'rename' ? bookDialog.book.name : ''} autoComplete="off" placeholder={untitledBookLabel} />
              <div>
                <button type="button" onClick={closeBookDialog}>Anuluj</button>
                <button ref={submitRef} type="submit" className="home__primary">{bookDialog.kind === 'create' ? 'Utwórz księgę' : 'Zapisz nazwę'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteBook && (
        <div className="home__dialog-backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby={deleteTitleId} className="home__dialog" onKeyDown={(event) => trapDialogFocus(event, cancelDeleteRef, confirmDeleteRef, () => {
            setDeleteBook(null)
            restoreFocus()
          })}>
            <h2 id={deleteTitleId}>Usunąć księgę {getBookDisplayName(deleteBook.name)}?</h2>
            <p>Ta czynność usunie księgę, wszystkie jej tablice, symbole i obrazy z tego urządzenia.</p>
            <div className="home__dialog-actions">
              <button ref={cancelDeleteRef} type="button" onClick={() => {
                setDeleteBook(null)
                restoreFocus()
              }}>Anuluj</button>
              <button ref={confirmDeleteRef} type="button" className="home__danger" onClick={() => {
                void onDeleteBook?.(deleteBook.id)
                setDeleteBook(null)
                restoreFocus()
              }}>Usuń księgę</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
