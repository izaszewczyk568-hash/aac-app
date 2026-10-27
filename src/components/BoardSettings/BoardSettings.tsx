import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Cancel01Icon, Settings02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Board } from '../../domain/communicationBook'
import { SelectControl } from '../SelectControl/SelectControl'
import './BoardSettings.css'

export interface BoardSettingsProps {
  board: Board
  onChange: (changes: Partial<Board>) => void
  onClose: () => void
}

const dwellOptions = [500, 1000, 1500, 2000, 3000]
const columnOptions = [2, 3, 4, 5, 6]

export function BoardSettings({ board, onChange, onClose }: BoardSettingsProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const columnsRef = useRef<HTMLSelectElement>(null)
  const lastFieldRef = useRef<HTMLSelectElement>(null)
  const coverSymbolOptions = [...board.symbols]
    .filter((symbol) => symbol.image)
    .sort((first, second) => first.position - second.position)

  useEffect(() => columnsRef.current?.focus(), [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === closeRef.current) {
        event.preventDefault()
        lastFieldRef.current?.focus()
      } else if (!event.shiftKey && document.activeElement === lastFieldRef.current) {
        event.preventDefault()
        closeRef.current?.focus()
      }
    }
  }

  return (
    <div className="board-settings__backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="board-settings" onKeyDown={handleKeyDown}>
        <header>
          <h2 id={titleId}>
            <HugeiconsIcon icon={Settings02Icon} size={22} strokeWidth={1.8} aria-hidden="true" />
            Ustawienia tablicy
          </h2>
          <button ref={closeRef} type="button" aria-label="Zamknij ustawienia tablicy" onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <div className="board-settings__fields">
          <label>
            Liczba kolumn
            <SelectControl ref={columnsRef} value={board.columns} onChange={(event) => onChange({ columns: Number(event.target.value) })}>
              {columnOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </SelectControl>
          </label>
          <label>
            Domyślny czas zatwierdzenia wzrokiem
            <SelectControl value={board.defaultDwellTime} onChange={(event) => onChange({ defaultDwellTime: Number(event.target.value) })}>
              {dwellOptions.map((value) => <option key={value} value={value}>{String(value / 1000).replace('.', ',')} s</option>)}
            </SelectControl>
          </label>
          <label>
            Domyślna grubość obramowania
            <input type="number" min="0" max="12" value={board.defaultBorderWidth} onChange={(event) => onChange({ defaultBorderWidth: Math.min(12, Math.max(0, Number(event.target.value))) })} />
          </label>
          <label>
            Domyślny kolor obramowania
            <input type="color" value={board.defaultBorderColor} onChange={(event) => onChange({ defaultBorderColor: event.target.value })} />
          </label>
          <label>
            Domyślny kolor tekstu
            <input type="color" value={board.defaultTextColor} onChange={(event) => onChange({ defaultTextColor: event.target.value })} />
          </label>
          <label>
            Symbol okładki <span>(opcjonalnie)</span>
            <SelectControl
              ref={lastFieldRef}
              value={board.coverSymbolId ?? ''}
              onChange={(event) => onChange({ coverSymbolId: event.target.value || null })}
            >
              <option value="">Automatyczna okładka</option>
              {coverSymbolOptions.map((symbol) => (
                <option key={symbol.id} value={symbol.id}>
                  {symbol.label.trim() || 'Symbol bez nazwy'}
                </option>
              ))}
            </SelectControl>
          </label>
        </div>
        <p>Ustawienia domyślne dotyczą nowych symboli. Okładka służy do wyboru tej tablicy w księdze.</p>
      </div>
    </div>
  )
}
