import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Symbol as SymbolModel } from '../../domain/communicationBook'
import './SymbolTile.css'

export interface SymbolTileProps {
  symbol: SymbolModel
  imageSource?: string
  mode: 'edit' | 'use'
  selected?: boolean
  onSelect?: (symbolId: string) => void
  onActivate?: (symbol: SymbolModel) => void
  dwellEnabled?: boolean
  dwellTime?: number
}

export function SymbolTile({
  symbol,
  imageSource,
  mode,
  selected = false,
  onSelect,
  onActivate,
  dwellEnabled = false,
  dwellTime = 1000,
}: SymbolTileProps) {
  const [isDwelling, setIsDwelling] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const activatedTimer = useRef<number | undefined>(undefined)
  const dwellConsumed = useRef(false)
  const label = symbol.label.trim()
  const accessibleLabel = label || 'Symbol bez podpisu'
  const tileStyle = {
    '--symbol-border-color': symbol.borderColor,
    '--symbol-border-width': `${symbol.borderWidth}px`,
    '--symbol-text-color': symbol.textColor,
    '--symbol-dwell-duration': `${dwellTime}ms`,
  } as CSSProperties
  const imageStyle = symbol.image
    ? {
        transform: `rotate(${symbol.image.rotation}deg) scale(${symbol.image.scale})`,
      }
    : undefined
  const content = (
    <>
      <span className="symbol-tile__label" aria-hidden={!label}>
        {label || (mode === 'edit' ? 'Bez podpisu' : '\u00a0')}
      </span>
      <span className="symbol-tile__image-area">
        {imageSource && (
          <img
            src={imageSource}
            alt=""
            className="symbol-tile__image"
            style={imageStyle}
          />
        )}
      </span>
      {selected && <span className="symbol-tile__selected-label">Wybrano</span>}
      {mode === 'use' && !label && (
        <span className="symbol-tile__visually-hidden">Symbol bez podpisu</span>
      )}
      {mode === 'use' && isDwelling && (
        <span
          className="symbol-tile__dwell-progress"
          aria-hidden="true"
          onAnimationEnd={() => {
            setIsDwelling(false)
            activate()
          }}
        />
      )}
      {mode === 'use' && isActivated && (
        <span className="symbol-tile__activated-label" aria-live="polite">
          Aktywowano
        </span>
      )}
    </>
  )

  useEffect(() => () => window.clearTimeout(activatedTimer.current), [])

  function activate() {
    if (isDwelling) dwellConsumed.current = true
    setIsDwelling(false)
    window.clearTimeout(activatedTimer.current)
    setIsActivated(true)
    activatedTimer.current = window.setTimeout(() => setIsActivated(false), 700)
    onActivate?.(symbol)
  }

  return (
    <li className="symbol-tile-wrapper">
      {mode === 'edit' ? (
        <button
          data-symbol-id={symbol.id}
          type="button"
          className="symbol-tile symbol-tile--interactive"
          style={tileStyle}
          aria-label={`Wybierz symbol: ${accessibleLabel}`}
          aria-pressed={selected}
          onClick={() => onSelect?.(symbol.id)}
        >
          {content}
        </button>
      ) : (
        <button
          type="button"
          className="symbol-tile symbol-tile--interactive symbol-tile--use"
          style={tileStyle}
          data-symbol-id={symbol.id}
          aria-label={accessibleLabel}
          onClick={activate}
          onPointerEnter={() =>
            dwellEnabled && !dwellConsumed.current && setIsDwelling(true)
          }
          onPointerLeave={() => {
            setIsDwelling(false)
            dwellConsumed.current = false
          }}
        >
          {content}
        </button>
      )}
    </li>
  )
}
