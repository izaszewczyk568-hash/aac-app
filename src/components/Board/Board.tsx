import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { Board as BoardModel } from '../../domain/communicationBook'
import './Board.css'

export type BoardMode = 'edit' | 'use'
export type SaveStatus = 'saving' | 'saved' | 'error'

export interface BoardProps {
  board: BoardModel
  mode: BoardMode
  saveStatus?: SaveStatus
  children?: ReactNode
  onNameChange?: (name: string) => void
  onBack?: () => void
  onStartUse?: () => void
  onAddSymbol?: () => void
}

const saveStatusLabels: Record<SaveStatus, string> = {
  saving: 'Zapisywanie…',
  saved: 'Zapisano wszystkie zmiany',
  error: 'Nie udało się zapisać zmian',
}

const untitledBoardLabel = 'Tablica bez tytułu'

function NavigationButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}>
      {children}
    </button>
  )
}

export function Board({
  board,
  mode,
  saveStatus = 'saved',
  children,
  onNameChange,
  onBack,
  onStartUse,
  onAddSymbol,
}: BoardProps) {
  const [name, setName] = useState(board.name)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isWorkspaceFullScreen, setIsWorkspaceFullScreen] = useState(false)
  const nameInputId = useId()
  const gridHeadingId = useId()
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const lastMenuItemRef = useRef<HTMLButtonElement>(null)
  const workspaceRef = useRef<HTMLElement>(null)
  const isEditMode = mode === 'edit'
  const displayName = name.trim() || untitledBoardLabel
  const isEmpty = board.symbols.length === 0
  const gridStyle = {
    '--board-columns': board.columns,
  } as CSSProperties

  useEffect(() => {
    if (isMoreMenuOpen) {
      firstMenuItemRef.current?.focus()
    }
  }, [isMoreMenuOpen])

  useEffect(() => {
    function handleFullScreenChange() {
      setIsWorkspaceFullScreen(
        document.fullscreenElement === workspaceRef.current,
      )
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
    }
  }, [])

  function handleNameChange(nextName: string) {
    setName(nextName)
    onNameChange?.(nextName)
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsMoreMenuOpen(false)
      moreButtonRef.current?.focus()
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      firstMenuItemRef.current?.focus()
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      lastMenuItemRef.current?.focus()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const isFirstItem = document.activeElement === firstMenuItemRef.current
      const moveToFirst = !isFirstItem
      ;(moveToFirst ? firstMenuItemRef : lastMenuItemRef).current?.focus()
    }
  }

  function enterWorkspaceFullScreen() {
    const requestFullScreen = workspaceRef.current?.requestFullscreen
    if (requestFullScreen) {
      void requestFullScreen.call(workspaceRef.current).catch(() => undefined)
    }
  }

  function exitWorkspaceFullScreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }

  return (
    <main className={`board board--${mode}`}>
      <header className="board__header">
        <div className="board__navigation">
          <NavigationButton onClick={onBack}>← Strona główna</NavigationButton>
        </div>

        {isEditMode ? (
          <div className="board__title-field">
            <h1 className="board__visually-hidden">Edycja tablicy: {displayName}</h1>
            <label htmlFor={nameInputId}>Nazwa tablicy</label>
            <input
              id={nameInputId}
              type="text"
              value={name}
              placeholder={untitledBoardLabel}
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </div>
        ) : (
          <h1 className="board__title">{displayName}</h1>
        )}

        {!isEditMode && (
          <button
            type="button"
            className="board__primary board__fullscreen"
            onClick={enterWorkspaceFullScreen}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5" />
            </svg>
            Pełny ekran
          </button>
        )}

        {isEditMode && (
          <div className="board__edit-actions">
            <div className="board__history-actions" aria-label="Historia zmian">
              <button type="button" aria-label="Cofnij" disabled>
                ↶
              </button>
              <button type="button" aria-label="Ponów" disabled>
                ↷
              </button>
            </div>
            <p
              className={`board__save-status board__save-status--${saveStatus}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {saveStatusLabels[saveStatus]}
            </p>
            <button
              type="button"
              className="board__primary"
              onClick={onStartUse}
              disabled={!onStartUse}
            >
              Uruchom tablicę
            </button>
            <div className="board__more-actions">
              <button
                ref={moreButtonRef}
                type="button"
                className="board__more-button"
                aria-label="Więcej opcji tablicy"
                aria-expanded={isMoreMenuOpen}
                aria-controls="board-more-menu"
                onClick={() => setIsMoreMenuOpen((isOpen) => !isOpen)}
              >
                ⋮
              </button>
              {isMoreMenuOpen && (
                <div
                  id="board-more-menu"
                  className="board__menu"
                  role="menu"
                  aria-label="Więcej opcji tablicy"
                  onKeyDown={handleMenuKeyDown}
                >
                  <button
                    ref={firstMenuItemRef}
                    type="button"
                    role="menuitem"
                    aria-disabled="true"
                  >
                    <svg
                      className="board__menu-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" />
                    </svg>
                    Eksportuj tablicę
                  </button>
                  <button
                    ref={lastMenuItemRef}
                    type="button"
                    className="board__danger-action"
                    role="menuitem"
                    aria-disabled="true"
                  >
                    <svg
                      className="board__menu-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                    </svg>
                    Usuń tablicę
                  </button>
                  <p>Te akcje nie są jeszcze dostępne.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <section
        ref={workspaceRef}
        className="board__content"
        aria-labelledby={gridHeadingId}
      >
        {isWorkspaceFullScreen && (
          <button
            type="button"
            className="board__exit-fullscreen"
            aria-label="Zamknij pełny ekran"
            onClick={exitWorkspaceFullScreen}
          >
            ×
          </button>
        )}
        {isEmpty ? (
          <div className="board__empty-state">
            <h2 id={gridHeadingId}>Ta tablica nie ma jeszcze symboli.</h2>
            {isEditMode && (
              <>
                <p>Dodaj pierwszy symbol, aby rozpocząć tworzenie tablicy.</p>
                <button
                  type="button"
                  className="board__primary"
                  onClick={onAddSymbol}
                  disabled={!onAddSymbol}
                >
                  + Dodaj symbol
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <h2 id={gridHeadingId} className="board__visually-hidden">
              Symbole tablicy
            </h2>
            <ul className="board__grid" style={gridStyle}>
              {children}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}
