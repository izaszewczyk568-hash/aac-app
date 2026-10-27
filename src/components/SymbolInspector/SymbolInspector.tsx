import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { Add01Icon, Cancel01Icon, Delete02Icon, Settings02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Symbol as SymbolModel } from '../../domain/communicationBook'
import { SelectControl } from '../SelectControl/SelectControl'
import './SymbolInspector.css'

export interface LinkedBoardOption {
  id: string
  name: string
  bookName: string
}

export interface SymbolInspectorProps {
  symbol: SymbolModel
  currentBoardId: string
  boards: LinkedBoardOption[]
  onChange: (changes: Partial<SymbolModel>) => void
  onClose: () => void
  onDelete: () => void
  onCreateLinkedBoard?: (name: string) => void | Promise<void>
}

const dwellOptions = [500, 1000, 1500, 2000, 3000]

export function SymbolInspector({
  symbol,
  currentBoardId,
  boards,
  onChange,
  onClose,
  onDelete,
  onCreateLinkedBoard,
}: SymbolInspectorProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [position, setPosition] = useState<CSSProperties>({})
  const titleId = useId()
  const createTitleId = useId()
  const createNameId = useId()
  const nameHelpId = useId()
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)
  const openDeleteRef = useRef<HTMLButtonElement>(null)
  const openCreateRef = useRef<HTMLButtonElement>(null)
  const createNameRef = useRef<HTMLInputElement>(null)
  const createSubmitRef = useRef<HTMLButtonElement>(null)
  const inspectorRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function updatePosition() {
      const anchor = document.querySelector<HTMLElement>(
        `[data-symbol-id="${CSS.escape(symbol.id)}"]`,
      )
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const measuredWidth = inspectorRef.current?.getBoundingClientRect().width ?? 0
      const panelWidth = measuredWidth || Math.min(448, window.innerWidth - 32)
      const gap = 16
      const left =
        rect.right + gap + panelWidth <= window.innerWidth - gap
          ? rect.right + gap
          : Math.max(gap, rect.left - panelWidth - gap)
      setPosition({ left, top: Math.max(gap, Math.min(rect.top, 80)) })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [symbol.id])

  useEffect(() => {
    if (isDeleteOpen) cancelDeleteRef.current?.focus()
  }, [isDeleteOpen])

  useEffect(() => {
    if (isCreateOpen) createNameRef.current?.focus()
  }, [isCreateOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isCreateOpen && !isDeleteOpen) {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isCreateOpen, isDeleteOpen, onClose])

  const deleteName = symbol.label.trim() || 'symbol bez nazwy'
  function closeDeleteDialog() {
    setIsDeleteOpen(false)
    window.setTimeout(() => openDeleteRef.current?.focus())
  }

  return (
    <div
      className="symbol-inspector__backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !isCreateOpen && !isDeleteOpen) onClose()
      }}
    >
      <aside
        ref={inspectorRef}
        className="symbol-inspector"
        style={position}
        aria-labelledby={titleId}
      >
      <header className="symbol-inspector__header">
        <div>
          <span className="symbol-inspector__header-icon" aria-hidden="true">
            <HugeiconsIcon icon={Settings02Icon} size={20} strokeWidth={1.8} />
          </span>
          <div>
            <h2 id={titleId}>Ustawienia symbolu</h2>
            <p>Dostosuj treść, wygląd i działanie kafelka.</p>
          </div>
        </div>
        <button type="button" aria-label="Zamknij ustawienia symbolu" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="symbol-inspector__fields">
        <fieldset className="symbol-inspector__section">
          <legend>Treść</legend>
          <label>
            Nazwa symbolu
            <input aria-describedby={nameHelpId} value={symbol.label} onChange={(e) => onChange({ label: e.target.value })} />
          </label>
          <p id={nameHelpId} className="symbol-inspector__help">Ta sama nazwa będzie widoczna na kafelku i odczytywana na głos.</p>
        </fieldset>

        <fieldset className="symbol-inspector__section">
          <legend>Wygląd</legend>
          <label>Grubość obramowania (px)<input type="number" min="0" max="12" value={symbol.borderWidth} onChange={(e) => onChange({ borderWidth: Math.min(12, Math.max(0, Number(e.target.value))) })} /></label>
          <div className="symbol-inspector__color-grid">
            <label>Kolor obramowania<input type="color" value={symbol.borderColor} onChange={(e) => onChange({ borderColor: e.target.value })} /></label>
            <label>Kolor tekstu<input type="color" value={symbol.textColor} onChange={(e) => onChange({ textColor: e.target.value })} /></label>
          </div>
        </fieldset>

        <fieldset className="symbol-inspector__section">
          <legend>Działanie</legend>
          <label>
            Połącz z tablicą
            <SelectControl value={symbol.linkedBoardId ?? ''} onChange={(e) => onChange({ linkedBoardId: e.target.value || null })}>
              <option value="">Brak połączenia</option>
              {boards.filter((board) => board.id !== currentBoardId).map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name.trim() || 'Tablica bez tytułu'} — {board.bookName.trim() || 'Księga bez tytułu'}
                </option>
              ))}
            </SelectControl>
          </label>
          <button ref={openCreateRef} type="button" className="symbol-inspector__secondary" aria-label="+ Utwórz nową tablicę" onClick={() => setIsCreateOpen(true)} disabled={!onCreateLinkedBoard}>
            <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden="true" />
            Utwórz nową tablicę
          </button>

          <label>
            Czas zatwierdzenia wzrokiem
            <SelectControl value={symbol.dwellTime ?? ''} onChange={(e) => onChange({ dwellTime: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Użyj ustawienia tablicy</option>
              {dwellOptions.map((value) => <option key={value} value={value}>{String(value / 1000).replace('.', ',')} s</option>)}
            </SelectControl>
          </label>
        </fieldset>
      </div>

      <footer className="symbol-inspector__footer">
        <button ref={openDeleteRef} type="button" className="symbol-inspector__danger" onClick={() => setIsDeleteOpen(true)}>
          <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
          Usuń symbol
        </button>
      </footer>

      {isCreateOpen && (
        <div className="symbol-inspector__dialog-backdrop">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={createTitleId}
            className="symbol-inspector__dialog"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setIsCreateOpen(false)
                window.setTimeout(() => openCreateRef.current?.focus())
              } else if (event.key === 'Tab') {
                if (event.shiftKey && document.activeElement === createNameRef.current) {
                  event.preventDefault()
                  createSubmitRef.current?.focus()
                } else if (!event.shiftKey && document.activeElement === createSubmitRef.current) {
                  event.preventDefault()
                  createNameRef.current?.focus()
                }
              }
            }}
          >
            <div className="symbol-inspector__dialog-heading">
              <span className="symbol-inspector__dialog-icon" aria-hidden="true">
                <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} />
              </span>
              <div>
                <h3 id={createTitleId}>Utwórz nową tablicę</h3>
                <p>Nowa tablica zostanie połączona z tym symbolem.</p>
              </div>
            </div>
            <form onSubmit={(event) => {
              event.preventDefault()
              const name = String(new FormData(event.currentTarget).get('boardName') ?? '')
              void onCreateLinkedBoard?.(name)
              setIsCreateOpen(false)
              window.setTimeout(() => openCreateRef.current?.focus())
            }}>
              <label htmlFor={createNameId}>Nazwa tablicy</label>
              <input ref={createNameRef} id={createNameId} name="boardName" placeholder="Tablica bez tytułu" autoComplete="off" />
              <div className="symbol-inspector__dialog-actions">
                <button type="button" className="symbol-inspector__dialog-secondary" onClick={() => {
                  setIsCreateOpen(false)
                  window.setTimeout(() => openCreateRef.current?.focus())
                }}>Anuluj</button>
                <button ref={createSubmitRef} type="submit" className="symbol-inspector__primary">Utwórz tablicę</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="symbol-inspector__dialog-backdrop">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-delete`}
            className="symbol-inspector__dialog"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                closeDeleteDialog()
              }
              if (event.key === 'Tab') {
                const movingBack = event.shiftKey
                const atFirst = document.activeElement === cancelDeleteRef.current
                const atLast = document.activeElement === confirmDeleteRef.current
                if ((movingBack && atFirst) || (!movingBack && atLast)) {
                  event.preventDefault()
                  ;(movingBack ? confirmDeleteRef : cancelDeleteRef).current?.focus()
                }
              }
            }}
          >
            <div className="symbol-inspector__dialog-heading">
              <span className="symbol-inspector__dialog-icon symbol-inspector__dialog-icon--danger" aria-hidden="true">
                <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h3 id={`${titleId}-delete`}>Usunąć {deleteName}?</h3>
                <p>Ta czynność usunie symbol z bieżącej tablicy.</p>
              </div>
            </div>
            <div className="symbol-inspector__dialog-actions">
              <button ref={cancelDeleteRef} type="button" className="symbol-inspector__dialog-secondary" onClick={closeDeleteDialog}>Anuluj</button>
              <button ref={confirmDeleteRef} type="button" className="symbol-inspector__danger" onClick={onDelete}>
                <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                Usuń symbol
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </div>
  )
}
