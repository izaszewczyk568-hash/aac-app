import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  Add01Icon,
  AlertCircleIcon,
  ArrowLeft02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Download04Icon,
  Edit02Icon,
  FullScreenIcon,
  GridViewIcon,
  Home01Icon,
  Loading03Icon,
  MoreVerticalIcon,
  PlayIcon,
  Settings02Icon,
  VolumeHighIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Board as BoardModel } from '../../domain/communicationBook'
import { BoardSettings } from '../BoardSettings/BoardSettings'
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
  backLabel?: string
  onGoToMain?: () => void
  onStartUse?: () => void
  onStartEdit?: () => void
  onAddSymbol?: () => void
  onRepeat?: () => void
  canRepeat?: boolean
  dwellEnabled?: boolean
  onSettingsChange?: (changes: Partial<BoardModel>) => void
}

const saveStatusLabels: Record<SaveStatus, string> = {
  saving: 'Zapisywanie…',
  saved: 'Zapisano wszystkie zmiany',
  error: 'Nie udało się zapisać zmian',
}

const saveStatusIcons = {
  saving: Loading03Icon,
  saved: CheckmarkCircle02Icon,
  error: AlertCircleIcon,
}

const untitledBoardLabel = 'Tablica bez tytułu'

function NavigationButton({
  children,
  onClick,
  dwellEnabled = false,
  dwellTime,
  iconSize = 18,
}: {
  children: ReactNode
  onClick?: () => void
  dwellEnabled?: boolean
  dwellTime: number
  iconSize?: number
}) {
  const [isDwelling, setIsDwelling] = useState(false)
  const dwellConsumed = useRef(false)

  function activate() {
    dwellConsumed.current = true
    setIsDwelling(false)
    onClick?.()
  }

  return (
    <button
      type="button"
      className="board__navigation-button"
      style={{ '--navigation-dwell-duration': `${dwellTime}ms` } as CSSProperties}
      aria-label={`← ${String(children)}`}
      onClick={activate}
      onPointerEnter={() => {
        if (dwellEnabled && !dwellConsumed.current) setIsDwelling(true)
      }}
      onPointerLeave={() => {
        setIsDwelling(false)
        dwellConsumed.current = false
      }}
      disabled={!onClick}
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} size={iconSize} strokeWidth={2} aria-hidden="true" />
      {children}
      {isDwelling && (
        <span
          className="board__navigation-dwell-progress"
          aria-hidden="true"
          onAnimationEnd={() => {
            if (!dwellConsumed.current) activate()
          }}
        />
      )}
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
  backLabel = 'Strona główna',
  onGoToMain,
  onStartUse,
  onStartEdit,
  onAddSymbol,
  onRepeat,
  canRepeat = false,
  dwellEnabled = false,
  onSettingsChange,
}: BoardProps) {
  const [name, setName] = useState(board.name)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isWorkspaceFullScreen, setIsWorkspaceFullScreen] = useState(false)
  const [isExitFullScreenDwelling, setIsExitFullScreenDwelling] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const nameInputId = useId()
  const gridHeadingId = useId()
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const lastMenuItemRef = useRef<HTMLButtonElement>(null)
  const workspaceRef = useRef<HTMLElement>(null)
  const exitFullScreenDwellConsumedRef = useRef(false)
  const isEditMode = mode === 'edit'
  const displayName = name.trim() || untitledBoardLabel
  const fullScreenBackLabel = backLabel === 'Wróć'
    ? 'Wróć do poprzedniej tablicy'
    : backLabel
  const isEmpty = board.symbols.length === 0
  const gridStyle = {
    '--board-columns': board.columns,
    '--board-column-width': `calc(${100 / board.columns}% - ${(board.columns - 1) / board.columns}rem)`,
  } as CSSProperties

  useEffect(() => {
    if (isMoreMenuOpen) {
      firstMenuItemRef.current?.focus()
    }
  }, [isMoreMenuOpen])

  useEffect(() => {
    setName(board.name)
  }, [board.id, board.name])

  useEffect(() => {
    function handleFullScreenChange() {
      const fullScreenElement = document.fullscreenElement
      const workspace = workspaceRef.current
      const isFullScreen = Boolean(
        fullScreenElement && workspace && (
          fullScreenElement === workspace || fullScreenElement.contains(workspace)
        ),
      )
      setIsWorkspaceFullScreen(isFullScreen)
      if (!isFullScreen) {
        setIsExitFullScreenDwelling(false)
        exitFullScreenDwellConsumedRef.current = false
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    handleFullScreenChange()
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

  function activateFullScreenExit() {
    exitFullScreenDwellConsumedRef.current = true
    setIsExitFullScreenDwelling(false)
    exitWorkspaceFullScreen()
  }

  return (
    <main className={`board board--${mode}`}>
      <header className="board__header">
        <div className="board__navigation">
          <NavigationButton
            onClick={onBack}
            dwellEnabled={!isEditMode && dwellEnabled}
            dwellTime={board.defaultDwellTime}
          >
            {backLabel}
          </NavigationButton>
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

        {!isEditMode && <div className="board__use-actions">
          {onGoToMain && (
            <button type="button" onClick={onGoToMain}>
              <HugeiconsIcon icon={Home01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
              Tablica główna
            </button>
          )}
          <button type="button" onClick={onRepeat} disabled={!canRepeat}>
            <HugeiconsIcon icon={VolumeHighIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
            Powtórz
          </button>
          <button type="button" onClick={onStartEdit} disabled={!onStartEdit}>
            <HugeiconsIcon icon={Edit02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
            Edytuj tablicę
          </button>
          <button
            type="button"
            className="board__primary board__fullscreen"
            onClick={enterWorkspaceFullScreen}
          >
            <HugeiconsIcon icon={FullScreenIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
            Pełny ekran
          </button>
        </div>}

        {isEditMode && (
          <div className="board__edit-actions">
            <p
              className={`board__save-status board__save-status--${saveStatus}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <HugeiconsIcon
                className={saveStatus === 'saving' ? 'board__status-icon--spinning' : undefined}
                icon={saveStatusIcons[saveStatus]}
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              {saveStatusLabels[saveStatus]}
            </p>
            <button
              type="button"
              className="board__primary"
              onClick={onStartUse}
              disabled={!onStartUse}
            >
              <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={2} aria-hidden="true" />
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
                <HugeiconsIcon icon={MoreVerticalIcon} size={20} strokeWidth={2} aria-hidden="true" />
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
                    onClick={() => {
                      setIsMoreMenuOpen(false)
                      setIsSettingsOpen(true)
                    }}
                  >
                    <HugeiconsIcon icon={Settings02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                    Ustawienia tablicy
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    aria-disabled="true"
                  >
                    <HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                    Eksportuj tablicę
                  </button>
                  <button
                    ref={lastMenuItemRef}
                    type="button"
                    className="board__danger-action"
                    role="menuitem"
                    aria-disabled="true"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                    Usuń tablicę
                  </button>
                  <p>Eksport i usuwanie nie są jeszcze dostępne.</p>
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
        {isWorkspaceFullScreen && !isEditMode && onBack && (
          <div className="board__fullscreen-navigation">
            <NavigationButton
              onClick={onBack}
              dwellEnabled={dwellEnabled}
              dwellTime={board.defaultDwellTime}
              iconSize={26}
            >
              {fullScreenBackLabel}
            </NavigationButton>
          </div>
        )}
        {isWorkspaceFullScreen && (
          <button
            type="button"
            className="board__exit-fullscreen"
            aria-label="Zamknij pełny ekran"
            style={{ '--exit-fullscreen-dwell-duration': `${board.defaultDwellTime}ms` } as CSSProperties}
            onClick={activateFullScreenExit}
            onPointerEnter={() => {
              if (dwellEnabled && !exitFullScreenDwellConsumedRef.current) {
                setIsExitFullScreenDwelling(true)
              }
            }}
            onPointerLeave={() => {
              setIsExitFullScreenDwelling(false)
              exitFullScreenDwellConsumedRef.current = false
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={2} aria-hidden="true" />
            {isExitFullScreenDwelling && (
              <span
                className="board__exit-fullscreen-dwell-progress"
                aria-hidden="true"
                onAnimationEnd={() => {
                  if (!exitFullScreenDwellConsumedRef.current) activateFullScreenExit()
                }}
              />
            )}
          </button>
        )}
        {isEmpty ? (
          <div className="board__empty-state">
            <span className="board__empty-icon" aria-hidden="true">
              <HugeiconsIcon icon={GridViewIcon} size={26} strokeWidth={1.6} />
            </span>
            <h2 id={gridHeadingId}>Ta tablica nie ma jeszcze symboli.</h2>
            {isEditMode && (
              <>
                <p>Dodaj pierwszy symbol, aby rozpocząć tworzenie tablicy.</p>
                <button
                  type="button"
                  className="board__primary"
                  aria-label="+ Dodaj symbol"
                  onClick={onAddSymbol}
                  disabled={!onAddSymbol}
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden="true" />
                  Dodaj symbol
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
            {isEditMode && (
              <button
                type="button"
                className="board__primary board__add-symbol-floating"
                aria-label="+ Dodaj symbol"
                onClick={onAddSymbol}
                disabled={!onAddSymbol}
              >
                <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden="true" />
                Dodaj symbol
              </button>
            )}
          </>
        )}
      </section>
      {isSettingsOpen && (
        <BoardSettings
          board={board}
          onChange={(changes) => onSettingsChange?.(changes)}
          onClose={() => {
            setIsSettingsOpen(false)
            window.setTimeout(() => moreButtonRef.current?.focus())
          }}
        />
      )}
    </main>
  )
}
