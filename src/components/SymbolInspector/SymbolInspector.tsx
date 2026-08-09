import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { Symbol as SymbolModel } from '../../domain/communicationBook'
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

  const deleteName = symbol.label.trim() || 'symbol bez nazwy'
  function closeDeleteDialog() {
    setIsDeleteOpen(false)
    window.setTimeout(() => openDeleteRef.current?.focus())
  }

  return (
    <aside
      ref={inspectorRef}
      className="symbol-inspector"
      style={position}
      aria-labelledby={titleId}
    >
      <header className="symbol-inspector__header">
        <h2 id={titleId}>Ustawienia symbolu</h2>
        <button type="button" aria-label="Zamknij ustawienia symbolu" onClick={onClose}>×</button>
      </header>

      <div className="symbol-inspector__fields">
        <label>
          Nazwa symbolu
          <input aria-describedby={nameHelpId} value={symbol.label} onChange={(e) => onChange({ label: e.target.value })} />
        </label>
        <p id={nameHelpId} className="symbol-inspector__help">Ta sama nazwa będzie widoczna na kafelku i odczytywana na głos.</p>

        <label>Grubość obramowania (px)<input type="number" min="0" max="12" value={symbol.borderWidth} onChange={(e) => onChange({ borderWidth: Math.min(12, Math.max(0, Number(e.target.value))) })} /></label>
        <label>Kolor obramowania<input type="color" value={symbol.borderColor} onChange={(e) => onChange({ borderColor: e.target.value })} /></label>
        <label>Kolor tekstu<input type="color" value={symbol.textColor} onChange={(e) => onChange({ textColor: e.target.value })} /></label>

        <label>
          Połącz z tablicą
          <select value={symbol.linkedBoardId ?? ''} onChange={(e) => onChange({ linkedBoardId: e.target.value || null })}>
            <option value="">Brak połączenia</option>
            {boards.filter((board) => board.id !== currentBoardId).map((board) => (
              <option key={board.id} value={board.id}>
                {board.name.trim() || 'Tablica bez tytułu'} — {board.bookName.trim() || 'Księga bez tytułu'}
              </option>
            ))}
          </select>
        </label>
        <button ref={openCreateRef} type="button" onClick={() => setIsCreateOpen(true)} disabled={!onCreateLinkedBoard}>+ Utwórz nową tablicę</button>

        <label>
          Czas zatwierdzenia wzrokiem
          <select value={symbol.dwellTime ?? ''} onChange={(e) => onChange({ dwellTime: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Użyj ustawienia tablicy</option>
            {dwellOptions.map((value) => <option key={value} value={value}>{String(value / 1000).replace('.', ',')} s</option>)}
          </select>
        </label>
      </div>

      <button ref={openDeleteRef} type="button" className="symbol-inspector__danger" onClick={() => setIsDeleteOpen(true)}>Usuń symbol</button>

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
            <h3 id={createTitleId}>Utwórz nową tablicę</h3>
            <form onSubmit={(event) => {
              event.preventDefault()
              const name = String(new FormData(event.currentTarget).get('boardName') ?? '')
              void onCreateLinkedBoard?.(name)
              setIsCreateOpen(false)
              window.setTimeout(() => openCreateRef.current?.focus())
            }}>
              <label htmlFor={createNameId}>Nazwa tablicy</label>
              <input ref={createNameRef} id={createNameId} name="boardName" placeholder="Tablica bez tytułu" autoComplete="off" />
              <div>
                <button type="button" onClick={() => {
                  setIsCreateOpen(false)
                  window.setTimeout(() => openCreateRef.current?.focus())
                }}>Anuluj</button>
                <button ref={createSubmitRef} type="submit">Utwórz tablicę</button>
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
            <h3 id={`${titleId}-delete`}>Usunąć {deleteName}?</h3>
            <p>Ta czynność usunie symbol z bieżącej tablicy.</p>
            <div>
              <button ref={cancelDeleteRef} type="button" onClick={closeDeleteDialog}>Anuluj</button>
              <button ref={confirmDeleteRef} type="button" className="symbol-inspector__danger" onClick={onDelete}>Usuń symbol</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
