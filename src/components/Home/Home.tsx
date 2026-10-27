import { useEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type RefObject } from 'react'
import {
  Add01Icon,
  AlertCircleIcon,
  BookEditIcon,
  BookOpen01Icon,
  Delete02Icon,
  FileExportIcon,
  FileUploadIcon,
  FolderOpenIcon,
  FullScreenIcon,
  MoreVerticalIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { CommunicationBook } from '../../domain/communicationBook'
import { SelectControl } from '../SelectControl/SelectControl'
import { getBoardCountLabel, getBookDisplayName, untitledBookLabel } from './homeUtils'
import './Home.css'

export interface HomeProps {
  books: CommunicationBook[]
  onCreateBook: (name: string, coverFile: File | null) => void | Promise<void>
  onOpenBook: (bookId: string) => void
  onManageBook?: (bookId: string) => void
  onRenameBook?: (bookId: string, name: string, coverSymbolId: string | null) => void | Promise<void>
  onDeleteBook?: (bookId: string) => void | Promise<void>
  onImportBook?: (file: File) => void | Promise<void>
  onExportBook?: (bookId: string) => void | Promise<void>
  thumbnailSources?: Record<string, string>
  dwellEnabled?: boolean
  isChildFullScreen?: boolean
  onStartChildFullScreen?: () => void
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
  onManage?: () => void
  onEdit?: () => void
  onExport?: () => void
  onDelete?: () => void
  dwellEnabled?: boolean
  dwellTime: number
}

export function CommunicationBookCard({
  book,
  menuKey,
  thumbnailSource,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onManage,
  onEdit,
  onExport,
  onDelete,
  dwellEnabled = false,
  dwellTime,
}: CommunicationBookCardProps) {
  const displayName = getBookDisplayName(book.name)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [isDwelling, setIsDwelling] = useState(false)
  const dwellConsumed = useRef(false)

  function selectBook() {
    dwellConsumed.current = true
    setIsDwelling(false)
    onOpen()
  }

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
      <h3 className="home__visually-hidden">{displayName}</h3>
      <button
        type="button"
        className="book-card__select"
        aria-label={`Wybierz księgę ${displayName}`}
        style={{ '--book-dwell-duration': `${dwellTime}ms` } as CSSProperties}
        onClick={selectBook}
        onPointerEnter={() => {
          if (dwellEnabled && !dwellConsumed.current) setIsDwelling(true)
        }}
        onPointerLeave={() => {
          setIsDwelling(false)
          dwellConsumed.current = false
        }}
      >
        <span className="book-card__preview" aria-hidden="true">
          {thumbnailSource
            ? <img src={thumbnailSource} alt="" />
            : <span className="book-card__placeholder">
                <HugeiconsIcon icon={BookOpen01Icon} size={64} strokeWidth={1.35} />
                <span className="home__visually-hidden">AAC</span>
              </span>}
        </span>
        <span className="book-card__details">
          <span className="book-card__meta">
            <span className="book-card__title">{displayName}</span>
            <span className="book-card__count">{getBoardCountLabel(book.boards.length)}</span>
          </span>
          <span className="book-card__open">
            <HugeiconsIcon icon={FolderOpenIcon} size={20} strokeWidth={1.8} aria-hidden="true" />
            Wybierz
          </span>
        </span>
        {isDwelling && (
          <span
            className="book-card__dwell-progress"
            aria-hidden="true"
            onAnimationEnd={() => {
              if (!dwellConsumed.current) selectBook()
            }}
          />
        )}
      </button>
      <div className="book-card__more">
        <button
          ref={menuButtonRef}
          type="button"
          data-book-menu={menuKey}
          aria-label={`Więcej opcji księgi ${displayName}`}
          aria-expanded={isMenuOpen}
          onClick={onToggleMenu}
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        {isMenuOpen && (
          <div role="menu" aria-label={`Opcje księgi ${displayName}`} onKeyDown={handleMenuKeyDown}>
            <button autoFocus type="button" role="menuitem" onClick={onManage ?? onOpen}>
              <HugeiconsIcon icon={FolderOpenIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
              Zarządzaj księgą <span className="home__visually-hidden">{displayName}</span>
            </button>
            <button type="button" role="menuitem" onClick={onEdit} disabled={!onEdit}>
              <HugeiconsIcon icon={BookEditIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
              Edytuj księgę <span className="home__visually-hidden">{displayName}</span>
            </button>
            <button type="button" role="menuitem" onClick={onExport} disabled={!onExport}>
              <HugeiconsIcon icon={FileExportIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
              Eksportuj księgę <span className="home__visually-hidden">{displayName}</span>
            </button>
            <button type="button" role="menuitem" className="book-card__danger" onClick={onDelete} disabled={!onDelete}>
              <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
              Usuń księgę <span className="home__visually-hidden">{displayName}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

type BookDialog = { kind: 'create' } | { kind: 'rename'; book: CommunicationBook }

export function Home({
  books,
  onCreateBook,
  onOpenBook,
  onManageBook,
  onRenameBook,
  onDeleteBook,
  onImportBook,
  onExportBook,
  thumbnailSources = {},
  dwellEnabled = true,
  isChildFullScreen = false,
  onStartChildFullScreen,
  transferNotice,
}: HomeProps) {
  const [bookDialog, setBookDialog] = useState<BookDialog | null>(null)
  const [deleteBook, setDeleteBook] = useState<CommunicationBook | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [bookDialogError, setBookDialogError] = useState<string | null>(null)
  const [isBookSubmitting, setIsBookSubmitting] = useState(false)
  const [bookCoverFile, setBookCoverFile] = useState<File | null>(null)
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
  const coverSymbolOptions = bookDialog?.kind === 'rename'
    ? bookDialog.book.boards.flatMap((board) => board.symbols
        .filter((symbol) => symbol.image)
        .map((symbol) => ({
          id: symbol.id,
          label: symbol.label.trim() || 'Symbol bez nazwy',
          boardName: board.name.trim() || 'Tablica bez tytułu',
        })))
    : []

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
    setBookDialogError(null)
    setIsBookSubmitting(false)
    setBookCoverFile(null)
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

  function renderCard(book: CommunicationBook) {
    const menuKey = `library-${book.id}`
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
          onManage={onManageBook ? () => onManageBook(book.id) : undefined}
          onEdit={onRenameBook ? () => startMenuAction(() => setBookDialog({ kind: 'rename', book })) : undefined}
          onExport={onExportBook ? () => startMenuAction(() => {
            void onExportBook(book.id)
            restoreFocus()
          }) : undefined}
          onDelete={onDeleteBook ? () => startMenuAction(() => setDeleteBook(book)) : undefined}
          dwellEnabled={dwellEnabled}
          dwellTime={book.boards.find((board) => board.id === book.mainBoardId)?.defaultDwellTime ?? 1500}
        />
      </li>
    )
  }

  return (
    <main className="home">
      <section className="home__hero" aria-labelledby="home-title">
        <h1 id="home-title">Rozpocznij pracę z Księgą AAC</h1>
        <div className="home__actions">
          {onStartChildFullScreen && !isChildFullScreen && (
            <button type="button" className="home__primary home__child-fullscreen" onClick={onStartChildFullScreen}>
              <HugeiconsIcon icon={FullScreenIcon} size={20} strokeWidth={1.8} aria-hidden="true" />
              Uruchom pełnoekranowy tryb dziecka
            </button>
          )}
          <div className="home__caregiver-actions">
            <button ref={createButtonRef} type="button" className="home__secondary" onClick={() => {
              returnFocusRef.current = createButtonRef.current
              setBookDialogError(null)
              setBookCoverFile(null)
              setBookDialog({ kind: 'create' })
            }}>
              <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} aria-hidden="true" />
              Utwórz nową księgę
            </button>
            <button type="button" className="home__secondary" onClick={() => importInputRef.current?.click()} disabled={!onImportBook}>
              <HugeiconsIcon icon={FileUploadIcon} size={20} strokeWidth={1.8} aria-hidden="true" />
              Importuj księgę z pliku
            </button>
          </div>
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
            {transferNotice.type === 'error' && (
              <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={1.8} aria-hidden="true" />
            )}
            <p role={transferNotice.type === 'error' ? 'alert' : 'status'} aria-live={transferNotice.type === 'error' ? 'assertive' : 'polite'}>
              {transferNotice.message}
            </p>
            {transferNotice.type === 'error' && (
              <button type="button" onClick={() => importInputRef.current?.click()}>
                <HugeiconsIcon icon={RefreshIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
                Spróbuj ponownie
              </button>
            )}
          </div>
        )}
      </section>

      <section className="home__library" aria-labelledby="library-title">
        <div className="home__library-heading">
          <span aria-hidden="true"><HugeiconsIcon icon={BookOpen01Icon} size={26} strokeWidth={1.6} /></span>
          <div>
            <h2 id="library-title">Wybierz księgę</h2>
            <p>Wybierz okładkę kliknięciem, klawiaturą lub zatrzymaniem wskaźnika.</p>
          </div>
        </div>
        {sortedBooks.length > 0 ? (
          <ul className="home__book-grid">{sortedBooks.map(renderCard)}</ul>
        ) : (
          <p className="home__library-empty">Nie ma jeszcze żadnych ksiąg. Utwórz pierwszą księgę lub zaimportuj kopię.</p>
        )}
      </section>

      {bookDialog && (
        <div className="home__dialog-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} className="home__dialog" onKeyDown={(event) => trapDialogFocus(event, nameRef, submitRef, closeBookDialog)}>
            <h2 id={dialogTitleId}>{bookDialog.kind === 'create' ? 'Utwórz nową księgę' : `Edytuj księgę ${getBookDisplayName(bookDialog.book.name)}`}</h2>
            <form onSubmit={async (event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const name = String(formData.get('bookName') ?? '')
              setBookDialogError(null)
              setIsBookSubmitting(true)
              try {
                if (bookDialog.kind === 'create') {
                  await onCreateBook(name, bookCoverFile)
                } else {
                  await onRenameBook?.(
                    bookDialog.book.id,
                    name,
                    String(formData.get('coverSymbolId') ?? '') || null,
                  )
                }
                setBookDialog(null)
                setBookCoverFile(null)
                restoreFocus()
              } catch (error) {
                setBookDialogError(error instanceof Error ? error.message : 'Nie udało się utworzyć księgi.')
              } finally {
                setIsBookSubmitting(false)
              }
            }}>
              <label htmlFor={nameId}>Nazwa księgi</label>
              <input ref={nameRef} id={nameId} name="bookName" defaultValue={bookDialog.kind === 'rename' ? bookDialog.book.name : ''} autoComplete="off" placeholder={untitledBookLabel} />
              {bookDialog.kind === 'create' && (
                <label>
                  Obraz okładki <span>(opcjonalnie)</span>
                  <input
                    name="coverImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setBookCoverFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              {bookDialog.kind === 'rename' && (
                <label>
                  Symbol okładki <span>(opcjonalnie)</span>
                  <SelectControl name="coverSymbolId" defaultValue={bookDialog.book.coverSymbolId ?? ''}>
                    <option value="">Automatyczna okładka</option>
                    {coverSymbolOptions.map((symbol) => (
                      <option key={symbol.id} value={symbol.id}>
                        {symbol.label} — {symbol.boardName}
                      </option>
                    ))}
                  </SelectControl>
                </label>
              )}
              {bookDialogError && <p className="home__dialog-error" role="alert">{bookDialogError}</p>}
              <div>
                <button type="button" onClick={closeBookDialog} disabled={isBookSubmitting}>Anuluj</button>
                <button ref={submitRef} type="submit" className="home__primary" disabled={isBookSubmitting}>
                  <HugeiconsIcon icon={bookDialog.kind === 'create' ? Add01Icon : BookEditIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
                  {isBookSubmitting ? 'Zapisywanie…' : bookDialog.kind === 'create' ? 'Utwórz księgę' : 'Zapisz zmiany'}
                </button>
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
              }}>
                <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                Usuń księgę
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
